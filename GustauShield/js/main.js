
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


// --- Simulated Real-time News Feed Logic ---

// 1. Define your curated news items (Add more real ones!)
const curatedNews = [
    { time: "May 6, 2025", source: "Wired", title: "New AI Phishing Tactics Bypass Multi-Factor Authentication", link: "#" }, // Replace # with real link
    { time: "May 5, 2025", source: "KrebsOnSecurity", title: "AI Used to Generate Undetectable Malware Payloads", link: "#" },
    { time: "May 5, 2025", source: "BleepingComputer", title: "Deepfake Voice Scam Costs Tech Firm $2 Million", link: "#" },
    { time: "May 4, 2025", source: "The Hacker News", title: "AI Security Tools Identify Zero-Day Faster Than Humans", link: "#" },
    { time: "May 4, 2025", source: "TechCrunch", title: "Debate Grows on Regulating AI for Offensive Cyber Ops", link: "#" },
    { time: "May 3, 2025", source: "ZDNet", title: "How AI Is Revolutionizing Endpoint Detection and Response (EDR)", link: "#" },
    { time: "May 3, 2025", source: "Ars Technica", title: "Adversarial AI Attacks Fooling Facial Recognition Systems", link: "#" },
    // Add more real headlines and links here...
];

function updateIntelFeed() {
    const feedList = document.getElementById('intel-feed-list');
    if (!feedList) return; // Exit if element not found

    // Clear initial message if present
    const initialMsg = feedList.querySelector('p.italic');
    if (initialMsg) initialMsg.remove();

    // Select a random news item
    const randomIndex = Math.floor(Math.random() * curatedNews.length);
    const newItem = curatedNews[randomIndex];

    // Create the HTML for the new item
    const newsElement = document.createElement('div');
    newsElement.className = 'news-snippet opacity-0 transition-opacity duration-500'; // Start hidden for fade-in
    newsElement.innerHTML = `
        <time datetime="${new Date().toISOString()}">${newItem.time} - ${newItem.source}</time>
        <p class="text-sm text-light-gray mb-1">${newItem.title}</p>
        <a href="${newItem.link}" target="_blank" rel="noopener noreferrer" class="text-xs text-cyber-blue hover:text-cyber-cyan underline">
            Read the article &rarr;
        </a>
    `;

    // Add to top of list
    feedList.insertBefore(newsElement, feedList.firstChild);

    // Trigger fade-in effect
    setTimeout(() => newsElement.classList.remove('opacity-0'), 50);

    // Limit the number of items shown (e.g., keep only the latest 5)
    const maxItems = 5;
    while (feedList.children.length > maxItems) {
        feedList.removeChild(feedList.lastChild);
    }
}

// Start updating the feed periodically after initial page load
// Adjust interval (milliseconds) as desired (15000ms = 15 seconds)
// Avoid setting it too low (like every minute) as it uses static data.
// setInterval(updateIntelFeed, 15000);

// Call it once immediately to populate
// updateIntelFeed();
// Note: You might want to call this within the main DOMContentLoaded listener
// in dashboard.html's inline script, after ensuring the element exists.
// Example call within dashboard.html's DOMContentLoaded:
/*
    if (document.getElementById('intel-feed-list')) {
       updateIntelFeed(); // Initial population
       setInterval(updateIntelFeed, 15000); // Start updates
       console.log("Intel feed initialized.");
    } else {
       console.error("Intel feed list element not found.");
    }
*/

