const menuBtn = document.querySelector(".myMenuBtn");
const menuBtn2 = document.querySelector(".myMenuBtn2");
const overlay = document.getElementById("overlay");
const soverlay = document.getElementById("Soverlay");
const closeBtn = document.querySelectorAll(".closebtn");
const sideNavbar = document.getElementById("mySidenav");
const pageContainer = document.getElementById("main");
const bottomNav = document.getElementById("mybottomNav");
// const removeModal = document.querySelectorAll(".remove-btn")
const modal = document.getElementById("id01");
// const showModal = document.querySelector(".fav-btn")


menuBtn.addEventListener("click", () => {
  sideNavbar.style.width = "100%";
    soverlay.style.opacity = "1";
    soverlay.style.visibility = "visible";
  });

  menuBtn2.addEventListener("click", () => {
    sideNavbar.style.width = "100%";
      soverlay.style.opacity = "1";
      soverlay.style.visibility = "visible";
    });
  

closeBtn.forEach((btn) => {
  btn.addEventListener("click", () => {
    sideNavbar.style.width = "0%";
    soverlay.style.opacity = "0";
    soverlay.style.visibility = "hidden";
  });
});

// Code to hide the bottom navigation on scroll
let lastScrollTop = 0;
window.addEventListener("scroll", function () {
  let currentScroll = window.scrollY;
  if (currentScroll > lastScrollTop) {
    bottomNav.style.bottom = "-100px";
  } else {
    bottomNav.style.bottom = "0";
  }
  lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
}, false);

function showModal() {
  modal.style.display = "block";
  overlay.classList.add("visible");
}

function removeModal() {
  modal.style.display = "none";
  overlay.classList.remove("visible");
}

const item = document.querySelectorAll(".item");
const sliders = document.querySelectorAll(".list-x");
let isDown = false;
let startX;
let scrollLeft;

sliders.forEach((slider) => {
  slider.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });
  slider.addEventListener("mouseleave", () => {
    isDown = false;
    slider.classList.remove("active");
  });
  slider.addEventListener("mouseup", () => {
    isDown = false;
    slider.classList.remove("active");
  });
  slider.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 3; //scroll-fast
    slider.scrollLeft = scrollLeft - walk;
  });
});
// showModal.addEventListener('click', ()=>{
//   modal.style.display= 'block'
//   overlay.classList.remove('hidden');

// When the user clicks anywhere outside of the modal, close it
// window.onclick = function(event) {
//   if (event.target == modal) {
//     modal.style.display = "none";

//   }
// }
