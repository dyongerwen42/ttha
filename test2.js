const clientId = '875ffff21ddc47b5b18780602850dc00';  // Replace with your Client ID
const clientSecret = '776c4767352c48699cdb30d6cce400bd';  // Replace with your Client Secret

// Function to get the Spotify access token
async function getAccessToken() {
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const data = await response.json();
  return data.access_token;
}

// Function to fetch data from Spotify Web API
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

// Function to get all tracks from a playlist and extract artist information
async function getArtistsFromPlaylist(playlistId, token) {
  const endpoint = `v1/playlists/${playlistId}/tracks?limit=100`;
  const data = await fetchWebApi(endpoint, 'GET', null, token);
  
  const artists = new Set(); // Use a set to avoid duplicates

  // Loop through the tracks and extract artists
  data.items.forEach(item => {
    const trackArtists = item.track.artists;
    trackArtists.forEach(artist => {
      artists.add(artist.name); // Add artist name to the set
    });
  });

  return Array.from(artists); // Convert set back to array
}

// Main function to scrape artists from the specified playlist
(async () => {
  try {
    const accessToken = await getAccessToken(); // Get the access token
    const playlistId = '0n4887kPRU2LMSbFlcSN2U'; // Playlist ID from the URL
    const artists = await getArtistsFromPlaylist(playlistId, accessToken);

    // Log the artists
    console.log('Artists in the Playlist:');
    artists.forEach(artist => {
      console.log(artist);
    });
  } catch (error) {
    console.error('Error fetching artists from playlist:', error);
  }
})();
