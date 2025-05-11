
const RSS_FEEDS_TO_FETCH = [ // Your list of RSS feed URLs
    'https://feeds.feedburner.com/TheHackersNews',
    'https://www.wired.com/feed/category/security/latest/rss',
    'https://krebsonsecurity.com/feed/',
    'https://threatpost.com/feed/',
    'https://darkreading.com/rss_simple.asp'
    // Add more feeds here if needed
];

// IMPORTANT: Configure this endpoint.
// Option 1: If deploying frontend and API to the same Vercel project:
const SERVER_API_ENDPOINT = '/api/get_rss_feeds';
// Option 2: If API is deployed elsewhere or for local Python testing (ensure port matches Python script):
// const SERVER_API_ENDPOINT = 'http://localhost:5001/api/get_rss_feeds';
// Option 3: Your actual deployed production API URL:
// const SERVER_API_ENDPOINT = 'https://your-live-api-url.com/api/get_rss_feeds';


const FEED_CONTAINER_ID = 'intel-feed-list';
const COUNTDOWN_TIMER_ID = 'intel-feed-countdown';
const REFRESH_INTERVAL_MINUTES = 20; // Be mindful of API limits if any, and server load.
const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_MINUTES * 60 * 1000;

// --- State Variables ---
let allFetchedItemsGlobal = []; // Holds all unique items fetched and processed
let displayedItemsGuidsGlobal = new Set(); // Tracks GUIDs currently displayed to manage rotation
let countdownIntervalIdGlobal = null;

// --- Keyword Filtering (Your existing keyword arrays) ---
const AI_KEYWORDS = [
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
    'generative ai', 'llm', 'large language model', 'deepfake', 'neural network',
    'computer vision', 'nlp', 'natural language processing', 'automation', 'automated', 'chatbot'
];
const SECURITY_KEYWORDS = [
    'cybersecurity', 'security', 'phishing', 'malware', 'hacking', 'hacker', 'cyberattack',
    'vulnerability', 'ransomware', 'threat', 'breach', 'exploit', 'defense', 'attack', 'apt',
    'secure', 'data protection', 'zero-day', 'incident response', 'infosec', 'endpoint', 'soc',
    'network security', 'iam', 'identity', 'encryption', 'firewall', 'intrusion', 'pentest',
    'red team', 'spoofing', 'credential', 'backdoor', 'trojan', 'spyware', 'botnet', 'ddos'
];
const SPECIFIC_AI_SEC_KEYWORDS = [
    'ai security', 'ai cybersecurity', 'ai defense', 'ai attack', 'ai threat', 'ai safety',
    'adversarial ai', 'adversarial machine learning', 'deepfake scam', 'ai phishing', 'ai-generated malware',
    'ml security', 'ai vulnerability', 'ai red team', 'ai soc', 'generative ai security',
    'llm security', 'ai incident response', 'weaponized ai', 'ai cybercrime', 'ai malware',
    'ai-powered attack', 'ai-driven defense', 'securing ai', 'ai for security operations'
];
// --- End Keyword Filtering ---

/**
 * Fetches news items from the configured server-side API endpoint.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of news items.
 */
async function fetchNewsFromServerAPI() {
    console.log("[API FETCH] Attempting to fetch news from server endpoint:", SERVER_API_ENDPOINT);
    // Encode the RSS_FEEDS_TO_FETCH array as a comma-separated string for the 'urls' query parameter
    const urlsQueryParam = encodeURIComponent(RSS_FEEDS_TO_FETCH.join(','));
    const completeFetchUrl = `${SERVER_API_ENDPOINT}?urls=${urlsQueryParam}`;

    try {
        const response = await fetch(completeFetchUrl);
        if (!response.ok) {
            let errorBody = "Could not retrieve error details.";
            try { errorBody = await response.text(); } catch (e) { /* ignore */ }
            console.error(`[API FETCH] Server API error! Status: ${response.status}`, errorBody);
            throw new Error(`Failed to fetch news from server. Status: ${response.status}. ${errorBody.substring(0,150)}`);
        }
        const items = await response.json();
        console.log(`[API FETCH] Successfully fetched ${items.length} items from server.`);
        // The server should return items already sorted by date and de-duplicated by GUID.
        return items;
    } catch (error) {
        console.error("[API FETCH] Critical error fetching or parsing news from server:", error);
        const feedContainer = document.getElementById(FEED_CONTAINER_ID);
        if (feedContainer) {
            feedContainer.innerHTML = `<div class="news-snippet text-red-500 italic p-4 rounded-md bg-red-900/30 border border-red-700">
                                         <p class="font-semibold">Error Loading Live Intel Feed</p>
                                         <p class="text-xs mt-1">${error.message || 'An unknown error occurred.'}</p>
                                         <p class="text-xs mt-1">Please try refreshing later or check the console.</p>
                                       </div>`;
        }
        return []; // Return an empty array to prevent further errors downstream
    }
}

/**
 * Filters items based on keywords.
 * Operates on item.descriptionHtml by converting it to text for searching.
 * @param {Array<object>} items - Array of news items.
 * @returns {Array<object>} Filtered array of news items.
 */
function filterRelevantNewsItems(items) {
    if (!items || items.length === 0) return [];
    console.log(`Filtering ${items.length} items for AI+Security relevance...`);
    
    // Create a temporary div for HTML to text conversion, once.
    const tempDiv = document.createElement('div');

    const relevantItems = items.filter(item => {
        const titleLower = (item.title || '').toLowerCase();
        
        // Convert item.descriptionHtml to plain text for keyword search
        tempDiv.innerHTML = item.descriptionHtml || '';
        const descLower = (tempDiv.textContent || tempDiv.innerText || "").toLowerCase();
        
        const contentToCheck = titleLower + ' ' + descLower;

        // Check 1: Highly specific AI+Security terms (high relevance)
        if (SPECIFIC_AI_SEC_KEYWORDS.some(keyword => contentToCheck.includes(keyword))) {
            return true;
        }

        // Check 2: Combination of a general AI term AND a general Security term
        const hasAiKeyword = AI_KEYWORDS.some(keyword => contentToCheck.includes(keyword));
        if (hasAiKeyword) {
            const hasSecKeyword = SECURITY_KEYWORDS.some(keyword => contentToCheck.includes(keyword));
            if (hasSecKeyword) {
                return true;
            }
        }
        return false; // If neither condition is met
    });
    console.log(`Found ${relevantItems.length} relevant items after filtering.`);
    return relevantItems;
}

/**
 * Generates a brief summary from HTML content.
 * @param {string} htmlContent - The HTML string of the article's description.
 * @param {number} targetSentences - Approximate number of sentences for the summary.
 * @param {number} maxChars - Maximum characters for the summary.
 * @returns {string} HTML string of the generated summary.
 */
function generateSimpleSummaryForDisplay(htmlContent, targetSentences = 7, maxChars = 280) {
    if (!htmlContent) {
        return '<p class="text-xs text-gray-500 mt-1 italic">No summary preview available.</p>';
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent; // Parse the HTML

    // Attempt to extract and format list items if present (very basic)
    let listHtmlOutput = "";
    const listElementsFound = [];
    // Look for <li> directly under <ul> or <ol>
    tempDiv.querySelectorAll("ul > li, ol > li").forEach(li => {
        if (listElementsFound.length < 4 && li.textContent && li.textContent.trim().length > 10) { // Max 4 list items
             listElementsFound.push(`<li>${li.textContent.trim().substring(0, 120)}...</li>`);
        }
    });
    if (listElementsFound.length > 1) { // Only add if a few list items found
        listHtmlOutput = `<ul class="list-disc list-inside ml-4 mt-1 text-xs text-gray-400">${listElementsFound.join("")}</ul>`;
    }

    // Generate text summary from the remaining text content
    let textContent = (tempDiv.textContent || tempDiv.innerText || "").trim().replace(/\s\s+/g, ' '); // Normalize spaces

    if (!textContent && !listHtmlOutput) { // If both are empty
         return '<p class="text-xs text-gray-500 mt-1 italic">Summary preview not available.</p>';
    }
    if (!textContent && listHtmlOutput) { // Only list items, no other text
        return listHtmlOutput;
    }


    // Basic sentence splitting (not perfect, but okay for previews)
    let sentences = textContent.match(/[^.!?]+[.!?]\s*/g) || [textContent];
    let summaryText = sentences.slice(0, targetSentences).join(" ").trim();

    // Truncate by character count if necessary
    if (summaryText.length > maxChars) {
        summaryText = summaryText.substring(0, maxChars).trim();
        const lastSpace = summaryText.lastIndexOf(' ');
        if (lastSpace > 0) { // Avoid cutting words
            summaryText = summaryText.substring(0, lastSpace);
        }
        summaryText += "...";
    } else if (sentences.length > targetSentences && summaryText.length > 0 && !summaryText.endsWith("...")) {
        summaryText += "..."; // Indicate truncation if sentences were cut
    }

    let textSummaryHtml = summaryText ? `<p class="text-xs text-gray-400 mt-1 feed-item-summary-text">${summaryText}</p>` : "";
    
    return `${textSummaryHtml}${listHtmlOutput}`; // Combine text summary and any extracted list
}


/**
 * Determines the target number of items to RENDER in the feed list.
 * @returns {number} The target count of items.
 */
function getTargetTotalItemCountToDisplay() {
    if (window.innerWidth < 768) return 10; // Small screens
    if (window.innerWidth < 1280) return 15; // Medium screens
    return 18; // Large screens
}

/**
 * Displays the filtered and sorted news items in the feed container.
 * Assumes `allFetchedItemsGlobal` is populated and sorted by the server.
 */
function displayNewsItemsOnPage() {
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    if (!feedContainer) {
        console.error("Feed container element not found in HTML.");
        return;
    }
    feedContainer.innerHTML = ''; // Clear previous items or loading messages

    const targetTotalItemCount = getTargetTotalItemCountToDisplay();
    
    // Filter items based on keywords. Server already sorts by date.
    let relevantItems = filterRelevantNewsItems(allFetchedItemsGlobal);

    let itemsToActuallyDisplay = [];
    let newGuidsForThisDisplayBatch = new Set();

    // Strategy: Prioritize adding items not recently displayed (not in displayedItemsGuidsGlobal)
    for (const item of relevantItems) {
        if (itemsToActuallyDisplay.length >= targetTotalItemCount) break;
        if (!displayedItemsGuidsGlobal.has(item.guid)) {
            itemsToActuallyDisplay.push(item);
            newGuidsForThisDisplayBatch.add(item.guid);
        }
    }

    // If we still need more items to reach the target count, add older relevant items
    // that weren't already added in this batch, even if they were seen in much older refreshes.
    if (itemsToActuallyDisplay.length < targetTotalItemCount) {
        for (const item of relevantItems) { // Iterate through all relevant items again
            if (itemsToActuallyDisplay.length >= targetTotalItemCount) break;
            // Only add if it wasn't already picked in the first loop (check newGuidsForThisDisplayBatch)
            if (!newGuidsForThisDisplayBatch.has(item.guid)) {
                itemsToActuallyDisplay.push(item);
                newGuidsForThisDisplayBatch.add(item.guid); // Also track these
            }
        }
    }

    if (itemsToActuallyDisplay.length === 0) {
        feedContainer.innerHTML = `<p class="text-sm text-gray-500 italic p-4 text-center">
                                     No relevant AI/Cybersecurity articles found based on current filters. 
                                     Consider broadening keywords or checking feed sources.
                                   </p>`;
        return;
    }

    // Create and append HTML elements for each item to display
    itemsToActuallyDisplay.forEach((item, index) => {
        const newsElement = document.createElement('div');
        // Using Tailwind CSS classes for styling (ensure these match your dashboard.html theme)
        newsElement.className = 'news-snippet p-3 mb-3 bg-gray-800 rounded-lg shadow-lg opacity-0 transition-opacity duration-700 ease-out flex items-start space-x-3 hover:bg-gray-700/70';
        
        // GUID is essential for linking to the full article page (blogs.html)
        const articleGuidEncoded = encodeURIComponent(item.guid);
        
        // Generate a brief summary using the full HTML description from the feed
        const summaryContentHtml = generateSimpleSummaryForDisplay(item.descriptionHtml);

        let imageHtmlSnippet = '';
        if (item.imageUrl) {
            imageHtmlSnippet = `
                <div class="flex-shrink-0 w-20 h-20 md:w-24 md:h-24"> {/* Responsive image container size */}
                    <img src="${item.imageUrl}" alt="Image for ${item.title.substring(0,30)}..."
                         class="w-full h-full object-cover rounded-md shadow-md"
                         onerror="this.style.display='none'; console.warn('Image failed to load: ${item.imageUrl}')">
                </div>
            `;
        } else {
            // Placeholder for items without images to maintain layout consistency
            imageHtmlSnippet = `<div class="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 bg-gray-700 rounded-md flex items-center justify-center text-gray-500 text-xs p-1">No Image</div>`;
        }

        newsElement.innerHTML = `
            ${imageHtmlSnippet}
            <div class="flex-grow overflow-hidden">
                <h4 class="text-sm font-semibold text-gray-100 hover:text-cyan-400 transition-colors duration-150 truncate" title="${item.title}">
                    <a href="blogs.html?article=${articleGuidEncoded}" class="focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded">
                        ${item.title}
                    </a>
                </h4>
                <p class="text-xs text-gray-400 mb-1.5">${item.sourceName} - ${new Date(item.pubDateStr).toLocaleDateString()}</p>
                <div class="summary-container text-xs text-gray-300 max-h-24 overflow-hidden relative">
                    ${summaryContentHtml}
                    ${summaryContentHtml.length > 150 ? '<div class="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-gray-800 to-transparent"></div>' : ''} {/* Fade out long summaries */}
                </div>
            </div>
        `;
        feedContainer.appendChild(newsElement);
        // Staggered fade-in animation for a nicer visual effect
        setTimeout(() => newsElement.classList.remove('opacity-0'), 60 * index + 50);
    });

    // Update the set of GUIDs that are currently displayed for the next refresh cycle's filtering
    displayedItemsGuidsGlobal = newGuidsForThisDisplayBatch;
    console.log(`Displayed ${itemsToActuallyDisplay.length} news items on the page.`);
}

/**
 * Main function to refresh all feeds: fetches from server, processes, and updates display.
 */
async function refreshAllNewsFeeds() {
    console.log("Refreshing all news feeds using the server API...");
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    
    // Show loading message only if the container is empty or showing a previous status message
    if (feedContainer && (!feedContainer.firstChild || feedContainer.firstChild.nodeName === 'P')) {
        feedContainer.innerHTML = '<p class="text-sm text-gray-500 italic p-4 text-center">Fetching latest intel from server...</p>';
    }

    const newItemsFromServer = await fetchNewsFromServerAPI();

    if (newItemsFromServer && newItemsFromServer.length >= 0) { // Allow empty array if server returns no relevant items
        // The server handles de-duplication by GUID and sorting by date.
        // So, newItemsFromServer becomes our new source of truth for allFetchedItemsGlobal.
        allFetchedItemsGlobal = newItemsFromServer;
        console.log(`[REFRESH] Total unique items received from server: ${allFetchedItemsGlobal.length}`);
    } else { 
        // fetchNewsFromServerAPI would have already logged an error and potentially updated the UI.
        // We might not want to clear allFetchedItemsGlobal if the fetch fails, to keep old data visible.
        console.log("[REFRESH] No new items received from server or an error occurred. Existing data (if any) will be used for display.");
    }

    // Store the latest complete, de-duplicated list from the server in sessionStorage
    // This is used by blogs.html or for faster initial load.
    try {
        sessionStorage.setItem('allFetchedNewsItems', JSON.stringify(allFetchedItemsGlobal));
        console.log(`Stored ${allFetchedItemsGlobal.length} news items in sessionStorage.`);
    } catch (e) {
        console.error("Error saving news items to sessionStorage:", e);
        if (feedContainer && !feedContainer.querySelector('.session-storage-error')) { // Avoid duplicate error messages
            const errorDiv = document.createElement('p');
            errorDiv.className = 'text-xs text-red-500 p-2 text-center session-storage-error';
            errorDiv.textContent = 'Warning: Could not save news to session storage (browser quota may be full). Offline viewing might be affected.';
            feedContainer.prepend(errorDiv); // Prepend to show at the top
        }
    }
    
    // Update the news items displayed on the dashboard
    displayNewsItemsOnPage();
    // Restart the countdown timer for the next refresh
    startCountdownTimer();
}

/**
 * Starts or restarts the countdown timer for the next automatic refresh.
 */
function startCountdownTimer() {
    const countdownElement = document.getElementById(COUNTDOWN_TIMER_ID);
    if (!countdownElement) {
        console.warn("Countdown timer element not found in HTML.");
        return;
    }
    if (countdownIntervalIdGlobal) {
        clearInterval(countdownIntervalIdGlobal);
    }
    let timeLeftInMs = REFRESH_INTERVAL_MS;

    const updateTimerDisplay = () => {
        countdownElement.innerHTML = `Next update in: <span class="font-semibold font-orbitron text-cyan-400">${formatTimeForDisplay(timeLeftInMs)}</span>`;
        timeLeftInMs -= 1000;
        if (timeLeftInMs < 0) {
            clearInterval(countdownIntervalIdGlobal);
            // Timer reaches zero, refreshAllNewsFeeds will be called by the main setInterval
        }
    };
    updateTimerDisplay(); // Initial display
    countdownIntervalIdGlobal = setInterval(updateTimerDisplay, 1000);
}

/**
 * Formats milliseconds into a MM:SS string for display.
 * @param {number} ms - Milliseconds.
 * @returns {string} Formatted time string.
 */
function formatTimeForDisplay(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Initializes the news feed system when the page loads.
 */
function initializeNewsFeedSystem() {
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    const countdownElement = document.getElementById(COUNTDOWN_TIMER_ID);

    if (!feedContainer) {
        console.error(`Critical Error: News feed container #${FEED_CONTAINER_ID} not found. Feed cannot be displayed.`);
        return;
    }
    if (!countdownElement) {
        console.warn(`Warning: Countdown timer element #${COUNTDOWN_TIMER_ID} not found. Timer will not be displayed.`);
    }

    // Attempt to load from sessionStorage for faster initial display
    try {
        const storedItemsJson = sessionStorage.getItem('allFetchedNewsItems');
        if (storedItemsJson) {
            allFetchedItemsGlobal = JSON.parse(storedItemsJson);
            console.log(`Loaded ${allFetchedItemsGlobal.length} items from sessionStorage on initial page load.`);
            if (allFetchedItemsGlobal.length > 0) {
                // Server should sort, but ensure if loading from old session
                allFetchedItemsGlobal.sort((a, b) => new Date(b.pubDateStr) - new Date(a.pubDateStr));
                displayNewsItemsOnPage(); // Display immediately from cache
            }
        }
    } catch (e) {
        console.error("Error loading or parsing news items from sessionStorage on init:", e);
        sessionStorage.removeItem('allFetchedNewsItems'); // Clear potentially corrupted data
    }

    // Perform initial fetch from the server API
    refreshAllNewsFeeds();
    // Set up periodic refresh
    setInterval(refreshAllNewsFeeds, REFRESH_INTERVAL_MS);

    console.log(`News feed system initialized (server-backed). Auto-refresh interval: ${REFRESH_INTERVAL_MINUTES} minutes.`);
}

// --- Script Entry Point: Wait for DOM to be fully loaded ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("news-feed.js (server-backed v2) loaded. Initializing news feed system...");
    initializeNewsFeedSystem();
});
