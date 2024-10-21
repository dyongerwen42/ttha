import express from 'express';
import fetch from 'node-fetch';
import querystring from 'querystring';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cookieParser());

// Spotify app credentials
const clientId = '875ffff21ddc47b5b18780602850dc00';  // Your Client ID
const clientSecret = '776c4767352c48699cdb30d6cce400bd';  // Your Client Secret
const redirectUri = 'http://localhost:8888/callback';  // Your Redirect URI
const playlistId = '5OwU4vBf1msQUVb4E8xc5M';  // Correct Playlist ID

const stateKey = 'spotify_auth_state';

// Function to generate a random string for the state
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// 1. Route to initiate login with Spotify (User Authorization)
app.get('/login', (req, res) => {
  const state = generateRandomString(16);
  const scope = 'playlist-modify-public playlist-modify-private';

  res.cookie(stateKey, state);

  // Redirect to Spotify authorization page
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
      state: state,
    }));
});

// 2. Route to handle callback and exchange the authorization code for access token
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
  } else {
    res.clearCookie(stateKey);

    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      const data = await response.json();
      const accessToken = data.access_token;

      if (accessToken) {
        // Get top 50 tracks based on genre and add them to the playlist
        const top50Tracks = await getTop50TracksByGenre('Dutch Rap', accessToken);
        await addSortedTracksToPlaylist(top50Tracks, accessToken);
        res.send('Top 50 tracks have been added to your playlist.');
      } else {
        res.send('Failed to retrieve access token.');
      }
    } catch (error) {
      console.error('Error fetching access token:', error);
      res.send('Error fetching access token.');
    }
  }
});

// Helper function to fetch data from Spotify Web API
async function fetchWebApi(endpoint, method = 'GET', body = null, token) {
  console.log(`Fetching from endpoint: ${endpoint}`);
  const response = await fetch(`https://api.spotify.com/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });
  const data = await response.json();
  console.log(`Data fetched from ${endpoint}:`, JSON.stringify(data, null, 2));
  return data;
}

// 3. Get tracks from playlists based on a genre or subgenre
async function getTracksFromPlaylists(genre, token) {
  const searchEndpoint = `v1/search?q=${encodeURIComponent(genre)}&type=playlist&limit=5`;
  const playlistsData = await fetchWebApi(searchEndpoint, 'GET', null, token);

  let trackUris = [];
  if (playlistsData.playlists.items.length > 0) {
    console.log(`Found ${playlistsData.playlists.items.length} playlists for genre: ${genre}`);

    for (const playlist of playlistsData.playlists.items) {
      console.log(`Processing playlist: ${playlist.name} (ID: ${playlist.id})`);
      const playlistId = playlist.id;
      const tracksEndpoint = `v1/playlists/${playlistId}/tracks`;
      const playlistTracksData = await fetchWebApi(tracksEndpoint, 'GET', null, token);

      playlistTracksData.items.forEach(item => {
        const track = item.track;
        if (track && track.album && track.album.release_date) {
          const releaseDate = new Date(track.album.release_date);
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

          if (releaseDate >= threeMonthsAgo) {
            trackUris.push({ uri: track.uri, name: track.name, popularity: track.popularity });
            console.log(`Track added: ${track.name} by ${track.artists.map(artist => artist.name).join(', ')} - Release Date: ${track.album.release_date}, Popularity: ${track.popularity}`);
          } else {
            console.log(`Track skipped (older than 3 months): ${track.name} - Release Date: ${track.album.release_date}`);
          }
        }
      });
    }
  }
  return trackUris;
}

// Function to remove duplicate URIs from the list
function removeDuplicates(trackUris) {
  const uniqueUris = Array.from(new Set(trackUris.map(track => track.uri)));
  return uniqueUris.map(uri => trackUris.find(track => track.uri === uri));
}

// Function to get the top 50 tracks by genre, sorted by popularity
async function getTop50TracksByGenre(genre, token) {
  let trackUris = await getTracksFromPlaylists(genre, token);

  // Remove duplicates
  trackUris = removeDuplicates(trackUris);

  // Sort by popularity in descending order
  trackUris.sort((a, b) => b.popularity - a.popularity);

  // Limit to top 50 tracks
  const top50Tracks = trackUris.slice(0, 50);
  console.log('Top 50 tracks:', JSON.stringify(top50Tracks, null, 2));
  return top50Tracks;
}

// Add the Top 50 tracks to the playlist
async function addSortedTracksToPlaylist(trackUris, token) {
  const uris = trackUris.map(track => track.uri);
  const endpoint = `v1/playlists/${playlistId}/tracks`;
  const body = { uris: uris };

  const response = await fetchWebApi(endpoint, 'POST', body, token);
  if (response.error) {
    console.log('Error adding tracks:', response.error.message);
  } else {
    console.log('Top 50 tracks added to the playlist.');
  }
}

// Start the server on port 8888
app.listen(8888, () => {
  console.log('Server running on http://localhost:8888');
  console.log('Go to http://localhost:8888/login to authorize.');
});
