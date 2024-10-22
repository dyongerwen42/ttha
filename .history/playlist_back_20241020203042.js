import express from 'express';
import fetch from 'node-fetch';
import querystring from 'querystring';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());

const stateKey = 'spotify_auth_state';
const redirectUri = 'http://localhost:8888/callback'; // Redirect URI should be registered in Spotify Developer Dashboard

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
app.post('/login', (req, res) => {
    const { clientId, clientSecret } = req.body;

    if (!clientId || !clientSecret) {
        return res.status(400).json({ error: 'Client ID and Client Secret are required' });
    }

    const state = generateRandomString(16);
    const scope = 'playlist-modify-public playlist-modify-private';

    res.cookie(stateKey, state);
    res.cookie('clientId', clientId);
    res.cookie('clientSecret', clientSecret);

    // Redirect to Spotify authorization page
    const authUrl = 'https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: clientId,
            scope: scope,
            redirect_uri: redirectUri,
            state: state,
        });
    res.json({ authUrl });
});

// 2. Route to handle callback and exchange the authorization code for access token
app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;

    const clientId = req.cookies.clientId;
    const clientSecret = req.cookies.clientSecret;

    if (!clientId || !clientSecret) {
        return res.status(400).json({ error: 'Client ID and Client Secret are required' });
    }

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
                res.redirect('/#access_token=' + accessToken);
            } else {
                res.send('Failed to retrieve access token.');
            }
        } catch (error) {
            console.error('Error fetching access token:', error);
            res.send('Error fetching access token.');
        }
    }
});

// 3. Route to search playlists by genre or subgenre
app.get('/search', async (req, res) => {
    const { query, token } = req.query;
    try {
        const playlistsData = await fetchWebApi(`v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=5`, 'GET', null, token);
        res.json(playlistsData.playlists.items);
    } catch (error) {
        console.error('Error fetching playlists:', error);
        res.status(500).send('Error fetching playlists');
    }
});

// 4. Route to scrape tracks from selected playlists
app.post('/scrape-tracks', async (req, res) => {
    const { playlists, token } = req.body;
    try {
        let tracks = [];
        for (const playlistId of playlists) {
            const playlistTracks = await getTracksFromPlaylist(playlistId, token);
            tracks = tracks.concat(playlistTracks);
        }

        // Remove duplicate tracks
        tracks = removeDuplicates(tracks);

        // Sort by popularity in descending order and limit to top 50
        tracks.sort((a, b) => b.popularity - a.popularity);
        const top50Tracks = tracks.slice(0, 50);

        res.json(top50Tracks);
    } catch (error) {
        console.error('Error scraping tracks:', error);
        res.status(500).send('Error scraping tracks');
    }
});

// 5. Route to create or update a playlist
app.post('/create-or-update-playlist', async (req, res) => {
    const { name, tracks, token } = req.body;
    try {
        const playlistId = await findOrCreatePlaylist(name, token);
        await updatePlaylistWithTracks(playlistId, tracks, token);
        res.json({ name, playlistId });
    } catch (error) {
        console.error('Error creating/updating playlist:', error);
        res.status(500).send('Error creating/updating playlist');
    }
});

// Helper functions
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

async function getTracksFromPlaylist(playlistId, token) {
    const tracksData = await fetchWebApi(`v1/playlists/${playlistId}/tracks`, 'GET', null, token);
    return tracksData.items.map(item => ({
        uri: item.track.uri,
        name: item.track.name,
        popularity: item.track.popularity,
        releaseDate: item.track.album.release_date,
        artist: item.track.artists.map(artist => artist.name).join(', ')
    }));
}

async function findOrCreatePlaylist(name, token) {
    const userProfile = await fetchWebApi('v1/me', 'GET', null, token);
    const userId = userProfile.id;

    const playlists = await fetchWebApi(`v1/users/${userId}/playlists`, 'GET', null, token);
    const existingPlaylist = playlists.items.find(pl => pl.name === name);

    if (existingPlaylist) {
        return existingPlaylist.id;
    } else {
        const createBody = {
            name: name,
            description: 'A custom playlist created with Spotify Playlist Manager',
            public: true
        };
        const newPlaylist = await fetchWebApi(`v1/users/${userId}/playlists`, 'POST', createBody, token);
        return newPlaylist.id;
    }
}

async function updatePlaylistWithTracks(playlistId, tracks, token) {
    const uris = tracks.map(track => track.uri);
    const endpoint = `v1/playlists/${playlistId}/tracks`;
    await fetchWebApi(endpoint, 'PUT', { uris }, token);
}

function removeDuplicates(tracks) {
    const uniqueUris = Array.from(new Set(tracks.map(track => track.uri)));
    return uniqueUris.map(uri => tracks.find(track => track.uri === uri));
}

// Start the server on port 8888
app.listen(8888, () => {
    console.log('Server running on http://localhost:8888');
    console.log('Use the frontend to initiate login.');
});
