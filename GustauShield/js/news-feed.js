
const RSS_FEEDS = [
    https://feeds.feedburner.com/TheHackersNews
    // 'https://feeds.feedburner.com/TheHackersNews',
    // 'https://grahamcluley.com/feed/',
    // 'https://krebsonsecurity.com/feed/',
    // 'https://securelist.com/feed/',
    // 'https://news.sophos.com/en-us/category/security-operations/feed/',
    // 'https://news.sophos.com/en-us/category/threat-research/feed/',
    // 'https://www.troyhunt.com/rss/', 
    // 'https://feeds.feedburner.com/eset/blog' 
];

const CORS_PROXY_URL = "https://api.allorigins.win/raw?url="; // Public CORS proxy
const FEED_CONTAINER_ID = 'intel-feed-list'; // ID in dashboard.html
const COUNTDOWN_TIMER_ID = 'intel-feed-countdown'; // ID in dashboard.html
const REFRESH_INTERVAL_MINUTES = 5; // Refresh frequency
const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_MINUTES * 60 * 1000;

// --- State Variables ---
let allFetchedItems = [];
let displayedItemsGuids = new Set(); // Tracks GUIDs to avoid immediate repetition
let countdownIntervalId = null;

// --- ** IMPROVED KEYWORD FILTERING ** ---
// Customize these lists to fine-tune relevance for AI + Cybersecurity
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
// Keywords that strongly imply the intersection
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
 * Extracts relevant fields including potential image URLs.
 */
async function fetchSingleFeed(feedUrl) {
    const urlToFetch = `${CORS_PROXY_URL}${encodeURIComponent(feedUrl)}`;
    try {
        const response = await fetch(urlToFetch);
        if (!response.ok) {
            let errorText = `HTTP error for ${new URL(feedUrl).hostname}! Status: ${response.status}`;
            try { const proxyError = await response.text(); errorText += ` - ${proxyError.substring(0, 100)}`;} catch (e) {/*ignore*/}
            throw new Error(errorText);
        }
        const data = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "text/xml");
        const parseErrorNode = xmlDoc.querySelector("parsererror");
        if (parseErrorNode) {
            console.error(`XML Parsing Error for ${feedUrl}:`, parseErrorNode.textContent);
            return []; // Return empty on parsing error
        }

        const items = [];
        const sourceName = xmlDoc.querySelector("channel > title")?.textContent.trim() || xmlDoc.querySelector("feed > title")?.textContent.trim() || new URL(feedUrl).hostname;

        xmlDoc.querySelectorAll("item, entry").forEach(itemNode => {
            const title = itemNode.querySelector("title")?.textContent.trim() || 'No Title';
            let link = itemNode.querySelector("guid")?.textContent.trim() || itemNode.querySelector("link")?.textContent.trim() || '';
            if (!link && itemNode.querySelector("link")?.hasAttribute('href')) {
                link = itemNode.querySelector("link")?.getAttribute('href').trim();
            }
            const pubDateStr = itemNode.querySelector("pubDate")?.textContent || itemNode.querySelector("published")?.textContent || itemNode.querySelector("updated")?.textContent || new Date().toISOString();


            let description = itemNode.querySelector("description")?.innerHTML || itemNode.querySelector("summary")?.innerHTML || itemNode.querySelector("content")?.innerHTML || 'No summary.'; 
            
            // Keep potential HTML for image extraction later
            const tempDiv = document.createElement("div"); // Use temp element to parse and get text content safely
            tempDiv.innerHTML = description;
            const descriptionText = (tempDiv.textContent || tempDiv.innerText || "").trim();

            const author = itemNode.querySelector("author > name")?.textContent.trim() || itemNode.querySelector("dc\\:creator")?.textContent.trim() || 'Unknown Author';

            let imageUrl = null;
            const enclosure = itemNode.querySelector("enclosure[type^='image']"); // More generic type check
            if (enclosure) { imageUrl = enclosure.getAttribute('url');
            } else {
                const mediaContent = itemNode.querySelector("media\\:content[medium='image'], media\\:thumbnail"); // Check common media tags
                if (mediaContent) { imageUrl = mediaContent.getAttribute('url');
                } else {
                    // Try finding img tag within the description HTML (before stripping)
                    const imgTag = tempDiv.querySelector("img");
                    if (imgTag && imgTag.src) { imageUrl = imgTag.src; }
                }
            }

            // Use link as GUID if available, otherwise combine title and date
            const guid = link || title + pubDateStr;

            items.push({ title, link, pubDateStr, description: descriptionText, author, imageUrl, sourceName, guid });
        });
        return items;
    } catch (error) {
        console.error(`Error processing feed ${feedUrl}:`, error);
        return []; // Return empty array on fetch/processing error
    }
}

/**
 * IMPROVED: Filters items more strictly for relevance to AI *and* Cybersecurity.
 */
function filterRelevantItems(items) {
    console.log(`Filtering ${items.length} raw items for AI+Security relevance...`);
    const relevantItems = items.filter(item => {
        const titleLower = item.title.toLowerCase();
        const descLower = item.description.toLowerCase();
        const contentToCheck = titleLower + ' ' + descLower;

        // Check 1: Highly specific AI+Security terms
        if (SPECIFIC_AI_SEC_KEYWORDS.some(keyword => contentToCheck.includes(keyword))) {
            return true;
        }

        // Check 2: Combination of AI term AND Security term
        const hasAiKeyword = AI_KEYWORDS.some(keyword => contentToCheck.includes(keyword));
        if (hasAiKeyword) {
            const hasSecKeyword = SECURITY_KEYWORDS.some(keyword => contentToCheck.includes(keyword));
            if (hasSecKeyword) {
                return true;
            }
        }
        return false;
    });
    console.log(`Found ${relevantItems.length} potentially relevant items after filtering.`);
    return relevantItems;
}


/**
 * Determines the target number of items to RENDER in the scroll list based on screen width.
 */
function getTargetTotalItemCount() {
    if (window.innerWidth < 768) return 12; // Small
    if (window.innerWidth < 1280) return 16; // Medium
    return 20; // Large
}

/**
 * Displays the filtered and sorted news items in the feed container.
 */
function displayNewsItems() {
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    if (!feedContainer) { console.error("Feed container not found."); return; }
    feedContainer.innerHTML = ''; // Clear previous items or loading message

    const targetTotalItemCount = getTargetTotalItemCount();

    // Get filtered items, sort by date
    let potentialItems = filterRelevantItems(allFetchedItems)
        .sort((a, b) => new Date(b.pubDateStr) - new Date(a.pubDateStr));

    let itemsToDisplay = [];
    let newGuidsForThisBatch = new Set(); // Track GUIDs added in *this specific update*

    // Prioritize adding items not recently displayed (not in displayedItemsGuids)
    for (const item of potentialItems) {
        if (itemsToDisplay.length >= targetTotalItemCount) break;
        if (!displayedItemsGuids.has(item.guid)) {
            itemsToDisplay.push(item);
            newGuidsForThisBatch.add(item.guid);
        }
    }

    // If we still need more items to reach the target count, add older items (from potentialItems)
    // that weren't already added in this batch, even if they were seen in much older refreshes.
    // This keeps the list full if possible.
    if (itemsToDisplay.length < targetTotalItemCount) {
        let fallbackIndex = 0;
        while (itemsToDisplay.length < targetTotalItemCount && fallbackIndex < potentialItems.length) {
            const item = potentialItems[fallbackIndex];
            // Only add if it wasn't already picked in the first loop (check newGuidsForThisBatch)
            if (!newGuidsForThisBatch.has(item.guid)) {
                 itemsToDisplay.push(item);
                 newGuidsForThisBatch.add(item.guid); // Also track these
            }
            fallbackIndex++;
        }
    }

    // Display the selected items
    if (itemsToDisplay.length === 0) {
        feedContainer.innerHTML = '<p class="text-sm text-medium-gray italic p-4 text-center">No relevant AI/Cybersecurity articles found in feeds currently.</p>';
        return;
    }

    itemsToDisplay.forEach(item => {
        const newsElement = document.createElement('div');
        newsElement.className = 'news-snippet py-2 opacity-0 transition-opacity duration-500';
        // Pass only the unique guid needed to look up the item on the blog page
        const articleGuid = encodeURIComponent(item.guid);

        newsElement.innerHTML = `
            <h4 class="text-sm font-semibold text-light-gray hover:text-cyber-cyan transition-colors">
                <a href="blogs.html?article=${articleGuid}" title="${item.title}">
                    ${item.title.substring(0, 80)}${item.title.length > 80 ? '...' : ''}
                </a>
            </h4>
            <p class="text-xs text-medium-gray">${item.sourceName} - ${new Date(item.pubDateStr).toLocaleDateString()}</p>
        `;
        feedContainer.appendChild(newsElement);
        setTimeout(() => newsElement.classList.remove('opacity-0'), 50); // Fade-in
    });

    // Update the set of displayed GUIDs for the next refresh cycle's filtering
    displayedItemsGuids = newGuidsForThisBatch; // Only prevent repeats from the *immediately preceding* batch

    console.log(`Displayed ${itemsToDisplay.length} news items.`);
}

/**
 * Fetches all feeds, filters, stores in sessionStorage, updates display, and restarts countdown.
 */
async function refreshAllFeeds() {
    console.log("Refreshing all news feeds...");
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    if (feedContainer && !feedContainer.querySelector('.text-red-400')) {
        feedContainer.innerHTML = '<p class="text-sm text-medium-gray italic p-4 text-center">Fetching latest intel...</p>';
    }

    const feedPromises = RSS_FEEDS.map(feedUrl => fetchSingleFeed(feedUrl));
    const results = await Promise.allSettled(feedPromises);

    let newFetchedItems = [];
    results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            newFetchedItems.push(...result.value);
        } else if (result.status === 'rejected') {
            console.error("A feed failed to load:", result.reason);
            // Display persistent error only if container is empty or showing loading
            if(feedContainer && (feedContainer.children.length === 0 || feedContainer.querySelector('p.italic'))) {
                 feedContainer.innerHTML = `<div class="news-snippet text-red-400 italic p-4"><p>Error loading live feed. Some sources may be unavailable.</p><p class="text-xs mt-1">${result.reason.message || ''}</p></div>`;
            }
        }
    });

    const uniqueItemsMap = new Map();
    newFetchedItems.forEach(item => { if (!uniqueItemsMap.has(item.guid)) { uniqueItemsMap.set(item.guid, item); } });
    allFetchedItems = Array.from(uniqueItemsMap.values());

    // Store the complete, de-duplicated list from this fetch in sessionStorage
    try {
        sessionStorage.setItem('allFetchedNewsItems', JSON.stringify(allFetchedItems));
        console.log(`Stored ${allFetchedItems.length} unique news items in sessionStorage.`);
    } catch (e) {
        console.error("Error saving news items to sessionStorage:", e);
        // Handle potential storage errors (e.g., quota exceeded)
    }

    displayNewsItems(); // Update the list displayed on dashboard
    startCountdown(); // Restart the countdown timer
}

// startCountdown and formatTime functions (Keep as before)
function startCountdown() {
    const countdownElement = document.getElementById(COUNTDOWN_TIMER_ID);
    if (!countdownElement) return;
    if (countdownIntervalId) clearInterval(countdownIntervalId);
    let timeLeft = REFRESH_INTERVAL_MS;
    countdownElement.innerHTML = `Next update in: <span class="font-orbitron">${formatTime(timeLeft)}</span>`;
    countdownIntervalId = setInterval(() => {
        timeLeft -= 1000;
        if (timeLeft < 0) { timeLeft = 0; /* Timer visually stops at 0 */ }
        countdownElement.innerHTML = `Next update in: <span class="font-orbitron">${formatTime(timeLeft)}</span>`;
    }, 1000);
}
function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Initializes the news feed system. Called from dashboard.html.
 */
function initNewsFeed() {
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    const countdownElement = document.getElementById(COUNTDOWN_TIMER_ID);
    if (feedContainer && countdownElement) {
        refreshAllFeeds(); // Initial fetch on load
        setInterval(refreshAllFeeds, REFRESH_INTERVAL_MS); // Set periodic refresh
        console.log("News feed system initialized.");
    } else {
        if (!feedContainer) console.error(`News feed container #${FEED_CONTAINER_ID} not found.`);
        if (!countdownElement) console.error(`Countdown timer element #${COUNTDOWN_TIMER_ID} not found.`);
    }
}

// --- Script Load Confirmation ---
console.log("news-feed.js loaded and ready.");
