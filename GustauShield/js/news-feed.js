// File: js/news-feed.js
// (Make sure SERVER_API_ENDPOINT and RSS_FEEDS_TO_FETCH are correctly set at the top)

// --- Constants ---
const RSS_FEEDS_TO_FETCH = [ // Your list of RSS feed URLs
    'https://feeds.feedburner.com/TheHackersNews',
    'https://www.wired.com/feed/category/security/latest/rss',
    'https://krebsonsecurity.com/feed/',
    'https://threatpost.com/feed/',
    'https://darkreading.com/rss_simple.asp'
];
const SERVER_API_ENDPOINT = '/api/get_rss_feeds'; // ADJUST IF NEEDED!
const FEED_CONTAINER_ID = 'intel-feed-list';
const COUNTDOWN_TIMER_ID = 'intel-feed-countdown';
const REFRESH_INTERVAL_MINUTES = 20;
const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_MINUTES * 60 * 1000;

// --- State Variables ---
let allFetchedItemsGlobal = [];
let displayedItemsGuidsGlobal = new Set();
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

async function fetchNewsFromServerAPI() {
    console.log("[API FETCH] Attempting to fetch news from server endpoint:", SERVER_API_ENDPOINT);
    const urlsQueryParam = encodeURIComponent(RSS_FEEDS_TO_FETCH.join(','));
    const completeFetchUrl = `${SERVER_API_ENDPOINT}?urls=${urlsQueryParam}`;
    console.log("[API FETCH] Calling URL:", completeFetchUrl); // Log the exact URL

    try {
        const response = await fetch(completeFetchUrl);
        if (!response.ok) {
            let errorBody = "Could not retrieve error details from server response.";
            try { errorBody = await response.text(); } catch (e) { console.warn("Could not get text from error response", e); }
            console.error(`[API FETCH] Server API error! Status: ${response.status}`, errorBody);
            throw new Error(`Failed to fetch news from server. Status: ${response.status}. Server says: ${errorBody.substring(0,150)}`);
        }
        const items = await response.json();
        // *** DEBUG LINE ADDED ***
        console.log("[API FETCH] Data received from server:", JSON.stringify(items, null, 2));
        // *** DEBUG LINE ADDED ***
        alert(`[Debug] Received ${items.length} items from server. Check browser console for full data.`);

        console.log(`[API FETCH] Successfully fetched ${items.length} items from server.`);
        return items;
    } catch (error) {
        console.error("[API FETCH] Critical error fetching or parsing news from server:", error);
        // *** DEBUG LINE ADDED ***
        alert(`[Debug] ERROR fetching from server: ${error.message}. Check console.`);
        const feedContainer = document.getElementById(FEED_CONTAINER_ID);
        if (feedContainer) {
            feedContainer.innerHTML = `<div class="news-snippet text-red-500 italic p-4 rounded-md bg-red-900/30 border border-red-700">
                                         <p class="font-semibold">Error Loading Live Intel Feed</p>
                                         <p class="text-xs mt-1">${error.message || 'An unknown error occurred.'}</p>
                                         <p class="text-xs mt-1">Please try refreshing later or check the console for details.</p>
                                       </div>`;
        }
        return [];
    }
}

function filterRelevantNewsItems(items) {
    if (!items || items.length === 0) {
        // *** DEBUG LINE ADDED ***
        console.log("[FILTER] No items received to filter.");
        return [];
    }
    // *** DEBUG LINE ADDED ***
    console.log(`[FILTER] Starting to filter ${items.length} items. First item:`, JSON.stringify(items[0], null, 2));
    
    const tempDiv = document.createElement('div');
    const relevantItems = items.filter(item => {
        const titleLower = (item.title || '').toLowerCase();
        tempDiv.innerHTML = item.descriptionHtml || '';
        const descLower = (tempDiv.textContent || tempDiv.innerText || "").toLowerCase();
        const contentToCheck = titleLower + ' ' + descLower;

        if (SPECIFIC_AI_SEC_KEYWORDS.some(keyword => contentToCheck.includes(keyword))) return true;
        const hasAiKeyword = AI_KEYWORDS.some(keyword => contentToCheck.includes(keyword));
        if (hasAiKeyword) {
            return SECURITY_KEYWORDS.some(keyword => contentToCheck.includes(keyword));
        }
        return false;
    });

    // *** DEBUG LINE ADDED ***
    console.log(`[FILTER] Finished filtering. ${relevantItems.length} items remaining. First relevant item (if any):`, JSON.stringify(relevantItems[0], null, 2));
    if (items.length > 0 && relevantItems.length === 0) {
        // *** DEBUG LINE ADDED ***
        alert("[Debug] All items were filtered out by keywords! Check console for original items and verify keywords/content.");
    }
    return relevantItems;
}

function generateSimpleSummaryForDisplay(htmlContent, targetSentences = 7, maxChars = 280) {
    // This function seems okay, but ensure htmlContent is what you expect.
    // console.log("[SUMMARY GEN] Input HTML for summary:", htmlContent ? htmlContent.substring(0,100) + "..." : "null");
    if (!htmlContent) {
        return '<p class="text-xs text-gray-500 mt-1 italic">No summary preview available.</p>';
    }
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    let listHtmlOutput = "";
    const listElementsFound = [];
    tempDiv.querySelectorAll("ul > li, ol > li").forEach(li => {
        if (listElementsFound.length < 4 && li.textContent && li.textContent.trim().length > 10) {
             listElementsFound.push(`<li>${li.textContent.trim().substring(0, 120)}...</li>`);
        }
    });
    if (listElementsFound.length > 1) {
        listHtmlOutput = `<ul class="list-disc list-inside ml-4 mt-1 text-xs text-gray-400">${listElementsFound.join("")}</ul>`;
    }
    let textContent = (tempDiv.textContent || tempDiv.innerText || "").trim().replace(/\s\s+/g, ' ');
    if (!textContent && !listHtmlOutput) {
         return '<p class="text-xs text-gray-500 mt-1 italic">Summary preview not available.</p>';
    }
    if (!textContent && listHtmlOutput) { return listHtmlOutput; }
    let sentences = textContent.match(/[^.!?]+[.!?]\s*/g) || [textContent];
    let summaryText = sentences.slice(0, targetSentences).join(" ").trim();
    if (summaryText.length > maxChars) {
        summaryText = summaryText.substring(0, maxChars).trim();
        const lastSpace = summaryText.lastIndexOf(' ');
        if (lastSpace > 0) { summaryText = summaryText.substring(0, lastSpace); }
        summaryText += "...";
    } else if (sentences.length > targetSentences && summaryText.length > 0 && !summaryText.endsWith("...")) {
        summaryText += "...";
    }
    let textSummaryHtml = summaryText ? `<p class="text-xs text-gray-400 mt-1 feed-item-summary-text">${summaryText}</p>` : "";
    return `${textSummaryHtml}${listHtmlOutput}`;
}

function getTargetTotalItemCountToDisplay() {
    if (window.innerWidth < 768) return 10;
    if (window.innerWidth < 1280) return 15;
    return 18;
}

function displayNewsItemsOnPage() {
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    if (!feedContainer) { console.error("Feed container element not found in HTML."); return; }
    feedContainer.innerHTML = '';

    const targetTotalItemCount = getTargetTotalItemCountToDisplay();
    let relevantItems = filterRelevantNewsItems(allFetchedItemsGlobal); // Filter first

    // *** DEBUG LINE ADDED ***
    console.log(`[DISPLAY] After filtering, ${relevantItems.length} relevant items. Target display count: ${targetTotalItemCount}`);

    let itemsToActuallyDisplay = [];
    let newGuidsForThisDisplayBatch = new Set();

    for (const item of relevantItems) {
        if (itemsToActuallyDisplay.length >= targetTotalItemCount) break;
        if (!displayedItemsGuidsGlobal.has(item.guid)) {
            itemsToActuallyDisplay.push(item);
            newGuidsForThisDisplayBatch.add(item.guid);
        }
    }
    if (itemsToActuallyDisplay.length < targetTotalItemCount) {
        for (const item of relevantItems) {
            if (itemsToActuallyDisplay.length >= targetTotalItemCount) break;
            if (!newGuidsForThisDisplayBatch.has(item.guid)) {
                itemsToActuallyDisplay.push(item);
                newGuidsForThisDisplayBatch.add(item.guid);
            }
        }
    }

    // *** DEBUG LINE ADDED ***
    console.log(`[DISPLAY] Items selected for actual display on page: ${itemsToActuallyDisplay.length}. First item:`, JSON.stringify(itemsToActuallyDisplay[0], null, 2));

    if (itemsToActuallyDisplay.length === 0) {
        // *** DEBUG LINE ADDED ***
        console.log("[DISPLAY] No items to display. Showing 'No relevant articles' message.");
        if (allFetchedItemsGlobal.length > 0 && relevantItems.length === 0) { // Data fetched, but all filtered out
             feedContainer.innerHTML = `<p class="text-sm text-gray-500 italic p-4 text-center">
                                     No articles matched your AI/Cybersecurity keyword filters. 
                                     Consider adjusting keywords or checking if feed content is as expected.
                                   </p>`;
        } else if (allFetchedItemsGlobal.length === 0) { // No data from server at all
             feedContainer.innerHTML = `<p class="text-sm text-gray-500 italic p-4 text-center">
                                     Could not load any articles from the news sources.
                                   </p>`;
        } else { // Relevant items exist, but display logic (e.g. rotation) resulted in none. Less likely with current logic.
             feedContainer.innerHTML = `<p class="text-sm text-gray-500 italic p-4 text-center">
                                     No relevant AI/Cybersecurity articles to display at this moment.
                                   </p>`;
        }
        return;
    }

    itemsToActuallyDisplay.forEach((item, index) => {
        const newsElement = document.createElement('div');
        newsElement.className = 'news-snippet p-3 mb-3 bg-gray-800 rounded-lg shadow-lg opacity-0 transition-opacity duration-700 ease-out flex items-start space-x-3 hover:bg-gray-700/70';
        const articleGuidEncoded = encodeURIComponent(item.guid);
        const summaryContentHtml = generateSimpleSummaryForDisplay(item.descriptionHtml);
        let imageHtmlSnippet = '';
        if (item.imageUrl) {
            imageHtmlSnippet = `
                <div class="flex-shrink-0 w-20 h-20 md:w-24 md:h-24">
                    <img src="${item.imageUrl}" alt="Image for ${item.title ? item.title.substring(0,30) : 'article'}..."
                         class="w-full h-full object-cover rounded-md shadow-md"
                         onerror="this.style.display='none'; console.warn('Image failed to load: ${item.imageUrl}')">
                </div>
            `;
        } else {
            imageHtmlSnippet = `<div class="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 bg-gray-700 rounded-md flex items-center justify-center text-gray-500 text-xs p-1">No Image</div>`;
        }
        newsElement.innerHTML = `
            ${imageHtmlSnippet}
            <div class="flex-grow overflow-hidden">
                <h4 class="text-sm font-semibold text-gray-100 hover:text-cyan-400 transition-colors duration-150 truncate" title="${item.title || 'Untitled'}">
                    <a href="blogs.html?article=${articleGuidEncoded}" class="focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded">
                        ${item.title || 'Untitled Article'}
                    </a>
                </h4>
                <p class="text-xs text-gray-400 mb-1.5">${item.sourceName || 'Unknown Source'} - ${new Date(item.pubDateStr).toLocaleDateString()}</p>
                <div class="summary-container text-xs text-gray-300 max-h-24 overflow-hidden relative">
                    ${summaryContentHtml}
                    ${summaryContentHtml.length > 150 ? '<div class="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-gray-800 to-transparent"></div>' : ''}
                </div>
            </div>
        `;
        feedContainer.appendChild(newsElement);
        setTimeout(() => newsElement.classList.remove('opacity-0'), 60 * index + 50);
    });

    displayedItemsGuidsGlobal = newGuidsForThisDisplayBatch;
    console.log(`Displayed ${itemsToActuallyDisplay.length} news items on the page.`);
}

async function refreshAllNewsFeeds() {
    console.log("Refreshing all news feeds using the server API...");
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    if (feedContainer && (!feedContainer.firstChild || feedContainer.firstChild.nodeName === 'P')) {
        feedContainer.innerHTML = '<p class="text-sm text-gray-500 italic p-4 text-center">Fetching latest intel from server...</p>';
    }

    const newItemsFromServer = await fetchNewsFromServerAPI(); // This now has alerts and detailed logging

    // *** MODIFIED LOGIC for handling fetch results ***
    if (newItemsFromServer) { // newItemsFromServer will be an array, even if empty, unless fetch completely failed (then it's [] from catch)
        allFetchedItemsGlobal = newItemsFromServer;
        console.log(`[REFRESH] Updated allFetchedItemsGlobal with ${allFetchedItemsGlobal.length} items from server.`);
    } else {
        // This case should ideally not be hit if fetchNewsFromServerAPI's catch block returns []
        console.error("[REFRESH] fetchNewsFromServerAPI returned undefined or null. This is unexpected. Defaulting to empty array.");
        allFetchedItemsGlobal = [];
    }

    try {
        sessionStorage.setItem('allFetchedNewsItems', JSON.stringify(allFetchedItemsGlobal));
        console.log(`Stored ${allFetchedItemsGlobal.length} news items in sessionStorage.`);
    } catch (e) {
        console.error("Error saving news items to sessionStorage:", e);
        if (feedContainer && !feedContainer.querySelector('.session-storage-error')) {
            const errorDiv = document.createElement('p');
            errorDiv.className = 'text-xs text-red-500 p-2 text-center session-storage-error';
            errorDiv.textContent = 'Warning: Could not save news to session storage. Offline viewing might be affected.';
            feedContainer.prepend(errorDiv);
        }
    }
    
    displayNewsItemsOnPage(); // Display based on the (potentially updated) allFetchedItemsGlobal
    startCountdownTimer();
}

function startCountdownTimer() {
    const countdownElement = document.getElementById(COUNTDOWN_TIMER_ID);
    if (!countdownElement) { console.warn("Countdown timer element not found in HTML."); return; }
    if (countdownIntervalIdGlobal) { clearInterval(countdownIntervalIdGlobal); }
    let timeLeftInMs = REFRESH_INTERVAL_MS;
    const updateTimerDisplay = () => {
        countdownElement.innerHTML = `Next update in: <span class="font-semibold font-orbitron text-cyan-400">${formatTimeForDisplay(timeLeftInMs)}</span>`;
        timeLeftInMs -= 1000;
        if (timeLeftInMs < 0) { clearInterval(countdownIntervalIdGlobal); }
    };
    updateTimerDisplay();
    countdownIntervalIdGlobal = setInterval(updateTimerDisplay, 1000);
}

function formatTimeForDisplay(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function initializeNewsFeedSystem() {
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    const countdownElement = document.getElementById(COUNTDOWN_TIMER_ID);
    if (!feedContainer) { console.error(`Critical Error: News feed container #${FEED_CONTAINER_ID} not found.`); return; }
    if (!countdownElement) { console.warn(`Warning: Countdown timer element #${COUNTDOWN_TIMER_ID} not found.`); }

    try {
        const storedItemsJson = sessionStorage.getItem('allFetchedNewsItems');
        if (storedItemsJson) {
            allFetchedItemsGlobal = JSON.parse(storedItemsJson);
            console.log(`Loaded ${allFetchedItemsGlobal.length} items from sessionStorage on initial page load.`);
            if (allFetchedItemsGlobal.length > 0) {
                allFetchedItemsGlobal.sort((a, b) => new Date(b.pubDateStr) - new Date(a.pubDateStr));
                displayNewsItemsOnPage();
            }
        }
    } catch (e) {
        console.error("Error loading or parsing news items from sessionStorage on init:", e);
        sessionStorage.removeItem('allFetchedNewsItems');
    }
    refreshAllNewsFeeds();
    setInterval(refreshAllNewsFeeds, REFRESH_INTERVAL_MS);
    console.log(`News feed system initialized (server-backed). Auto-refresh interval: ${REFRESH_INTERVAL_MINUTES} minutes.`);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("news-feed.js (server-backed v2 with DEBUG) loaded. Initializing news feed system...");
    initializeNewsFeedSystem();
});
