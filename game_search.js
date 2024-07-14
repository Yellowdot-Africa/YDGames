document.addEventListener("DOMContentLoaded", function () {
  const titleInput = document.getElementById("title");
  const container = document.getElementById("main");
  const resultsContainer = document.getElementById("results");
  const discoverSection = document.getElementById("discover-section");
  const gobackSearch = document.querySelector(".goback-search");
  const bottomNav = document.getElementById("mybottomNav");
  const discoverHeading = document.querySelector(".search-bar-cont h2");
  const navBar = document.querySelector("nav");
  const pageContainer = document.getElementById("main");
  const loadingIndicator = document.getElementById('loading-indicator');
  let jsonData;
  let username = "yd_games_sa";
  let password = "password";
  const token = localStorage.getItem('Token');

  // Authentication function
  async function auth() {
    const LOGIN_URL = 'https://ydvassdp.com:5001/api/YDGames/Authorization/Login';
    try {
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
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
      console.error("Error during authentication:", error);
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

  // Function to check token expiration
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
    } catch (error) {
      console.error('Error decoding or parsing JWT', error);
    }
  }

  checkTokenExpiration(token);

  function toggleVisibilityBasedOnSearch() {
    if (titleInput.value) {
      gobackSearch.style.display = '';
      bottomNav.style.display = 'none';
      discoverHeading.style.display = 'none';
      navBar.style.display = 'none';
    } else {
      gobackSearch.style.display = 'none';
      bottomNav.style.display = '';
      discoverHeading.style.display = '';
      navBar.style.display = '';
    }
  }

  function showLoadingIndicator() {
    loadingIndicator.classList.remove("hidden");
    pageContainer.classList.add("hidden");
  }

  function hideLoadingIndicator() {
    loadingIndicator.classList.add("hidden");
    pageContainer.classList.remove("hidden");
  }

  async function getGamesForHomePage() {
    const GET_CATEGORIES_URL = 'https://ydvassdp.com:5001/YDGames/api/YDGames/YDGames/GetGamesForHomePage?displayCount=4';
    showLoadingIndicator();
    try {
      const response = await fetch(GET_CATEGORIES_URL, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data && data.message === 'Success!') {
        hideLoadingIndicator();
        const games = data.data;
        const gamesYouMightLikeSection = filterAndLimitGamesByCategory('Classics', games, 4);
        const popularSection = filterAndLimitGamesByCategory('Puzzles', games, 4);
        renderGames(gamesYouMightLikeSection, '.recommended .list-x', renderRecommendedGame);
        renderGames(popularSection, '.popular .pop-list', renderPopularGame);
      }
    } catch (error) {
      console.error("Error fetching games for home page:", error);
    }
  }

  function filterAndLimitGamesByCategory(category, games, limit) {
    return games.filter(game => game.category === category).slice(0, limit);
  }

  function renderGames(gamesList, selector, renderFunction) {
    const container = document.querySelector(selector);
    container.innerHTML = '';
    gamesList.forEach(game => renderFunction(game, container));
  }

  function renderRecommendedGame(game, container) {
    const gameInfoHTML = `
      <a href="${escapeHTML(game.playUrl)}" class="recommended-game">
        <img class="staricon" src="assets/staricon.svg" alt="star" />
        <img class="img" src="${escapeHTML(game.thumbnailUrl)}" alt="${escapeHTML(game.title)}" />
        <div class="recommended-game-desc">
          <h4>${escapeHTML(game.title)}</h4>
          <div>
            <button class="game-tags">strategy</button>
            <button class="game-tags">action</button>
            <button class="game-tags">Adventure</button>
          </div>
        </div>
      </a>
    `;
    container.insertAdjacentHTML('beforeend', gameInfoHTML);
  }

  function renderPopularGame(game, container) {
    const gameInfoHTML = `
      <a href="${escapeHTML(game.playUrl)}" class="popular-game">
        <img class="staricon" src="assets/staricon.svg" alt="" />
        <img class="img" src="${escapeHTML(game.thumbnailUrl)}" alt="${escapeHTML(game.title)}" />
        <div class="popular-game-desc">
          <h4>${escapeHTML(game.title)}</h4>
          <div>
            <button class="game-tags">Strategy</button>
            <button class="game-tags">Racing</button>
          </div>
        </div>
      </a>
    `;
    container.insertAdjacentHTML('beforeend', gameInfoHTML);
  }

  async function loadGameCategories() {
    const CATEGORIES_API_URL = "https://ydvassdp.com:5001/YDGames/api/YDGames/YDGames/GetAllGames";
    try {
      const response = await fetch(CATEGORIES_API_URL, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      displayCategories(data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }

  function displayCategories(categories) {
    const buttons = document.querySelectorAll('.tags');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const category = button.getAttribute('data-category');
        window.location.href = `inside--category.html?category=${encodeURIComponent(category)}`;
      });
    });
  }

  async function loadGameData() {
    const API_URL = "https://ydvassdp.com:5001/YDGames/api/YDGames/YDGames/GetAllGames";
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      jsonData = data;
    } catch (error) {
      console.error("Error fetching JSON data from GamePix:", error);
    }
  }

  function filterGamesByTitle(title) {
    if (!jsonData || !jsonData.data) {
      console.error("Invalid or empty JSON data.");
      return;
    }
    const games = jsonData.data;
    const matchingGames = games.filter((game) =>
      game.title.toLowerCase().includes(title.toLowerCase())
    );
    displayResults(matchingGames);
  }

  function displayResults(matchingGames) {
    resultsContainer.innerHTML = "";
    if (titleInput.value === "") {
      resultsContainer.appendChild(discoverSection);
      return;
    }
    if (matchingGames.length > 0) {
      matchingGames.forEach((game) => {
        const gameInfoHTML = `
          <div class="game-info" onclick="location.href='inside-game-details-play.html?gid=${game.gameId}'">
            <div class="game-img-div">
              <img class="game-img" src="${escapeHTML(game.thumbnailUrl)}" alt="${escapeHTML(game.title)}" />
            </div>
            <div class="game-info-txt">
              <h3>${escapeHTML(game.title)}</h3>
              <div class="flex">
                <p>${escapeHTML(game.category)}</p>
                <p class="game-info-txt3">Category</p>
              </div>
              <div>
                <p>${escapeHTML(game.title)}</p>
              </div>
            </div>
          </div>
        `;
        resultsContainer.insertAdjacentHTML("beforeend", gameInfoHTML);
      });
    } else {
      const notFoundMessage = `The game you were searching for could not be found "${titleInput.value}".`;
      const htmlContent = `
        <div class="search-notfound-section">
          <img src="assets/notfound.svg" alt="">
          <h3>No results</h3>
          <p>${notFoundMessage}</p>
        </div>
      `;
      resultsContainer.innerHTML = htmlContent;
    }
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  titleInput.addEventListener("input", function () {
    const title = titleInput.value;
    filterGamesByTitle(title);
    toggleVisibilityBasedOnSearch();
  });

  loadGameData();
  loadGameCategories();
  getGamesForHomePage();
});
