document.addEventListener('DOMContentLoaded', async function () {
    const username = "yd_games_sa";
    const password = "password";
    const pageContainer = document.getElementById("main");

    // Initial token check and refresh if necessary
    await checkTokenExpiration(localStorage.getItem('Token'));

    // Function to authenticate and get a new token
    async function auth() {
        const LOGIN_URL = 'https://onlinetriviaapi.ydplatform.com:1990/api/YellowdotGames/Authorization/Login';
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

    async function getCategories() {
        const GET_CATEGORIES_URL = 'https://onlinetriviaapi.ydplatform.com:1990/api/YellowdotGames/YDGames/GetAllGames';
        const jwtToken = localStorage.getItem('Token');
        showLoadingIndicator();

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
                hideLoadingIndicator();

                [
                    "puzzle",
                    "strategy",
                    "adventure",
                    "action",
                    "arcade",
                    "kids",
                    "educative",
                    "sports",
                    "stratgey",
                    "aracade",
                    "racing",
                    "art",
                    "education",
                    "sport",
                    "arts",
                    "racing"
                  ]
                // Filtered games based on category
                const jumboCategory = filterAndLimitGamesByCategory('action', games, 1);
                const sportsCategory = filterAndLimitGamesByCategory('sports', games, 6);
                const arcadeCategory = filterAndLimitGamesByCategory('arcade', games, 6);
                const artsCategory = filterAndLimitGamesByCategory('art', games, 6);
                const kidsCategory = filterAndLimitGamesByCategory('kids', games, 6);
                const adventureCategory = filterAndLimitGamesByCategory('adventure', games, 6);
                const puzzlesCategory = filterAndLimitGamesByCategory('puzzle', games, 6);
                const strategyCategory = filterAndLimitGamesByCategory('strategy', games, 6);
                const educationCategory = filterAndLimitGamesByCategory('education', games, 6);

                renderGames(adventureCategory, '.new-game-section .adventure-category .getback');
                renderGames(arcadeCategory, '.new-game-section .arcade-category .getback');
                renderGames(educationCategory, '.new-game-section .board-category .getback');
                renderGames(artsCategory, '.new-game-section .classics-category .getback');
                renderGames(kidsCategory, '.new-game-section .junior-category .getback');
                renderGames(puzzlesCategory, '.new-game-section .puzzle-category .getback');
                renderGames(sportsCategory, '.new-game-section .sports-category .getback');
                renderGames(strategyCategory, '.new-game-section .strategy-category .getback');
                renderJumbotron(jumboCategory, '.new-game-section .jumbo');
                // renderSections(games);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }

    // function renderSections(games) {
    //     const categories = [
    //         { name: 'adventure', limit: 6 },
    //         { name: 'arcade', limit: 6 },
    //         { name: 'board', limit: 6 },
    //         { name: 'classics', limit: 6 },
    //         { name: 'junior', limit: 6 },
    //         { name: 'puzzles', limit: 6 },
    //         { name: 'sports', limit: 6 },
    //         { name: 'strategy', limit: 6 }
    //     ];

    //     categories.forEach(category => {
    //         const filteredGames = filterAndLimitGamesByCategory([category.name], games, category.limit);
    //         renderGames(filteredGames, `.new-game-section .${category.name}-category .getback .list-x`);
    //     });

    //     const jumboCategory = filterAndLimitGamesByCategory(['Strategy'], games, 1);
    //     renderJumbotron(jumboCategory, '.new-game-section .jumbo');
    // }

    function filterAndLimitGamesByCategory(categories, games, limit) {
        const filteredGames = games.filter(game => categories.includes(game.category[0]));
        console.log(filteredGames);
        
        return filteredGames.slice(0, limit);
    }

    function renderGames(gamesList, selector) {
        const container = document.querySelector(selector);
        container.innerHTML = '';
        if (gamesList.length > 0) {
            const headerHTML = `
                <div class="game-header">
                    <p>${gamesList[0].category[0]}</p>
                    <a href="/inside--category.html?category=${gamesList[0].category[0]}" class="see-all">See All</a>
                </div>
                <div class="list-x"></div>
            `;
            container.insertAdjacentHTML('beforeend', headerHTML);
    
            const listContainer = container.querySelector('.list-x');
    
            gamesList.forEach(game => {
                const gameInfoHTML = `
                    <div>
                        <a href="${escapeHTML(game.playUrl)}" class="item">
                            <img class="item-img" src="${escapeHTML(game.imageUrl)}" alt="" />
                        </a>
                        <p>${escapeHTML(game.title)}</p>
                    </div>
                `;
                listContainer.insertAdjacentHTML('beforeend', gameInfoHTML);
            });
        }
    }

    function renderJumbotron(gamesList, selector) {
        const container = document.querySelector(selector);
        container.innerHTML = '';
        gamesList.forEach(game => {
            const gameInfoHTML = `
                <a href="${escapeHTML(game.playUrl)}" class="hot-doggeria">
                    <img class="w-100" src="${escapeHTML(game.imageUrl)}" alt="${escapeHTML(game.title)}">
                    <div class="new-game-desc">
                        <h3>${escapeHTML(game.title)}</h3>
                        <div class="flex">
                            <img src="assets/icons/ant-design_star-filled.svg" alt="star icon" />
                            <img src="assets/icons/ant-design_star-filled.svg" alt="star icon" />
                            <img src="assets/icons/ant-design_star-filled.svg" alt="star icon" />
                            <img src="assets/icons/antdesignstarunfilled.svg" alt="star icon" />
                            <img src="assets/icons/antdesignstarunfilled.svg" alt="star icon" />
                        </div>
                        <button class="game-tags">${escapeHTML(game.category)}</button>
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

    await getCategories();
});
