// script.js

// Initialize the AOS (Animate On Scroll) library
AOS.init({
  duration: 1000,      // Animation duration (in ms)
  once: true,          // Animation only happens once when scrolling down
  easing: 'ease-in-out' // Smooth animation style
});

// Smooth scroll for nav links
document.querySelectorAll('.navbar a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

// (Optional) Dark mode toggle - you can add this later
/*
const toggle = document.getElementById('theme-toggle');
toggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});
*/
