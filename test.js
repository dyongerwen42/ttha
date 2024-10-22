import express from 'express';
import fetch from 'node-fetch';
import querystring from 'querystring';
import cookieParser from 'cookie-parser';  // Import cookie-parser to handle cookies

const app = express();
app.use(cookieParser());  // Use cookie-parser

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

  res.cookie(stateKey, state);  // Store state in a cookie

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
  const storedState = req.cookies ? req.cookies[stateKey] : null;  // Retrieve stored state from the cookie

  if (state === null || state !== storedState) {
    res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
  } else {
    res.clearCookie(stateKey);  // Clear the state cookie once validated

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

    // Remove tracks from playlist
    await fetchWebApi(deleteEndpoint, 'DELETE', deleteBody, token);
    console.log('All tracks have been removed from the playlist.');
  }
}

// List of known Dutch rap artists
const dutchRapArtists = [
    'Boef', 'Frenna', 'Ronnie Flex', 'Lil Kleine', 'Josylvio', 'Lijpe', 'Sevn Alias', 'Mula B', 'Chivv',
    'Snelle', 'Bizzey', 'Jonna Fraser', 'Dopebwoy', 'Tabitha', 'Kraantje Pappie', 'Broederliefde', 'Hef',
    'Ashafar', 'Ismo', 'Kevin', 'Idaly', 'JoeyAK', 'KA', 'SFB', '$hirak', 'Yssi SB', 'Jayh', 'Bokoesam',
    'Henkie T', 'Famke Louise', 'Adje', 'Kempi', 'Sor', 'Raw Roets', 'Philly Moré', 'Nnelg', 'D-Double',
    'Bilal Wahib', 'Latifah', 'Esko', 'Young Ellens', 'Equalz', 'JayKoppig', 'Emms', 'Blacka', 'Jairzinho',
     'Yade Lauren', 'Antoon', 'Skinto', 'Extince', 'Brainpower', 'Ali B', 'Appa', 'Negativ', 'Postmen',
    'Lange Frans & Baas B', 'Spookrijders', 'Jack', 'Knaller', 'Sor', 'Jhorrmountain', 'Ares', 'Fresku', 'YXNGLE',
    'Cor', 'Bryan MG', 'KA', 'Poke', 'Zack Ink', 'LauwTje', 'Nass', 'Bokoesam', 'OCS', 'Latifah', 'Winne',
    'Kempi', 'Akwasi', 'Mocromaniac', 'Young Ellens', 'KM', 'Leafs', 'Jairzinho', 'SXTEEN', 'D-Double', 'Fous',
    'Sepa', 'Sticks', 'Philly', 'Louivos', 'F1rstman', 'Rafello', 'Pjotr', 'Jacin Trill', 'Bartofso',
    'Bokke8', 'Donnie', 'Kingsize', 'Figo Gang', 'Zefanio', 'Berry Oost', 'Kosso', 'Riffi', 'Sam J’taime',
    'Momi', 'Dodo', 'Bigidagoe', 'Levy', 'Bryce', 'SFB', 'Yung Nnelg', 'Djezja', 'Cycz', 'Era', 'Alex Fenix',
    'Hansie', 'Rasskulz', 'Valsbezig', 'FMG', 'Johnny Sellah', 'Daniel Busser', 'Navi', 'YSF', 'Pierrii', 'Seffelinie', 
    'Lil’ Saint', 'Kosso', '3robi', 'Typhoon', 'Jebroer', 'Zefanio', 'I Am Aisha', 'Kingsta', 'Sticks', 'F1rstman', 
    'Josbros', 'Keizer', 'Bollebof', 'Darryl', 'Def Rhymz', 'Fatah', 'Hansie', 'Johnny Sellah', 'Kosso', 'Louivos', 
    'Oualid', 'Priester', 'Poke', 'Sepa', 'Jayboogz', 'Oualid', 'Era', 'Bigidagoe', 'Jowy Rosé', 'Fous', 'Jiggy Djé', 
    'Scarface', 'Jacin Trill', 'Emms', 'Yung Felix', 'SRNO', 'Djaga Djaga', 'Webb', 'Gregossan', 'Eves Laurent', 
    'ADF Samski', 'IliassOpDeBeat', 'Woenzelaar', 'Drechter', 'Bartofso', 'Dv', 'Zack Ink', 'Chip Charlez', 
    'Minitrapper', 'Glades', 'MocroManiac', 'Bright', 'Lucc', 'J-Boy'
];

// 3. Get the latest tracks for each artist and add them to the playlist
async function getLatestTrackForArtist(artistName, token) {
  const searchEndpoint = `v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`;
  const artistData = await fetchWebApi(searchEndpoint, 'GET', null, token);
  
  if (artistData.artists.items.length > 0) {
    const artistId = artistData.artists.items[0].id;

    const tracksEndpoint = `v1/artists/${artistId}/top-tracks?market=NL`;
    const topTracksData = await fetchWebApi(tracksEndpoint, 'GET', null, token);
    
    if (topTracksData.tracks.length > 0) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentTracks = topTracksData.tracks.filter(track => {
        const releaseDate = new Date(track.album.release_date);
        return releaseDate >= threeMonthsAgo && track.popularity > 50;
      });

      return recentTracks;
    }
  }
  return [];
}

// Function to remove duplicate URIs from the list
function removeDuplicates(trackUris) {
  const uniqueUris = Array.from(new Set(trackUris.map(track => track.uri)));
  return uniqueUris.map(uri => trackUris.find(track => track.uri === uri));
}

async function addSortedTracksToPlaylist(trackUris, token) {
  trackUris.sort((a, b) => b.popularity - a.popularity);

  // Remove duplicate URIs
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

async function handleTracks(accessToken) {
  let trackUris = [];

  for (const artist of dutchRapArtists) {
    const recentTracks = await getLatestTrackForArtist(artist, accessToken);
    recentTracks.forEach(track => {
      console.log(`Found Track: ${track.name} by ${track.artists.map(artist => artist.name).join(', ')}, Release Date: ${track.album.release_date}, Popularity: ${track.popularity}`);
      trackUris.push({ uri: track.uri, popularity: track.popularity });
    });
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
