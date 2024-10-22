import express from 'express';
import fetch from 'node-fetch';
import querystring from 'querystring';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
    console.log('Login request received:', { clientId, clientSecret });

    if (!clientId || !clientSecret) {
        console.warn('Missing Client ID or Client Secret');
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
    console.log('Redirecting to Spotify authorization:', authUrl);
    res.json({ authUrl });
});

// 2. Route to handle callback and exchange the authorization code for access token
app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;

    const clientId = req.cookies.clientId;
    const clientSecret = req.cookies.clientSecret;
    console.log('Callback received:', { code, state, storedState });

    if (!clientId || !clientSecret) {
        console.error('Missing Client ID or Client Secret in callback');
        return res.status(400).json({ error: 'Client ID and Client Secret are required' });
    }

    if (state === null || state !== storedState) {
        console.warn('State mismatch:', { state, storedState });
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
            console.log('Access token retrieved:', accessToken);

            if (accessToken) {
                res.redirect('/#access_token=' + accessToken);
            } else {
                console.error('Failed to retrieve access token:', data);
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
    console.log('Search request:', { query, token });

    try {
        const playlistsData = await fetchWebApi(`v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=50`, 'GET', null, token);
        console.log('Playlists fetched:', playlistsData.playlists.items.length, 'items');
        res.json(playlistsData.playlists.items);
    } catch (error) {
        console.error('Error fetching playlists:', error);
        res.status(500).send('Error fetching playlists');
    }
});

// 4. Route to scrape tracks from selected playlists
app.post('/scrape-tracks', async (req, res) => {
    const { playlists, sortBy, maxAgeMonths, trackLimit, token } = req.body;
    console.log('Scraping tracks for playlists:', playlists);

    try {
        let tracks = [];
        const currentDate = new Date();
        const minReleaseDate = maxAgeMonths
            ? new Date(currentDate.setMonth(currentDate.getMonth() - maxAgeMonths))
            : null;

        for (const playlistId of playlists) {
            const playlistTracks = await getTracksFromPlaylist(playlistId, token);
            console.log(`Fetched ${playlistTracks.length} tracks from playlist ${playlistId}`);
            tracks = tracks.concat(playlistTracks);
        }

        if (minReleaseDate) {
            console.log('Filtering tracks by min release date:', minReleaseDate);
            tracks = tracks.filter(track => new Date(track.releaseDate) >= minReleaseDate);
        }

        tracks = removeDuplicates(tracks);
        console.log('Unique tracks after removing duplicates:', tracks.length);

        if (sortBy === 'popularity') {
            console.log('Sorting tracks by popularity');
            tracks.sort((a, b) => b.popularity - a.popularity);
        } else if (sortBy === 'date') {
            console.log('Sorting tracks by release date');
            tracks.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
        }

        const limitedTracks = tracks.slice(0, trackLimit || 50);
        console.log('Returning limited tracks:', limitedTracks.length);
        res.json(limitedTracks);
    } catch (error) {
        console.error('Error scraping tracks:', error);
        res.status(500).send('Error scraping tracks');
    }
});

// 5. Route to create or update a playlist
app.post('/create-or-update-playlist', async (req, res) => {
    const { name, description, playlistId, tracks, token } = req.body;
    console.log('Create or update playlist request:', { name, playlistId });

    try {
        const finalPlaylistId = playlistId || await findOrCreatePlaylist(name, description, token);
        console.log('Using playlist ID:', finalPlaylistId);
        await updatePlaylistWithTracks(finalPlaylistId, tracks, token);
        res.json({ name, playlistId: finalPlaylistId });
    } catch (error) {
        console.error('Error creating/updating playlist:', error);
        res.status(500).send('Error creating/updating playlist');
    }
});

// 6. Route to fetch user's playlists with pagination
app.get('/user-playlists', async (req, res) => {
    const { token } = req.query;
    console.log('Fetching user playlists with token:', token);

    try {
        let playlists = [];
        let nextUrl = 'https://api.spotify.com/v1/me/playlists?limit=50';

        while (nextUrl) {
            console.log('Fetching from URL:', nextUrl);
            const data = await fetch(nextUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await data.json();
            playlists = playlists.concat(result.items);
            console.log('Fetched', result.items.length, 'playlists, Total:', playlists.length);
            nextUrl = result.next;
        }

        console.log('Total playlists fetched:', playlists.length);
        res.json(playlists);
    } catch (error) {
        console.error('Error fetching user playlists:', error);
        res.status(500).send('Error fetching user playlists');
    }
});

// Helper functions
async function fetchWebApi(endpoint, method = 'GET', body = null, token) {
    console.log('Fetching Spotify API:', { endpoint, method });
    const response = await fetch(`https://api.spotify.com/${endpoint}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : null,
    });
    const data = await response.json();
    console.log('Fetched data:', data);
    return data;
}

// Start the server on port 8888
app.listen(8888, () => {
    console.log('Server running on http://localhost:8888');
    console.log('Use the frontend to initiate login.');
});
