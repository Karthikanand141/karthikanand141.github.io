// Initialize AOS animation
AOS.init({
  duration: 1000,
  once: true,
  easing: 'ease-in-out'
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

// Dark mode toggle
const toggle = document.getElementById('theme-toggle');
toggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  toggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

// Typewriter effect
const text = "Python Developer | Data Enthusiast | Tech Learner";
const typewriter = document.getElementById("typewriter");
let index = 0;

function type() {
  if (index < text.length) {
    typewriter.textContent += text.charAt(index);
    index++;
    setTimeout(type, 80);
  }
}
window.onload = type;
