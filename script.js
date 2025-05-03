// Mobile menu toggle (will expand later)
document.querySelector('nav button').addEventListener('click', () => {
  const menu = document.querySelector('.md\\:flex');
  menu.classList.toggle('hidden');
});

// Typewriter effect for terminal vibe
function typeWriter(elementId, text, speed = 50) {
  let i = 0;
  const elem = document.getElementById(elementId);
  if (!elem) return;

  function type() {
    if (i < text.length) {
      elem.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  type();
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  typeWriter('terminal-text', 'Initializing AI threat detection...');
});
