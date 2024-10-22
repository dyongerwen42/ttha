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

    if (!query || !token) {
        console.error('Missing query or token');
        return res.status(400).json({ error: 'Query and token are required.' });
    }

    try {
        let playlists = [];
        let nextUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=50`;

        // Loop through all pages until there is no more next URL
        while (nextUrl) {
            console.log('Fetching playlists from:', nextUrl);
            const response = await fetch(nextUrl, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();

            if (data.playlists && data.playlists.items) {
                playlists = playlists.concat(data.playlists.items);
                console.log(`Fetched ${data.playlists.items.length} playlists, total so far: ${playlists.length}`);
            }

            nextUrl = data.playlists.next; // Get the URL for the next page of results
        }

        // Sort playlists by follower count, using 0 as a fallback for missing follower counts
        playlists.sort((a, b) => (b.followers?.total || 0) - (a.followers?.total || 0));

        console.log('Total playlists fetched and sorted by followers:', playlists.length);
        res.json(playlists);
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
            nextUrl = result.next;
        }

        console.log('Total playlists fetched:', playlists.length);
        res.json(playlists);
    } catch (error) {
        console.error('Error fetching user playlists:', error);
        res.status(500).send('Error fetching user playlists');
    }
});
app.get('/playlist-tracks', async (req, res) => {
    const { playlistId, token } = req.query;
    console.log('Fetching tracks for playlist:', playlistId);

    if (!playlistId || !token) {
        console.error('Missing playlistId or token');
        return res.status(400).json({ error: 'playlistId and token are required.' });
    }

    try {
        const tracks = await getTracksFromPlaylist(playlistId, token);
        console.log(`Fetched ${tracks.length} tracks from playlist ${playlistId}`);
        res.json(tracks);
    } catch (error) {
        console.error('Error fetching playlist tracks:', error);
        res.status(500).send('Error fetching playlist tracks');
    }
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
        });

        // Validate input fields
        if (!playlists || !Array.isArray(playlists)) {
            console.error('Playlists field is missing or not an array');
            return res.status(400).json({ error: 'Playlists field is required and must be an array.' });
        }

        if (!name || !token) {
            console.error('Missing required fields or invalid data format.');
            return res.status(400).json({ error: 'Missing required fields or invalid data format.' });
        }

        console.log('Starting to scrape tracks from playlists.');
        let tracks = [];
        const minReleaseDate = maxAgeMonths > 0 
            ? new Date(new Date().setMonth(new Date().getMonth() - maxAgeMonths)) 
            : null;

        // Fetch tracks from each playlist
        for (const playlistId of playlists) {
            console.log('Fetching tracks from playlist:', playlistId);
            const playlistTracks = await getTracksFromPlaylist(playlistId, token);
            console.log(`Fetched ${playlistTracks.length} tracks from playlist ${playlistId}`);
            tracks = tracks.concat(playlistTracks);
        }

        // Filter tracks by release date if minReleaseDate is defined
        if (minReleaseDate) {
            console.log('Filtering tracks by minimum release date:', minReleaseDate);
            tracks = tracks.filter(track => new Date(track.releaseDate) >= minReleaseDate);
            console.log('Filtered tracks count:', tracks.length);
        }

        // Remove duplicate tracks based on their URI
        console.log('Removing duplicate tracks.');
        tracks = removeDuplicates(tracks);
        console.log('Unique tracks count:', tracks.length);

        // Sort tracks based on the chosen criteria
        if (sortBy === 'popularity') {
            console.log('Sorting tracks by popularity.');
            tracks.sort((a, b) => b.popularity - a.popularity);
        } else if (sortBy === 'date') {
            console.log('Sorting tracks by release date.');
            tracks.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
        }

        // Limit the number of tracks to the specified limit or default to 50
        const limitedTracks = tracks.slice(0, trackLimit || 50);
        console.log('Tracks after limiting to specified number:', limitedTracks.length);

        // Find or create the playlist and update it with the selected tracks
        const finalPlaylistId = playlistId || await findOrCreatePlaylist(name, description, token);
        console.log('Using final playlist ID:', finalPlaylistId);

        await updatePlaylistWithTracks(finalPlaylistId, limitedTracks, token);
        console.log(`Successfully updated playlist "${name}" with ID: ${finalPlaylistId}`);

        // Send a successful response with the playlist details and the tracks added
        res.json({ 
            name, 
            playlistId: finalPlaylistId, 
            tracks: limitedTracks.map(track => ({
                name: track.name,
                artist: track.artist,
                popularity: track.popularity,
                releaseDate: track.releaseDate
            }))
        });
    } catch (error) {
        console.error('Error in scrape-and-update operation:', error);
        res.status(500).send('Error scraping and updating playlist');
    }
});

// Route to search for artists by genre
app.get('/search-artists', async (req, res) => {
    const { query, token } = req.query;
    console.log('Searching artists with genre:', query);

    if (!query || !token) {
        console.error('Missing query or token');
        return res.status(400).json({ error: 'Query and token are required.' });
    }

    try {
        // Construct the search URL for artists, filtering by genre
        let artists = [];
        let nextUrl = `https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(query)}&type=artist&limit=50`;

        // Loop through all pages until there is no more next URL
        while (nextUrl) {
            console.log('Fetching artists from:', nextUrl);
            const response = await fetch(nextUrl, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();

            if (data.artists && data.artists.items) {
                artists = artists.concat(data.artists.items);
                console.log(`Fetched ${data.artists.items.length} artists, total so far: ${artists.length}`);
            }

            nextUrl = data.artists.next; // Get the URL for the next page of results
        }

        // Sort artists by popularity (most popular first)
        artists.sort((a, b) => b.popularity - a.popularity);

        console.log('Total artists fetched and sorted by popularity:', artists.length);
        console.log(JSON.stringify(artists))
        res.json(artists);
    } catch (error) {
        console.error('Error fetching artists:', error);
        res.status(500).send('Error fetching artists');
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
    let tracks = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

    while (nextUrl) {
        const response = await fetch(nextUrl, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();

        if (!data.items) {
            console.error('No items in playlist data:', data);
            break;
        }

        tracks = tracks.concat(data.items.map(item => {
            if (item.track) {
                // Validate that the track object exists and has the expected properties
                return {
                    uri: item.track.uri,
                    name: item.track.name || 'Unknown Track',
                    popularity: item.track.popularity || 0,
                    releaseDate: item.track.album ? item.track.album.release_date : 'Unknown Date',
                    artist: item.track.artists ? item.track.artists.map(artist => artist.name).join(', ') : 'Unknown Artist'
                };
            } else {
                console.warn('Invalid track item detected:', item);
                return null; // Return null for invalid items to filter them out later
            }
        }));

        nextUrl = data.next; // If there's a next page, continue fetching
    }

    // Filter out any null values from the tracks list
    tracks = tracks.filter(track => track !== null);

    console.log(`Total tracks fetched from playlist ${playlistId}:`, tracks.length);
    return tracks;
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
    const chunkSize = 100; // Spotify allows a maximum of 100 tracks per request

    // Split the URIs into chunks of 100
    for (let i = 0; i < uris.length; i += chunkSize) {
        const uriChunk = uris.slice(i, i + chunkSize);
        console.log(`Adding chunk ${i / chunkSize + 1} with ${uriChunk.length} tracks`);

        try {
            // Send each chunk as a POST request to add tracks instead of replacing them
            await fetchWebApi(endpoint, 'POST', { uris: uriChunk }, token);
            console.log(`Successfully added ${uriChunk.length} tracks to playlist ${playlistId}`);
        } catch (error) {
            console.error('Error adding chunk to playlist:', error);
            throw new Error('Error adding tracks to Spotify playlist');
        }
    }

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
