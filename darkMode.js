// Dark mode implementation
const checkbox = document.getElementById('checkbox');
const main = document.getElementById('main');

//Dark mode implementation functionality
// check if it is enabled
// if it's enabled turn it off
// if it's diables turn if on

let darkMode = localStorage.getItem('darkMode');

const enableDarkMode = () => {
  document.body.classList.add('dark-theme');
  localStorage.setItem('darkMode', 'enabled');
}

const disableDarkMode = () => {
  document.body.classList.remove('dark-theme');
  localStorage.setItem('darkMode', null);
}

if (darkMode === 'enabled') {
  enableDarkMode();
}

checkbox.addEventListener('change', () => {
  darkMode = localStorage.getItem("darkMode")
  console.log("clicked");
  if (darkMode !== 'enabled') {
    enableDarkMode();
    console.log(darkMode);
  } else {
    disableDarkMode();
    console.log(darkMode);
  }
});

//sidebar implementation
// document.addEventListener("DOMContentLoaded", function() {
//     const sidebarContainer = document.getElementById('sidebar');

//     fetch('sidebar.html')
//         .then(response => response.text())
//         .then(data => {
//             sidebarContainer.innerHTML = data;
//         })
//         .catch(error => console.error('Error loading sidebar:', error));
// });
