// js/main.js

/**
 * Initializes common functionalities across all pages,
 * such as the mobile menu and the contact modal.
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
            menuBtn.textContent = isHidden ? '✕' : '☰'; // Simple text change for open/close
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
        console.warn("Mobile menu button or panel not found on this page.");
    }

    // --- Contact FAB and Modal Logic ---
    const contactFab = document.getElementById('contact-fab');
    const contactModal = document.getElementById('contact-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');

    if (contactFab && contactModal) {
        contactFab.addEventListener('click', () => {
            contactModal.classList.remove('hidden');
            contactModal.setAttribute('aria-hidden', 'false');
            // Optional: You could add focus management here for accessibility,
            // for example, focusing on the first input field in the modal.
            const firstInput = contactModal.querySelector('input[name="name"], input[name="email"], textarea[name="message"]');
            if (firstInput) {
                firstInput.focus();
            }
            console.log("Contact modal opened.");
        });
    } else {
        console.warn("Contact FAB or Modal container not found on this page (contact-fab, contact-modal).");
    }

    if (closeModalBtn && contactModal) {
        closeModalBtn.addEventListener('click', () => {
            contactModal.classList.add('hidden');
            contactModal.setAttribute('aria-hidden', 'true');
            console.log("Contact modal closed via close button.");
        });
    } else {
        console.warn("Close modal button not found on this page (close-modal-btn).");
    }

    // Optional: Close modal if clicking outside the content card (on the backdrop)
    if (contactModal) {
        contactModal.addEventListener('click', (event) => {
            // Check if the click is directly on the modal backdrop (event.target)
            // and not on any of its children (the modal content card).
            if (event.target === contactModal) {
                contactModal.classList.add('hidden');
                contactModal.setAttribute('aria-hidden', 'true');
                console.log("Contact modal closed via backdrop click.");
            }
        });
    }
    // --- End Contact FAB and Modal Logic ---

    console.log("Common scripts initialization complete.");
}

// Run initializations when the DOM is ready
document.addEventListener('DOMContentLoaded', initCommon);


// --- Simulated Real-time News Feed Logic (Existing from your provided code) ---
// Note: You mentioned previously deleting the intel feed section. 
// If this news feed logic is no longer used, you might consider removing it.
// For now, I am keeping it as it was in your provided main.js.

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

/**
 * Updates the intel feed with a new random item.
 * This function seems to be part of your older "intel feed" logic.
 */
function updateIntelFeed() {
    const feedList = document.getElementById('intel-feed-list');
    if (!feedList) {
        // console.warn("Intel feed list element ('intel-feed-list') not found on this page.");
        return; // Exit if element not found
    }

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

/**
 * Fetches and displays news from an RSS feed.
 * This function also seems to be part of your older "intel feed" logic.
 * @param {string} feedUrl - The URL of the RSS feed.
 * @param {string} containerId - The ID of the HTML element to populate with news.
 * @param {string} [proxy='https://api.allorigins.win/raw?url='] - The CORS proxy URL.
 */
async function fetchAndDisplayNews(feedUrl, containerId, proxy = 'https://api.allorigins.win/raw?url=') {
    const feedContainer = document.getElementById(containerId);
    if (!feedContainer) {
        // console.error(`News feed container #${containerId} not found on this page.`);
        return;
    }

    const urlToFetch = `${proxy}${encodeURIComponent(feedUrl)}`;
    console.log(`Fetching news from: ${urlToFetch} for container #${containerId}`);

    try {
        feedContainer.innerHTML = '<p class="text-sm text-medium-gray italic p-4 text-center">Fetching news feed...</p>'; // Loading message
        const response = await fetch(urlToFetch);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${feedUrl}`);
        }
        const data = await response.text(); // Get XML as text

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "text/xml");
        
        let items = xmlDoc.querySelectorAll("item");
        if (!items || items.length === 0) {
            items = xmlDoc.querySelectorAll("entry"); // Fallback for Atom feeds
        }

        if (!items || items.length === 0) {
            feedContainer.innerHTML = '<p class="text-sm text-medium-gray italic p-4 text-center">Could not find news items in the feed.</p>';
            console.warn("No <item> or <entry> tags found in fetched feed from " + feedUrl);
            return;
        }

        feedContainer.innerHTML = ''; // Clear loading message

        let itemCount = 0;
        const maxItemsToShow = 5; 

        items.forEach(item => {
            if (itemCount >= maxItemsToShow) return;

            const title = item.querySelector("title")?.textContent || 'No title available';
            const link = item.querySelector("link")?.textContent || 
                         (item.querySelector("link[href]") ? item.querySelector("link[href]").getAttribute('href') : '#'); // Handle Atom links
            let pubDate = item.querySelector("pubDate")?.textContent || item.querySelector("published")?.textContent || item.querySelector("updated")?.textContent || '';
            let sourceName = xmlDoc.querySelector("channel > title")?.textContent || xmlDoc.querySelector("feed > title")?.textContent || 'Unknown Source';

            if (pubDate) {
                try {
                    pubDate = new Date(pubDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                } catch (e) { /* Ignore date parsing error, keep original string */ }
            }

            const newsElement = document.createElement('div');
            newsElement.className = 'news-snippet p-3 mb-2 bg-slate-800/40 rounded-md border border-slate-700/50'; // Added some default styling
            newsElement.innerHTML = `
                <time class="text-xs text-gray-500 block mb-0.5">${pubDate} - ${sourceName}</time>
                <h5 class="text-sm font-medium text-light-gray hover:text-cyber-cyan mb-1 leading-tight">
                    <a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a>
                </h5>
                <a href="${link}" target="_blank" rel="noopener noreferrer" class="text-xs text-cyber-blue hover:text-cyber-cyan underline">
                    Read more &rarr;
                </a>
            `;
            feedContainer.appendChild(newsElement);
            itemCount++;
        });

        if (itemCount === 0) {
             feedContainer.innerHTML = '<p class="text-sm text-medium-gray italic p-4 text-center">No news items to display currently.</p>';
        }
        console.log(`Displayed ${itemCount} news items in #${containerId}.`);

    } catch (error) {
        console.error(`Error fetching or parsing RSS feed for #${containerId}:`, error);
        feedContainer.innerHTML = `<p class="text-sm text-red-400 italic p-4 text-center">Error loading news feed. Please try again later.</p>`;
    }
}

// --- Script Load Confirmation ---
console.log("main.js loaded: Common functions and potentially news feed logic available.");
