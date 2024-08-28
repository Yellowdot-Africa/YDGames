document.addEventListener('DOMContentLoaded', async function () {
  const gameDetailContainer = document.getElementById('game-detail');
  const username = 'yd_games_sa';
  const password = 'password';
  let token = localStorage.getItem('Token');

  await checkTokenExpiration(token);

  async function auth() {
      const LOGIN_URL = 'https://ydvassdp.com:5001/api/YDGames/Authorization/Login';
      try {
          const response = await fetch(LOGIN_URL, {
              method: 'POST',
              headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
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

  function getGameIdFromQueryParam() {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('gid');
  }

  function showLoadingIndicator() {
      const loadingIndicator = document.getElementById('loading-indicator');
      loadingIndicator.classList.remove('hidden');
      pageContainer.classList.add('hidden');
  }

  function hideLoadingIndicator() {
      const loadingIndicator = document.getElementById('loading-indicator');
      loadingIndicator.classList.add('hidden');
      pageContainer.classList.remove('hidden');
  }

  async function fetchGameDetails(gid) {
      const BASE_URL = 'https://ydvassdp.com:5001/YDGames/api/YDGames/YDGames/GetAllGames';
      showLoadingIndicator();

      try {
          const response = await fetch(BASE_URL, {
              method: 'GET',
              headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              }
          });
          const data = await response.json();
          const games = data.data;
          const filteredGame = games.find(game => game.gameId === gid);
          const categoryHTML = `<span class="game-tag">${escapeHTML(filteredGame.category)}</span>`;
          const fullDescription = filteredGame.description;
          const words = filteredGame.description.split(' ');
          const shortDescription = words.length > 30 ? words.slice(0, 30).join(' ') + '...' : fullDescription;

          const gameDetailHTML = `
              <div class="">
                  <div>
                      <img class="desc-img" src="${escapeHTML(filteredGame.thumbnailUrl)}" alt="${escapeHTML(filteredGame.title)}" />
                  </div>
                  <div class="game-title">
                      <div class="flex">
                          <h3>${escapeHTML(filteredGame.title)}</h3>
                          <div class="flex star">
                              <img src="assets/icons/ant-design_star-filled.svg" alt="star icon" />
                              <img src="assets/icons/ant-design_star-filled.svg" alt="star icon" />
                              <img src="assets/icons/ant-design_star-filled.svg" alt="star icon" />
                              <img src="assets/icons/ant-design_star-filled.svg" alt="star icon" />
                              <img src="assets/icons/ant-design_star-filled.svg" alt="star icon" />
                          </div>
                      </div>
                      <div>${categoryHTML}</div>
                  </div>
              </div>
              <button class="btn gdiscoverbtn" onclick="location.href='${escapeHTML(filteredGame.playUrl)}'">Play Now</button>
              </div>
              <div class="game-details-text">
                  <h4>About this Game</h4>
                  <p id="short-description">${escapeHTML(shortDescription)}
                      ${words.length > 30 ? '<a href="#" class="see-all" id="see-more">See More</a>' : ''}
                  </p>
                  <p id="full-description" class="hidden">${escapeHTML(fullDescription)}</p>
              </div>
          `;

          gameDetailContainer.innerHTML = gameDetailHTML;
          filterGamesByCategory(filteredGame.category);
          hideLoadingIndicator();
          setupSeeMoreListener();
      } catch (error) {
          console.error('Error fetching game details:', error);
      }
  }

  function setupSeeMoreListener() {
      const seeMoreLink = document.getElementById('see-more');
      if (seeMoreLink) {
          seeMoreLink.addEventListener('click', function (event) {
              event.preventDefault();
              document.getElementById('short-description').classList.add('hidden');
              document.getElementById('full-description').classList.remove('hidden');
          });
      }
  }

  function filterGamesByCategory(category) {
      const popularGamesContainer = document.querySelector('#category-games .popular .games-container');
      const recommendedGamesContainer = document.querySelector('#category-games .for-you .games-container');

      popularGamesContainer.innerHTML = '<div class="loading-indicator"></div>';
      recommendedGamesContainer.innerHTML = '<div class="loading-indicator"></div>';

      const BASE_URL = 'https://ydvassdp.com:5001/YDGames/api/YDGames/YDGames/GetGamesInCategory';

      fetch(`${BASE_URL}?category=${category}`, {
          method: 'GET',
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          }
      })
      .then((response) => response.json())
      .then((data) => {
          const games = data.data;
          const popularGames = games.sort((a, b) => b.played - a.played).slice(0, 10);
          const recommendedGames = games.sort((a, b) => b.played - a.played).slice(11, 20);

          renderFilterGames(popularGames, '#category-games .popular .games-container');
          renderFilterGames(recommendedGames, '#category-games .for-you .games-container');
      })
      .catch((error) => {
          console.error('Error fetching games by category:', error);
          popularGamesContainer.innerHTML = 'Error loading games.';
          recommendedGamesContainer.innerHTML = 'Error loading games.';
      });
  }

  function renderFilterGames(gamesList, selector) {
      const container = document.querySelector(selector);
      if (!container) {
          console.error(`No element found for selector: ${selector}`);
          return;
      }
      container.innerHTML = '';

      shuffleArray(gamesList);

      gamesList.forEach((game) => {
          const gameInfoHTML = `
              <div class="item" onclick="location.href='inside-game-details-play.html?gid=${escapeHTML(game.gameId)}'">
                  <img class="item-img" src="${escapeHTML(game.thumbnailUrl)}" alt="${escapeHTML(game.title)}" />
                  <p>${escapeHTML(game.title)}</p>
              </div>
          `;
          container.insertAdjacentHTML('beforeend', gameInfoHTML);
      });
  }

  function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  }

  function escapeHTML(str) {
      const div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
  }

  const gid = getGameIdFromQueryParam();

  if (gid) {
      fetchGameDetails(gid);
  } else {
      gameDetailContainer.textContent = 'Invalid game ID.';
  }
});
