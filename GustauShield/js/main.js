// js/main.js

/**
 * Initializes common functionalities like mobile menu toggle.
 */
function initCommon() {
    console.log("Initializing common scripts (main.js)...");

    // --- Mobile Menu Toggle ---
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            const isHidden = mobileMenu.classList.contains('hidden');
            mobileMenu.classList.toggle('hidden'); // Toggles visibility
            menuBtn.setAttribute('aria-expanded', String(!isHidden)); // Update accessibility state

            // Simple text toggle for button (☰ / ✕)
            menuBtn.textContent = isHidden ? '✕' : '☰';
            console.log(`Mobile menu toggled: ${isHidden ? 'Open' : 'Closed'}`);
        });

        // Close mobile menu when a link inside it is clicked
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                // Only close if the menu is actually open
                if (!mobileMenu.classList.contains('hidden')) {
                     mobileMenu.classList.add('hidden');
                     menuBtn.setAttribute('aria-expanded', 'false');
                     menuBtn.textContent = '☰'; // Reset button text
                     console.log("Mobile menu closed via link click.");
                }
            });
        });
         console.log("Mobile menu listeners attached.");
    } else {
        // Don't log error on index.html as it doesn't have the menu
        if (document.getElementById('navbar') && !document.getElementById('home')) { // Check if navbar exists and not on potential landing page
             console.warn("Mobile menu button or panel not found on a page with navbar.");
        }
    }

    // --- Other common initializations could go here ---
    // Example: Smooth scroll for internal links (if not handled by CSS)
    // document.querySelectorAll('a[href^="#"]').forEach(anchor => { ... });

    console.log("Common scripts initialization complete.");
}

// Run initializations when the DOM is ready
// This ensures it runs on dashboard, simulations, blog, about pages
if (document.readyState === 'loading') { // Loading hasn't finished yet
    document.addEventListener('DOMContentLoaded', initCommon);
} else { // `DOMContentLoaded` has already fired
    initCommon();
}
console.log("main.js loaded.");
