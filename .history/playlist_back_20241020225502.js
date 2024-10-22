import express from 'express';
import fetch from 'node-fetch';
import querystring from 'querystring';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
const upload = multer(); // Initialize multer for handling form-data

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const stateKey = 'spotify_auth_state';
const redirectUri = 'http://localhost:8888/callback';

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
    console.log('Received login request:', { clientId, clientSecret });

    if (!clientId || !clientSecret) {
        console.warn('Missing Client ID or Client Secret');
        return res.status(400).json({ error: 'Client ID and Client Secret are required' });
    }

    const state = generateRandomString(16);
    const scope = 'playlist-modify-public playlist-modify-private';

    console.log('Generated state and scope for authorization:', { state, scope });
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
    console.log('Redirecting to Spotify authorization page:', authUrl);
    res.json({ authUrl });
});

// 2. Route to handle callback and exchange the authorization code for access token
app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;
    console.log('Callback received:', { code, state, storedState });

    const clientId = req.cookies.clientId;
    const clientSecret = req.cookies.clientSecret;

    if (!clientId || !clientSecret) {
        console.error('Missing Client ID or Client Secret in callback');
        return res.status(400).json({ error: 'Client ID and Client Secret are required' });
    }

    if (state === null || state !== storedState) {
        console.warn('State mismatch detected:', { state, storedState });
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
        console.log('Requesting access token with:', body.toString());

        try {
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
            });

            const data = await response.json();
            console.log('Access token response:', data);
            const accessToken = data.access_token;

            if (accessToken) {
                console.log('Redirecting with access token');
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
    console.log('Searching playlists with query:', query);

    try {
        const playlistsData = await fetchWebApi(`v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=50`, 'GET', null, token);
        console.log('Fetched playlists data:', playlistsData.playlists.items.length, 'items');
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
        console.log('Filtering by release date:', minReleaseDate);

        for (const playlistId of playlists) {
            console.log('Fetching tracks from playlist:', playlistId);
            const playlistTracks = await getTracksFromPlaylist(playlistId, token);
            console.log(`Fetched ${playlistTracks.length} tracks from playlist ${playlistId}`);
            tracks = tracks.concat(playlistTracks);
        }

        if (minReleaseDate) {
            console.log('Filtering tracks by min release date');
            tracks = tracks.filter(track => new Date(track.releaseDate) >= minReleaseDate);
        }

        console.log('Removing duplicates from tracks');
        tracks = removeDuplicates(tracks);

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
            console.log('Fetching playlists from:', nextUrl);
            const data = await fetch(nextUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await data.json();
            console.log('Fetched', result.items.length, 'playlists');
            playlists = playlists.concat(result.items);
            nextUrl = result.next; // If there's a next page, continue fetching
        }

        console.log('Total playlists fetched:', playlists.length);
        res.json(playlists);
    } catch (error) {
        console.error('Error fetching user playlists:', error);
        res.status(500).send('Error fetching user playlists');
    }
});

// 7. Route to handle scrape and update operation
app.post('/scrape-and-update', upload.none(), async (req, res) => {
    try {
        console.log('Received scrape-and-update request with body:', req.body);
        // Extract and parse the data from req.body
        const {
            name,
            description,
            playlists,
            sortBy,
            maxAgeMonths,
            trackLimit,
            token,
            playlistId,
        } = req.body;

        console.log('Parsed request data:', {
            name,
            description,
            playlistId,
            sortBy,
            maxAgeMonths,
            trackLimit,
        });

        // Validate playlists input
        if (!playlists) {
            console.error('Playlists field is missing or empty');
            return res.status(400).json({ error: 'Playlists field is required.' });
        }

        let selectedPlaylists;
        try {
            selectedPlaylists = JSON.parse(playlists);
            console.log('Parsed selected playlists:', selectedPlaylists);
        } catch (error) {
            console.error('Error parsing selected playlists:', error.message);
            return res.status(400).json({ error: 'Invalid playlists format. Expected JSON string.' });
        }

        // Check for required fields
        if (!name || !token || !Array.isArray(selectedPlaylists)) {
            console.error('Missing required fields or invalid data format.');
            return res.status(400).json({ error: 'Missing required fields or invalid data format.' });
        }

        // Further processing...
    } catch (error) {
        console.error('Error in scrape-and-update operation:', error);
        res.status(500).send('Error scraping and updating playlist');
    }
});


// Helper functions
async function fetchWebApi(endpoint, method = 'GET', body = null, token) {
    console.log('Making API request to:', endpoint, 'with method:', method);
    const response = await fetch(`https://api.spotify.com/${endpoint}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : null,
    });
    const data = await response.json();
    console.log('Response from Spotify API:', data);
    return data;
}

async function getTracksFromPlaylist(playlistId, token) {
    console.log('Fetching tracks from playlist:', playlistId);
    const tracksData = await fetchWebApi(`v1/playlists/${playlistId}/tracks`, 'GET', null, token);
    return tracksData.items.map(item => ({
        uri: item.track.uri,
        name: item.track.name,
        popularity: item.track.popularity,
        releaseDate: item.track.album.release_date,
        artist: item.track.artists.map(artist => artist.name).join(', ')
    }));
}

async function findOrCreatePlaylist(name, description, token) {
    console.log('Finding or creating playlist:', name);
    const userProfile = await fetchWebApi('v1/me', 'GET', null, token);
    const userId = userProfile.id;

    const playlists = await fetchWebApi(`v1/users/${userId}/playlists`, 'GET', null, token);
    const existingPlaylist = playlists.items.find(pl => pl.name === name);

    if (existingPlaylist) {
        console.log('Found existing playlist:', existingPlaylist.id);
        return existingPlaylist.id;
    } else {
        console.log('Creating new playlist:', name);
        const createBody = {
            name: name,
            description: description || 'A custom playlist created with Spotify Playlist Manager',
            public: true
        };
        const newPlaylist = await fetchWebApi(`v1/users/${userId}/playlists`, 'POST', createBody, token);
        console.log('Created new playlist with ID:', newPlaylist.id);
        return newPlaylist.id;
    }
}

async function updatePlaylistWithTracks(playlistId, tracks, token) {
    console.log('Updating playlist:', playlistId, 'with', tracks.length, 'tracks');
    const uris = tracks.map(track => track.uri);
    const endpoint = `v1/playlists/${playlistId}/tracks`;
    await fetchWebApi(endpoint, 'PUT', { uris }, token);
    console.log('Updated playlist successfully');
}

function removeDuplicates(tracks) {
    const uniqueUris = Array.from(new Set(tracks.map(track => track.uri)));
    console.log('Removed duplicates, total unique tracks:', uniqueUris.length);
    return uniqueUris.map(uri => tracks.find(track => track.uri === uri));
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'playlist.html'));
});

// Start the server on port 8888
app.listen(8888, () => {
    console.log('Server running on http://localhost:8888');
    console.log('Use the frontend to initiate login.');
});
