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
const playlistId = '6pYAECv1CzpkoDRZWce0pm';  // Your Playlist ID

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
        // Proceed to use the token (e.g., delete existing tracks and add new ones)
        await removeAllTracksFromPlaylist(accessToken);
        await handleTracks(accessToken);
        res.send('Tracks have been updated in your playlist.');
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
  const response = await fetch(`https://api.spotify.com/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });
  return await response.json();
}

// Helper function to remove all tracks from the playlist
async function removeAllTracksFromPlaylist(token) {
  const getTracksEndpoint = `v1/playlists/${playlistId}/tracks`;
  const tracksData = await fetchWebApi(getTracksEndpoint, 'GET', null, token);

  if (tracksData.items && tracksData.items.length > 0) {
    const trackUrisToRemove = tracksData.items.map(item => ({ uri: item.track.uri }));
    const deleteEndpoint = `v1/playlists/${playlistId}/tracks`;
    const deleteBody = { tracks: trackUrisToRemove };

    await fetchWebApi(deleteEndpoint, 'DELETE', deleteBody, token);
    console.log('All tracks have been removed from the playlist.');
  }
}

// 3. Get tracks from playlists that match a genre or subgenre
async function getTracksFromPlaylists(genre, token) {
  const searchEndpoint = `v1/search?q=${encodeURIComponent(genre)}&type=playlist&limit=5`;
  const playlistsData = await fetchWebApi(searchEndpoint, 'GET', null, token);

  let trackUris = [];
  if (playlistsData.playlists.items.length > 0) {
    for (const playlist of playlistsData.playlists.items) {
      const playlistId = playlist.id;
      const tracksEndpoint = `v1/playlists/${playlistId}/tracks`;
      const playlistTracksData = await fetchWebApi(tracksEndpoint, 'GET', null, token);

      playlistTracksData.items.forEach(item => {
        const track = item.track;
        trackUris.push({ uri: track.uri, popularity: track.popularity });
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

async function addSortedTracksToPlaylist(trackUris, token) {
  trackUris.sort((a, b) => b.popularity - a.popularity);

  const uniqueTracks = removeDuplicates(trackUris);
  const uris = uniqueTracks.map(track => track.uri);
  const endpoint = `v1/playlists/${playlistId}/tracks`;
  const body = { uris: uris };

  const response = await fetchWebApi(endpoint, 'POST', body, token);
  if (response.error) {
    console.log('Error adding tracks:', response.error.message);
  } else {
    console.log('Tracks added in sorted order by popularity.');
  }
}

// Get and add tracks from playlists based on a genre
async function handleTracks(accessToken) {
  const genres = ['Dutch Rap', 'Hip-Hop NL'];  // Define genres or subgenres to search for

  let trackUris = [];
  for (const genre of genres) {
    const tracks = await getTracksFromPlaylists(genre, accessToken);
    trackUris = trackUris.concat(tracks);
  }

  if (trackUris.length > 0) {
    await addSortedTracksToPlaylist(trackUris, accessToken);
  } else {
    console.log('No tracks to add.');
  }
}

// Start the server on port 8888
app.listen(8888, () => {
  console.log('Server running on http://localhost:8888');
  console.log('Go to http://localhost:8888/login to authorize.');
});
