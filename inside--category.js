document.addEventListener('DOMContentLoaded', async function () {
    const categoryGamesContainer = document.getElementById('category-games');
    const pageContainer = document.getElementById("main");
    const loadingIndicator = document.getElementById('loading-indicator');
    const categoryTitleElement = document.querySelector("nav h3");

    const LOGIN_URL = 'https://onlinetriviaapi.ydplatform.com:1990/api/YellowdotGames/Authorization/Login';
    const BASE_URL = 'https://onlinetriviaapi.ydplatform.com:1990/api/YellowdotGames/YDGames/GetGamesInCategory';
    const username = "yd_games_sa";
    const password = "password";
    let token = localStorage.getItem('Token');

    // Initial token check and refresh if necessary
    await checkTokenExpiration(token);

    // Function to authenticate and get a new token
    async function auth() {
        try {
            const response = await fetch(LOGIN_URL, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data && data.jwtToken) {
                const { jwtToken, tokenExpiry } = data;
                token = jwtToken;
                localStorage.setItem('Token', jwtToken);
                localStorage.setItem('Expiration', tokenExpiry);
                return jwtToken;
            }
        } catch (error) {
            console.error('Error during authentication:', error);
        }
    }

    // Function to decode a Base64Url string
    function base64UrlDecode(str) {
        let output = str.replace(/-/g, '+').replace(/_/g, '/');
        switch (output.length % 4) {
            case 0:
                break;
            case 2:
                output += '==';
                break;
            case 3:
                output += '=';
                break;
            default:
                throw 'Illegal base64url string!';
        }
        return decodeURIComponent(atob(output).split('').map(c => 
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
    }

    // Function to parse a JWT
    function parseJWT(token) {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT');
        }
        const payload = parts[1];
        const decodedPayload = base64UrlDecode(payload);
        return JSON.parse(decodedPayload);
    }

    async function checkTokenExpiration(token) {
        try {
            if (!token) {
                token = await auth();
                if (!token) {
                    console.error('No token could be obtained');
                    return;
                }
            }
            // Parse the JWT
            const parsedToken = parseJWT(token);
            // Get the current time (in seconds)
            const currentTime = Math.floor(Date.now() / 1000);

            // Check if the token is expired
            if (parsedToken.exp && parsedToken.exp < currentTime) {
                console.log('Token is expired');
                // Call the Auth endpoint to generate a new token
                token = await auth();
            } else {
                console.log('Token is valid');
            }
        } catch (e) {
            console.error('Error decoding or parsing JWT', e);
        }
    }

    function getCategoryFromQueryParam() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('category');
    }

    // Display loading state
    function showLoadingIndicator() {
        loadingIndicator.classList.remove("hidden");
        pageContainer.classList.add("hidden");
    }

    // Hide loading state
    function hideLoadingIndicator() {
        loadingIndicator.classList.add("hidden");
        pageContainer.classList.remove("hidden");
    }

    function capitalizeFirstLetter(string) {
        if (!string) return string; // Return if the string is empty
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    async function filterGamesByCategory(category) {
        showLoadingIndicator();
        try {
            const response = await fetch(`${BASE_URL}?category=${category}`, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();
            const games = data.data;

            if (games && games.length > 0) {
                console.log(games);
                
                const categoryName = games[0].category;
                
                categoryTitleElement.textContent = `${capitalizeFirstLetter(categoryName[0])} Games`;

                const newGames = games.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
                const popularGames = games.sort((a, b) => b.played - a.played).slice(11, 21);
                const recommendedGames = games.sort((a, b) => b.played - a.played).slice(22, 32);

                renderGames(newGames, '.new .games-container');
                renderGames(popularGames, '.popular .games-container');
                // renderGames(recommendedGames, '.for-you .games-container');
            }
            hideLoadingIndicator();
        } catch (error) {
            console.error('Error fetching JSON data:', error);
        }
    }

    function renderGames(gamesList, selector) {
        const container = document.querySelector(selector);
        container.innerHTML = '';
        gamesList.forEach(game => {
            const gameInfoHTML = `
                <div class="item" onclick="location.href='inside-game-details-play.html?gid=${escapeHTML(game.gameId)}'">
                    <img class="item-img" src="${escapeHTML(game.imageUrl)}" alt="${escapeHTML(game.title)}" />
                    <div class="flex">
                        <p><b>${escapeHTML(game.title)}</b></p>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', gameInfoHTML);
        });
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    const category = getCategoryFromQueryParam();
    if (category) {
        filterGamesByCategory(category);
    } else {
        categoryGamesContainer.textContent = 'Invalid category.';
    }
});
