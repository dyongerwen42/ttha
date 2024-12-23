<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spotify Playlist Creator</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #121212; color: #fff; }
        .spotify-green { background-color: #1DB954; }
        .hidden { display: none; }
        .fade-enter, .fade-leave-to {
            opacity: 0;
            transform: translateY(10px);
        }
        .fade-enter-active, .fade-leave-active {
            transition: all 0.3s ease;
        }
        .loading-spinner {
            border-top-color: transparent;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            border: 2px solid white;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="p-6">
    <div class="max-w-4xl mx-auto">
        <div class="text-center">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Spotify_logo_with_text.svg/2560px-Spotify_logo_with_text.svg.webp" class="w-40 mx-auto mb-4" alt="Spotify Logo">
            <h1 class="text-3xl font-bold text-green-500 mb-6">Spotify Playlist Creator</h1>
        </div>

        <!-- Step 1: Authorization -->
        <div id="step1" class="step">
            <h2 class="text-xl mb-4">Step 1: Authorization</h2>
            <input type="text" id="clientId" placeholder="Client ID" class="w-full p-3 rounded bg-gray-800 mb-2 text-white" required>
            <input type="text" id="clientSecret" placeholder="Client Secret" class="w-full p-3 rounded bg-gray-800 mb-2 text-white" required>
            <button id="authBtn" class="spotify-green w-full py-3 rounded text-black font-bold mt-2">Authorize with Spotify</button>
        </div>

        <!-- Step 2: Search Playlists -->
        <div id="step2" class="step hidden">
            <h2 class="text-xl mb-4">Step 2: Search Playlists</h2>
            <input type="text" id="query" placeholder="Enter Genre or Subgenre" class="w-full p-3 rounded bg-gray-800 text-white mb-2">
            <button id="searchPlaylists" class="spotify-green w-full py-3 rounded text-black font-bold mt-2">Search Playlists</button>
            <div id="loadingSearch" class="hidden flex justify-center mt-4"><div class="loading-spinner"></div></div>
        </div>

        <!-- Step 3: Select Playlists -->
        <div id="step3" class="step hidden">
            <h2 class="text-xl mb-4">Step 3: Select Playlists</h2>
            <div id="playlists" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6"></div>
            <button id="nextToStep4" class="spotify-green w-full py-3 rounded text-black font-bold mt-4 hidden">Next</button>
        </div>

        <!-- Step 4: Create or Update Playlist -->
        <div id="step4" class="step hidden">
            <h2 class="text-xl mb-4">Step 4: Create or Update Playlist</h2>
            <div id="userPlaylists" class="mb-4"></div>
            <input type="text" id="playlistName" placeholder="New Playlist Name or Select Existing" class="w-full p-3 rounded bg-gray-800 text-white mb-2">
            <textarea id="playlistDescription" placeholder="Playlist Description" class="w-full p-3 rounded bg-gray-800 text-white mb-2"></textarea>
            <input type="file" id="playlistImage" class="w-full p-3 rounded bg-gray-800 text-white mb-2">
            <input type="number" id="maxAge" placeholder="Max Age in Months (0 for any)" class="w-full p-3 rounded bg-gray-800 text-white mb-2">
            <select id="sortBy" class="w-full p-3 rounded bg-gray-800 text-white mb-2">
                <option value="popularity">Sort by Popularity</option>
                <option value="date">Sort by Release Date</option>
            </select>
            <input type="number" id="trackLimit" placeholder="Number of Tracks (e.g., 50, 100)" class="w-full p-3 rounded bg-gray-800 text-white mb-2">
            <button id="scrapeAndAdd" class="spotify-green w-full py-3 rounded text-black font-bold mt-4">Scrape and Add Tracks</button>
            <div id="loadingScrape" class="hidden flex justify-center mt-4"><div class="loading-spinner"></div></div>
        </div>

        <!-- Output Section -->
        <div id="output" class="mt-6"></div>
    </div>

    <script>
        const authBtn = document.getElementById('authBtn');
        const searchPlaylistsBtn = document.getElementById('searchPlaylists');
        const scrapeAndAddBtn = document.getElementById('scrapeAndAdd');
        const nextToStep4Btn = document.getElementById('nextToStep4');
        const loadingSearch = document.getElementById('loadingSearch');
        const loadingScrape = document.getElementById('loadingScrape');
        const userPlaylistsContainer = document.getElementById('userPlaylists');

        const step1 = document.getElementById('step1');
        const step2 = document.getElementById('step2');
        const step3 = document.getElementById('step3');
        const step4 = document.getElementById('step4');
        const playlistsContainer = document.getElementById('playlists');
        const output = document.getElementById('output');

        let accessToken = '';

        // Show Step 1 when the page loads
        function initialize() {
            step1.classList.remove('hidden');
            step2.classList.add('hidden');
            step3.classList.add('hidden');
            step4.classList.add('hidden');
        }

        authBtn.addEventListener('click', async () => {
            const clientId = document.getElementById('clientId').value;
            const clientSecret = document.getElementById('clientSecret').value;

            if (!clientId || !clientSecret) {
                alert('Please enter both Client ID and Client Secret.');
                return;
            }

            try {
                const response = await fetch('http://localhost:8888/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientId, clientSecret })
                });
                const data = await response.json();
                window.location.href = data.authUrl;
            } catch (error) {
                console.error('Error initiating login:', error);
            }
        });

        accessToken = new URLSearchParams(window.location.hash.substring(1)).get('access_token');

        if (accessToken) {
            goToStep(step2);

            searchPlaylistsBtn.addEventListener('click', searchPlaylists);
            scrapeAndAddBtn.addEventListener('click', scrapeAndAddTracks);
            nextToStep4Btn.addEventListener('click', () => goToStep(step4));

            // Load user's playlists in Step 4
            loadUserPlaylists();
        } else {
            initialize();
        }

        function goToStep(step) {
            [step1, step2, step3, step4].forEach(s => s.classList.add('hidden'));
            step.classList.remove('hidden');
        }

        async function searchPlaylists() {
            const query = document.getElementById('query').value;
            loadingSearch.classList.remove('hidden');

            try {
                const response = await fetch(`http://localhost:8888/search?query=${query}&token=${accessToken}`);
                const playlists = await response.json();
                displayPlaylists(playlists);
            } catch (error) {
                console.error('Error searching playlists:', error);
            } finally {
                loadingSearch.classList.add('hidden');
            }
        }

        function displayPlaylists(playlists) {
            playlistsContainer.innerHTML = '';
            playlists.forEach(playlist => {
                const div = document.createElement('div');
                div.classList.add('bg-gray-800', 'p-4', 'rounded-lg', 'flex', 'flex-col', 'items-center');
                div.innerHTML = `
                    <img src="${playlist.images[0]?.url || 'https://via.placeholder.com/150'}" class="w-32 h-32 mb-2 rounded-lg">
                    <h3 class="text-center text-white font-semibold">${playlist.name}</h3>
                    <input type="checkbox" value="${playlist.id}" class="mt-2 playlist-checkbox">
                `;
                playlistsContainer.appendChild(div);
            });
            nextToStep4Btn.classList.remove('hidden');
            goToStep(step3);
        }

        async function loadUserPlaylists() {
            try {
                const response = await fetch(`http://localhost:8888/user-playlists?token=${accessToken}`);
                const playlists = await response.json();
                displayUserPlaylists(playlists);
            } catch (error) {
                console.error('Error loading user playlists:', error);
            }
        }

        function displayUserPlaylists(playlists) {
            userPlaylistsContainer.innerHTML = '';
            playlists.forEach(playlist => {
                const div = document.createElement('div');
                div.classList.add('bg-gray-800', 'p-4', 'rounded-lg', 'flex', 'flex-col', 'items-center', 'mb-2');
                div.innerHTML = `
                    <img src="${playlist.images[0]?.url || 'https://via.placeholder.com/150'}" class="w-24 h-24 mb-2 rounded-lg">
                    <h3 class="text-center text-white font-semibold">${playlist.name}</h3>
                    <button class="spotify-green px-4 py-2 rounded text-black font-bold mt-2 select-playlist-btn" data-id="${playlist.id}" data-name="${playlist.name}" data-description="${playlist.description || ''}">Select</button>
                `;
                userPlaylistsContainer.appendChild(div);
            });

            document.querySelectorAll('.select-playlist-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const playlistId = button.getAttribute('data-id');
                    const playlistName = button.getAttribute('data-name');
                    const playlistDescription = button.getAttribute('data-description');
                    
                    document.getElementById('playlistName').value = playlistName;
                    document.getElementById('playlistDescription').value = playlistDescription;
                    document.getElementById('playlistId').value = playlistId;
                });
            });
        }

        async function scrapeAndAddTracks() {
            const selectedPlaylists = Array.from(document.querySelectorAll('.playlist-checkbox:checked')).map(cb => cb.value);
            const playlistName = document.getElementById('playlistName').value;
            const playlistDescription = document.getElementById('playlistDescription').value;
            const maxAge = parseInt(document.getElementById('maxAge').value);
            const sortBy = document.getElementById('sortBy').value;
            const trackLimit = parseInt(document.getElementById('trackLimit').value) || 50;

            if (!playlistName) {
                alert('Please enter a playlist name.');
                return;
            }

            const playlistId = document.getElementById('playlistId').value || null;
            const formData = new FormData();
            const playlistImageFile = document.getElementById('playlistImage').files[0];

            if (playlistImageFile) {
                formData.append('image', playlistImageFile);
            }

            formData.append('name', playlistName);
            formData.append('description', playlistDescription);
            formData.append('playlists', JSON.stringify(selectedPlaylists));
            formData.append('sortBy', sortBy);
            formData.append('maxAgeMonths', maxAge || null);
            formData.append('trackLimit', trackLimit);
            formData.append('token', accessToken);

            if (playlistId) {
                formData.append('playlistId', playlistId);
            }

            loadingScrape.classList.remove('hidden');

            try {
                const response = await fetch('http://localhost:8888/scrape-and-update', {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();
                alert(`Playlist "${result.name}" created/updated!`);
            } catch (error) {
                console.error('Error scraping and adding tracks:', error);
            } finally {
                loadingScrape.classList.add('hidden');
            }
        }
    </script>
</body>
</html>
