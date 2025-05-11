// --- Constants ---
const RSS_FEEDS = [
    'https://feeds.feedburner.com/TheHackersNews',
    'https://www.wired.com/feed/category/security/latest/rss',
    'https://krebsonsecurity.com/feed/',
    'https://threatpost.com/feed/',
    'https://darkreading.com/rss_simple.asp' // Another security news source
];

const CORS_PROXY_URL = "https://api.allorigins.win/raw?url="; // Public CORS proxy
const FEED_CONTAINER_ID = 'intel-feed-list'; // ID in dashboard.html
const COUNTDOWN_TIMER_ID = 'intel-feed-countdown'; // ID in dashboard.html
const REFRESH_INTERVAL_MINUTES = 15; // Refresh frequency
const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_MINUTES * 60 * 1000;

// --- State Variables ---
let allFetchedItems = []; // Holds all unique items fetched in the current session (after de-duplication)
let displayedItemsGuids = new Set(); // Tracks GUIDs currently displayed to manage rotation
let countdownIntervalId = null;

// --- Keyword Filtering ---
const AI_KEYWORDS = [
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
    'generative ai', 'llm', 'large language model', 'deepfake', 'neural network',
    'computer vision', 'nlp', 'natural language processing', 'automation', 'automated'
];
const SECURITY_KEYWORDS = [
    'cybersecurity', 'security', 'phishing', 'malware', 'hacking', 'hacker', 'cyberattack',
    'vulnerability', 'ransomware', 'threat', 'breach', 'exploit', 'defense', 'attack',
    'secure', 'data protection', 'zero-day', 'incident response', 'infosec', 'endpoint',
    'network security', 'iam', 'identity', 'encryption', 'firewall', 'intrusion', 'pentest',
    'red team', 'spoofing', 'credential', 'backdoor', 'trojan', 'spyware'
];
const SPECIFIC_AI_SEC_KEYWORDS = [
    'ai security', 'ai cybersecurity', 'ai defense', 'ai attack', 'ai threat',
    'adversarial ai', 'adversarial machine learning', 'deepfake scam', 'ai phishing',
    'ml security', 'ai vulnerability', 'ai red team', 'ai soc', 'generative ai security',
    'llm security', 'ai incident response', 'weaponized ai', 'ai cybercrime', 'ai malware',
    'ai-powered attack', 'ai-driven defense'
];
// --- End Keyword Filtering ---

/**
 * Fetches and parses a single RSS feed via CORS proxy.
 * Extracts relevant fields including potential image URLs and raw description HTML.
 */
async function fetchSingleFeed(feedUrl) {
    const urlToFetch = `${CORS_PROXY_URL}${encodeURIComponent(feedUrl)}`;
    console.log(`[FETCH START] Attempting: ${feedUrl}`);
    try {
        const response = await fetch(urlToFetch, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
        if (!response.ok) {
            let errorText = `HTTP error for ${new URL(feedUrl).hostname}! Status: ${response.status}`;
            try { const proxyError = await response.text(); errorText += ` - Proxy: ${proxyError.substring(0, 100)}`; } catch (e) { /*ignore*/ }
            console.error(`[FETCH HTTP ERROR] ${feedUrl}: ${errorText}`);
            throw new Error(errorText);
        }
        const data = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "text/xml");
        const parseErrorNode = xmlDoc.querySelector("parsererror");
        if (parseErrorNode) {
            console.error(`[FETCH XML PARSE ERROR] ${feedUrl}:`, parseErrorNode.textContent);
            return [];
        }

        const items = [];
        const sourceName = xmlDoc.querySelector("channel > title")?.textContent.trim() || xmlDoc.querySelector("feed > title")?.textContent.trim() || new URL(feedUrl).hostname;
        console.log(`[FETCH PROCESSING] Feed: ${sourceName} from ${feedUrl}`);

        xmlDoc.querySelectorAll("item, entry").forEach(itemNode => {
            const title = itemNode.querySelector("title")?.textContent.trim() || 'No Title';
            let link = itemNode.querySelector("link[href]")?.getAttribute('href')?.trim() || itemNode.querySelector("link")?.textContent.trim() || '';
             if (!link && itemNode.querySelector("link:not([href])")) { // Check for link tag without href but with text content
                link = itemNode.querySelector("link:not([href])")?.textContent.trim();
            }

            const pubDateStr = itemNode.querySelector("pubDate")?.textContent || itemNode.querySelector("published")?.textContent || itemNode.querySelector("updated")?.textContent || new Date().toISOString();
            const descriptionHtml = itemNode.querySelector("description")?.innerHTML || itemNode.querySelector("summary")?.innerHTML || itemNode.querySelector("content")?.innerHTML || itemNode.querySelector("content\\:encoded")?.innerHTML || 'No summary available.';
            const author = itemNode.querySelector("author > name")?.textContent.trim() || itemNode.querySelector("dc\\:creator")?.textContent.trim() || 'Unknown Author';

            let imageUrl = null;
            const enclosure = itemNode.querySelector("enclosure[type^='image']");
            if (enclosure) {
                imageUrl = enclosure.getAttribute('url');
            } else {
                const mediaContent = itemNode.querySelector("media\\:content[medium='image'], media\\:thumbnail");
                if (mediaContent) {
                    imageUrl = mediaContent.getAttribute('url');
                } else {
                    const tempDescDiv = document.createElement("div");
                    tempDescDiv.innerHTML = descriptionHtml;
                    const imgTag = tempDescDiv.querySelector("img");
                    if (imgTag && imgTag.src) { imageUrl = imgTag.src; }
                }
            }

            // Robust GUID: Prefer dedicated guid tag, then link, then construct one.
            let guid = itemNode.querySelector("guid")?.textContent.trim();
            if (!guid && link) {
                guid = link;
            } else if (!guid) {
                guid = title + pubDateStr + sourceName; // Fallback GUID
            }

            items.push({ title, link, pubDateStr, descriptionHtml, author, imageUrl, sourceName, guid });
        });
        console.log(`[FETCH SUCCESS] Found ${items.length} items in ${sourceName} (${feedUrl})`);
        return items;
    } catch (error) {
        console.error(`[FETCH OVERALL ERROR] Feed ${feedUrl}:`, error.message);
        return [];
    }
}

/**
 * Filters items for relevance to AI *and* Cybersecurity.
 */
function filterRelevantItems(items) {
    console.log(`Filtering ${items.length} raw items for AI+Security relevance...`);
    const relevantItems = items.filter(item => {
        const titleLower = item.title.toLowerCase();
        // For description, generate plain text first for keyword search
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = item.descriptionHtml;
        const descLower = (tempDiv.textContent || tempDiv.innerText || "").toLowerCase();
        const contentToCheck = titleLower + ' ' + descLower;

        if (SPECIFIC_AI_SEC_KEYWORDS.some(keyword => contentToCheck.includes(keyword))) return true;
        const hasAiKeyword = AI_KEYWORDS.some(keyword => contentToCheck.includes(keyword));
        if (hasAiKeyword) {
            return SECURITY_KEYWORDS.some(keyword => contentToCheck.includes(keyword));
        }
        return false;
    });
    console.log(`Found ${relevantItems.length} potentially relevant items after filtering.`);
    return relevantItems;
}

/**
 * Generates a simple text summary from HTML content, aiming for a sentence count.
 * Attempts to format basic list-like structures.
 */
function generateSimpleSummary(htmlContent, targetSentences = 10, maxChars = 400) {
    if (!htmlContent || htmlContent === 'No summary available.') {
        return '<p class="text-xs text-gray-500 mt-1 italic">No detailed summary available for preview.</p>';
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent; // Parse the HTML

    // Attempt to find and format lists first (very basic)
    let listHtml = "";
    const listElements = [];
    tempDiv.querySelectorAll("ul > li, ol > li").forEach(li => {
        if (listElements.length < 5 && li.textContent.trim().length > 5) { // Max 5 list items, with some content
             listElements.push(`<li>${li.textContent.trim().substring(0, 150)}</li>`);
        }
    });
    if (listElements.length > 1) { // Only add if more than one item found
        listHtml = `<ul>${listElements.join("")}</ul>`;
    }


    let textContent = (tempDiv.textContent || tempDiv.innerText || "").trim().replace(/\s+/g, ' '); // Normalize spaces

    if (!textContent) {
        return '<p class="text-xs text-gray-500 mt-1 italic">No text summary available.</p>';
    }

    let sentences = textContent.match(/[^.!?]+[.!?]\s*/g) || [textContent]; // Basic sentence split
    let summary = sentences.slice(0, targetSentences).join(" ").trim();

    if (summary.length > maxChars) {
        summary = summary.substring(0, maxChars).trim();
        const lastSpace = summary.lastIndexOf(' ');
        if (lastSpace > 0) summary = summary.substring(0, lastSpace);
        summary += "...";
    } else if (sentences.length > targetSentences && summary.length > 0 && !summary.endsWith("...")) {
        summary += "...";
    }

    let summaryPrefix = summary ? `<p class="text-xs text-gray-400 mt-1 feed-item-summary-text">${summary}</p>` : "";
    if (!summary && !listHtml) { // If both are empty after processing
         return '<p class="text-xs text-gray-500 mt-1 italic">Summary not available.</p>';
    }
    return `${summaryPrefix}${listHtml}`;
}


/**
 * Determines the target number of items to RENDER based on screen width.
 */
function getTargetTotalItemCount() {
    if (window.innerWidth < 768) return 12; // Small
    if (window.innerWidth < 1280) return 16; // Medium
    return 20; // Large
}

/**
 * Displays the filtered and sorted news items.
 */
function displayNewsItems() {
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    if (!feedContainer) { console.error("Feed container not found."); return; }
    feedContainer.innerHTML = ''; // Clear previous

    const targetTotalItemCount = getTargetTotalItemCount();
    let potentialItems = filterRelevantItems(allFetchedItems)
        .sort((a, b) => new Date(b.pubDateStr) - new Date(a.pubDateStr));

    let itemsToDisplay = [];
    let newGuidsForThisBatch = new Set();

    // Prioritize items not recently displayed
    for (const item of potentialItems) {
        if (itemsToDisplay.length >= targetTotalItemCount) break;
        if (!displayedItemsGuids.has(item.guid)) {
            itemsToDisplay.push(item);
            newGuidsForThisBatch.add(item.guid);
        }
    }

    // Fill with older (but still relevant) items if needed
    if (itemsToDisplay.length < targetTotalItemCount) {
        for (const item of potentialItems) {
            if (itemsToDisplay.length >= targetTotalItemCount) break;
            if (!newGuidsForThisBatch.has(item.guid)) { // Check if not already added in the first pass
                itemsToDisplay.push(item);
                newGuidsForThisBatch.add(item.guid);
            }
        }
    }

    if (itemsToDisplay.length === 0) {
        feedContainer.innerHTML = '<p class="text-sm text-medium-gray italic p-4 text-center">No relevant AI/Cybersecurity articles found in feeds currently. More sources or broader keywords might be needed.</p>';
        return;
    }

    itemsToDisplay.forEach(item => {
        const newsElement = document.createElement('div');
        // Tailwind-like classes for styling. Adjust as needed.
        newsElement.className = 'news-snippet p-3 mb-3 bg-gray-800 rounded-lg shadow-md opacity-0 transition-opacity duration-500 flex items-start space-x-3';
        const articleGuid = encodeURIComponent(item.guid);
        const summaryContent = generateSimpleSummary(item.descriptionHtml, 10); // Target 10 sentences for summary

        let imageHTML = '';
        if (item.imageUrl) {
            imageHTML = `
                <div class="flex-shrink-0 w-24 h-20"> {/* Fixed size container for image */}
                    <img src="${item.imageUrl}" alt=""
                         class="w-full h-full object-cover rounded-md"
                         onerror="this.style.display='none'; console.warn('Image failed to load: ${item.imageUrl}')">
                </div>
            `;
        } else {
            // Placeholder for items without images to maintain layout consistency if desired
            imageHTML = `<div class="flex-shrink-0 w-24 h-20 bg-gray-700 rounded-md flex items-center justify-center text-gray-500 text-xs">No Image</div>`;
        }

        newsElement.innerHTML = `
            ${imageHTML}
            <div class="flex-grow overflow-hidden">
                <h4 class="text-sm font-semibold text-light-gray hover:text-cyber-cyan transition-colors truncate" title="${item.title}">
                    <a href="blogs.html?article=${articleGuid}">
                        ${item.title}
                    </a>
                </h4>
                <p class="text-xs text-medium-gray mb-1">${item.sourceName} - ${new Date(item.pubDateStr).toLocaleDateString()}</p>
                <div class="summary-container text-xs text-gray-400">
                    ${summaryContent}
                </div>
            </div>
        `;
        feedContainer.appendChild(newsElement);
        setTimeout(() => newsElement.classList.remove('opacity-0'), 50 * itemsToDisplay.indexOf(item) + 50); // Staggered fade-in
    });

    displayedItemsGuids = newGuidsForThisBatch;
    console.log(`Displayed ${itemsToDisplay.length} news items.`);
}

/**
 * Fetches all feeds, filters, stores, updates display, and restarts countdown.
 */
async function refreshAllFeeds() {
    console.log("Refreshing all news feeds...");
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    if (feedContainer && (!feedContainer.firstChild || feedContainer.firstChild.nodeName === 'P')) { // Only show loading if empty or showing a message
        feedContainer.innerHTML = '<p class="text-sm text-medium-gray italic p-4 text-center">Fetching latest intel...</p>';
    }

    const feedPromises = RSS_FEEDS.map(feedUrl => fetchSingleFeed(feedUrl));
    const results = await Promise.allSettled(feedPromises);

    let newlyFetchedRawItems = [];
    results.forEach((result, index) => {
        const feedUrl = RSS_FEEDS[index];
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            console.log(`[REFRESH] Successfully fetched from: ${feedUrl}. Items: ${result.value.length}`);
            newlyFetchedRawItems.push(...result.value);
        } else if (result.status === 'rejected') {
            console.error(`[REFRESH] Feed failed: ${feedUrl}`, result.reason?.message || result.reason);
            // Optionally update UI with a persistent error for this specific feed if desired
        }
    });

    console.log(`[REFRESH] Total items from all feeds (pre-deduplication): ${newlyFetchedRawItems.length}`);

    // De-duplicate based on GUID
    const uniqueItemsMap = new Map();
    // Add existing items from `allFetchedItems` first to preserve their order if they are re-fetched
    allFetchedItems.forEach(item => uniqueItemsMap.set(item.guid, item));
    // Then add/update with newly fetched items
    newlyFetchedRawItems.forEach(item => uniqueItemsMap.set(item.guid, item));

    allFetchedItems = Array.from(uniqueItemsMap.values());
    console.log(`[REFRESH] Total unique items after merging and de-duplication: ${allFetchedItems.length}`);

    // Sort all items by date again after merging
    allFetchedItems.sort((a, b) => new Date(b.pubDateStr) - new Date(a.pubDateStr));


    try {
        sessionStorage.setItem('allFetchedNewsItems', JSON.stringify(allFetchedItems));
        console.log(`Stored ${allFetchedItems.length} unique news items in sessionStorage.`);
    } catch (e) {
        console.error("Error saving news items to sessionStorage:", e);
        if (feedContainer) {
            const errorDiv = document.createElement('p');
            errorDiv.className = 'text-xs text-red-400 p-2 text-center';
            errorDiv.textContent = 'Could not save news to session storage (quota may be full). Some features might be affected.';
            feedContainer.prepend(errorDiv);
        }
    }

    if (newlyFetchedRawItems.length === 0 && results.every(r => r.status === 'rejected')) {
         if (feedContainer) feedContainer.innerHTML = `<div class="news-snippet text-red-400 italic p-4"><p>Error loading live feeds. All sources might be unavailable or check console for errors.</p></div>`;
    } else {
        displayNewsItems();
    }
    startCountdown();
}

/**
 * Starts/restarts the countdown timer for the next refresh.
 */
function startCountdown() {
    const countdownElement = document.getElementById(COUNTDOWN_TIMER_ID);
    if (!countdownElement) return;
    if (countdownIntervalId) clearInterval(countdownIntervalId);
    let timeLeft = REFRESH_INTERVAL_MS;

    const updateTimer = () => {
        countdownElement.innerHTML = `Next update in: <span class="font-semibold">${formatTime(timeLeft)}</span>`;
        timeLeft -= 1000;
        if (timeLeft < 0) { // Should be cleared by main interval, but as a fallback
            clearInterval(countdownIntervalId);
            // Optionally trigger refresh if interval somehow fails, though `setInterval(refreshAllFeeds)` is primary
        }
    };
    updateTimer(); // Initial display
    countdownIntervalId = setInterval(updateTimer, 1000);
}

/**
 * Formats milliseconds into MM:SS string.
 */
function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Initializes the news feed system.
 */
function initNewsFeed() {
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    const countdownElement = document.getElementById(COUNTDOWN_TIMER_ID);

    if (feedContainer && countdownElement) {
        // Try to load from sessionStorage first for faster perceived load on refresh/revisit
        try {
            const storedItems = sessionStorage.getItem('allFetchedNewsItems');
            if (storedItems) {
                allFetchedItems = JSON.parse(storedItems);
                console.log(`Loaded ${allFetchedItems.length} items from sessionStorage.`);
                if (allFetchedItems.length > 0) {
                    displayNewsItems(); // Display immediately from cache
                }
            }
        } catch (e) {
            console.error("Error loading news items from sessionStorage:", e);
            sessionStorage.removeItem('allFetchedNewsItems'); // Clear corrupted data
        }

        refreshAllFeeds(); // Initial fetch (will overwrite/update session storage)
        setInterval(refreshAllFeeds, REFRESH_INTERVAL_MS);
        console.log("News feed system initialized. Refresh interval: " + REFRESH_INTERVAL_MINUTES + " minutes.");
    } else {
        if (!feedContainer) console.error(`News feed container #${FEED_CONTAINER_ID} not found.`);
        if (!countdownElement) console.error(`Countdown timer element #${COUNTDOWN_TIMER_ID} not found.`);
        alert("Critical page elements for the news feed are missing. Please check the HTML structure.");
    }
}

// --- Script Load Confirmation & Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("news-feed.js loaded. Initializing news feed system...");
    initNewsFeed();
});
