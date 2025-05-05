
// js/main.js

/**
 * Initializes common functionalities like mobile menu toggle.
 */
function initCommon() {
    console.log("Initializing common scripts...");

    // --- Mobile Menu Toggle ---
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            const isHidden = mobileMenu.classList.contains('hidden');
            mobileMenu.classList.toggle('hidden');
            menuBtn.setAttribute('aria-expanded', String(!isHidden)); // Toggle aria-expanded
             // Optional: Change button text/icon
             menuBtn.textContent = isHidden ? '✕' : '☰'; // Simple text change
            console.log(`Mobile menu toggled: ${isHidden ? 'Open' : 'Closed'}`);
        });

        // Close mobile menu when a link inside it is clicked
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                menuBtn.setAttribute('aria-expanded', 'false');
                menuBtn.textContent = '☰'; // Reset button text
                console.log("Mobile menu closed via link click.");
            });
        });
         console.log("Mobile menu listeners attached.");
    } else {
        console.warn("Mobile menu button or panel not found.");
    }

    // --- Active Nav Link Highlighting (Optional - for single page scroll feel, less relevant for multi-page) ---
    // If using separate pages, active state should be set via class in HTML directly.
    // If you still want scroll-based highlighting *within* a long page:
    /*
    const navLinks = document.querySelectorAll('#nav-links a, #mobile-menu a');
    const sections = document.querySelectorAll('main section[id]'); // Assuming sections have IDs

    if (sections.length > 0 && navLinks.length > 0) {
        const observerOptions = { root: null, rootMargin: '0px', threshold: 0.4 };
        const observer = new IntersectionObserver((entries) => {
            let currentActive = null;
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    currentActive = `#${entry.target.id}`;
                }
            });

            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === currentActive);
            });
        }, observerOptions);
        sections.forEach(section => { observer.observe(section); });
        console.log("Scroll spy for active nav link initialized.");
    }
    */

    console.log("Common scripts initialization complete.");
}

// Run initializations when the DOM is ready
document.addEventListener('DOMContentLoaded', initCommon);
