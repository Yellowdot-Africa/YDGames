document.addEventListener('DOMContentLoaded', async function () {
    const username = "yd_games_sa";
    const password = "password";
    let token = localStorage.getItem('Token');
    const pageContainer = document.getElementById("main");

    // Check the token expiration and refresh if necessary
    await checkTokenExpiration(token);

    // Function to authenticate and get a new token
    async function auth() {
        const LOGIN_URL = 'https://ydvassdp.com:5002/api/YDGames/Authorization/Login';
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
        return decodeURIComponent(atob(output).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
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

    // Display loading state
    function showLoadingIndicator() {
        const loadingIndicator = document.getElementById('loading-indicator');
        loadingIndicator.classList.remove("hidden");
        pageContainer.classList.add("hidden");
    }

    // Hide loading state
    function hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('loading-indicator');
        loadingIndicator.classList.add("hidden");
        pageContainer.classList.remove("hidden");
    }

    async function getGamesForHomePage() {
        const GET_CATEGORIES_URL = 'https://ydvassdp.com:5002/YDGames/api/YDGames/YDGames/GetGamesForHomePage?displayCount=4';
        const jwtToken = localStorage.getItem('Token');

        // showLoadingIndicator();

        try {
            const response = await fetch(GET_CATEGORIES_URL, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwtToken}`
                }
            });
            const data = await response.json();
            if (data && data.message === 'Success!') {
                const games = data.data;
                // hideLoadingIndicator();
                renderSections(games);
            }
        } catch (error) {
            console.error('Error fetching games:', error);
        }
    }

    function renderSections(games) {
        const getBackSection = filterAndLimitGames(games, 3);
        const gamesYouMightLikeSection = filterAndLimitGamesByCategory(['Sports'], games, 4);
        const popularSection = filterAndLimitGamesByCategory(['Puzzles'], games, 4);

        renderGames(getBackSection, '.getback .list-x');
        renderRecommended(gamesYouMightLikeSection, '.recommended .list-x');
        renderPopular(popularSection, '.popular .pop-list');
    }

    function filterAndLimitGames(games, limit) {
        return games.slice(0, limit);
    }

    function filterAndLimitGamesByCategory(categories, games, limit) {
        const filteredGames = games.filter(game => categories.includes(game.category));
        return filteredGames.slice(0, limit);
    }

    function renderGames(gamesList, selector) {
        const container = document.querySelector(selector);
        container.innerHTML = '';
        gamesList.forEach(game => {
            const gameInfoHTML = `
                <div>
                    <a href="${escapeHTML(game.playUrl)}" class="item item1">
                        <img src="${escapeHTML(game.thumbnailUrl)}" alt="" />
                    </a>
                    <p>${escapeHTML(game.title)}</p>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', gameInfoHTML);
        });
    }

    function renderRecommended(gamesList, selector) {
        const container = document.querySelector(selector);
        container.innerHTML = '';
        gamesList.forEach(game => {
            const gameInfoHTML = `
                <a href="${escapeHTML(game.playUrl)}" class="recommended-game">
                    <img class="staricon" src="assets/staricon.svg" alt="star" />
                    <img class="img" src="${escapeHTML(game.thumbnailUrl)}" alt="${escapeHTML(game.title)}" />
                    <div class="recommended-game-desc">
                        <h4>${escapeHTML(game.title)}</h4>
                        <div>
                            <button class="game-tags">Strategy</button>
                            <button class="game-tags">Action</button>
                            <button class="game-tags">Adventure</button>
                        </div>
                    </div>
                </a>
            `;
            container.insertAdjacentHTML('beforeend', gameInfoHTML);
        });
    }

    function renderPopular(gamesList, selector) {
        const container = document.querySelector(selector);
        container.innerHTML = '';
        gamesList.forEach(game => {
            const gameInfoHTML = `
                <a href="${escapeHTML(game.playUrl)}" class="popular-game">
                    <img class="staricon" src="assets/staricon.svg" alt="" />
                    <img class="img" src="${escapeHTML(game.thumbnailUrl)}" alt="${escapeHTML(game.title)}" />
                    <div class="popular-game-desc">
                        <h4>${escapeHTML(game.title)}</h4>
                        <div>
                            <button class="game-tags">${game.category}</button>
                            <button class="game-tags">Strategy</button>
                        </div>
                    </div>
                </a>
            `;
            container.insertAdjacentHTML('beforeend', gameInfoHTML);
        });
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    await getGamesForHomePage();
});
