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

// 7. Route to handle scrape and update operation
app.post('/scrape-and-update', async (req, res) => {
    try {
        console.log('Received scrape-and-update request with body:', req.body);

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
            playlists
        });

        // Validate presence of required fields
        if (!name || !token || !Array.isArray(playlists)) {
            console.error('Missing required fields or invalid data format.');
            return res.status(400).json({ error: 'Missing required fields or invalid data format.' });
        }

        // Scrape tracks from the selected playlists
        console.log('Starting to scrape tracks from playlists.');
        let tracks = [];
        const currentDate = new Date();
        const minReleaseDate = maxAgeMonths
            ? new Date(currentDate.setMonth(currentDate.getMonth() - maxAgeMonths))
            : null;

        for (const playlistId of playlists) {
            console.log('Fetching tracks from playlist:', playlistId);
            const playlistTracks = await getTracksFromPlaylist(playlistId, token);
            console.log(`Fetched ${playlistTracks.length} tracks from playlist ${playlistId}`);
            tracks = tracks.concat(playlistTracks);
        }

        if (minReleaseDate) {
            console.log('Filtering tracks by minimum release date:', minReleaseDate);
            tracks = tracks.filter(track => new Date(track.releaseDate) >= minReleaseDate);
            console.log('Filtered tracks count:', tracks.length);
        }

        console.log('Removing duplicate tracks.');
        tracks = removeDuplicates(tracks);
        console.log('Unique tracks count:', tracks.length);

        if (sortBy === 'popularity') {
            console.log('Sorting tracks by popularity.');
            tracks.sort((a, b) => b.popularity - a.popularity);
        } else if (sortBy === 'date') {
            console.log('Sorting tracks by release date.');
            tracks.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
        }

        const limitedTracks = tracks.slice(0, trackLimit || 50);
        console.log('Tracks after limiting to specified number:', limitedTracks.length);

        const finalPlaylistId = playlistId || await findOrCreatePlaylist(name, description, token);
        console.log('Using final playlist ID:', finalPlaylistId);

        await updatePlaylistWithTracks(finalPlaylistId, limitedTracks, token);
        console.log(`Successfully updated playlist "${name}" with ID: ${finalPlaylistId}`);

        res.json({ name, playlistId: finalPlaylistId });
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
