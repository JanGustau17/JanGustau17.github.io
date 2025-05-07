// js/news-feed.js

// RSS_FEEDS, CORS_PROXY_URL, FEED_CONTAINER_ID, COUNTDOWN_TIMER_ID, REFRESH_INTERVAL_MINUTES, REFRESH_INTERVAL_MS - (Keep these as before)
const RSS_FEEDS = [
    'https://www.wired.com/feed/tag/ai/latest/rss',
    'https://www.wired.com/feed/category/security/latest/rss',
    'https://feeds.feedburner.com/TheHackersNews'
];
const CORS_PROXY_URL = "https://api.allorigins.win/raw?url=";
const FEED_CONTAINER_ID = 'intel-feed-list';
const COUNTDOWN_TIMER_ID = 'intel-feed-countdown';
const REFRESH_INTERVAL_MINUTES = 5;
const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_MINUTES * 60 * 1000;

let allFetchedItems = [];
let displayedItemsGuids = new Set(); // To track GUIDs of items to avoid immediate visual repetition in one batch
let countdownIntervalId = null;

const RELEVANT_KEYWORDS = [
    'ai', 'artificial intelligence', 'cybersecurity', 'phishing', 'malware',
    'deepfake', 'hacking', 'vulnerability', 'ransomware', 'threat',
    'breach', 'exploit', 'defense', 'attack', 'secure', 'security', 'data protection'
];

// fetchSingleFeed function (Keep as before, no changes needed here if it was working)
async function fetchSingleFeed(feedUrl) {
    const urlToFetch = `${CORS_PROXY_URL}${encodeURIComponent(feedUrl)}`;
    // console.log(`Workspaceing: ${feedUrl.substring(0, 50)}... via proxy`); // Less verbose logging
    try {
        const response = await fetch(urlToFetch);
        if (!response.ok) {
            let errorText = `HTTP error for ${feedUrl.substring(0,30)}! Status: ${response.status}`;
            try { const proxyError = await response.text(); errorText += ` - ${proxyError.substring(0, 100)}`;} catch (e) {/*ignore*/}
            throw new Error(errorText);
        }
        const data = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "text/xml");
        const parseError = xmlDoc.querySelector("parsererror");
        if (parseError) {
            console.error("XML Parsing Error for " + feedUrl + ":", parseError.textContent); // Log error content
            return [];
        }
        const items = [];
        xmlDoc.querySelectorAll("item, entry").forEach(itemNode => {
            const title = itemNode.querySelector("title")?.textContent.trim() || 'No Title';
            let link = itemNode.querySelector("guid")?.textContent.trim() || itemNode.querySelector("link")?.textContent.trim() || '';
            if (!link && itemNode.querySelector("link")?.hasAttribute('href')) {
                link = itemNode.querySelector("link")?.getAttribute('href').trim();
            }
            const pubDateStr = itemNode.querySelector("pubDate")?.textContent || itemNode.querySelector("published")?.textContent || itemNode.querySelector("updated")?.textContent || new Date().toISOString();
            const description = itemNode.querySelector("description")?.textContent.trim().replace(/<[^>]+>/g, '') || itemNode.querySelector("summary")?.textContent.trim().replace(/<[^>]+>/g, '') || 'No summary.';
            const author = itemNode.querySelector("author > name")?.textContent.trim() || itemNode.querySelector("dc\\:creator")?.textContent.trim() || 'Unknown';
            let imageUrl = null;
            const enclosure = itemNode.querySelector("enclosure[url*='.jpg'], enclosure[url*='.png'], enclosure[url*='.jpeg']");
            if (enclosure) { imageUrl = enclosure.getAttribute('url');
            } else {
                const mediaContent = itemNode.querySelector("media\\:content[url*='.jpg'], media\\:content[url*='.png'], media\\:content[url*='.jpeg']");
                if (mediaContent) { imageUrl = mediaContent.getAttribute('url');
                } else {
                    const descDoc = new DOMParser().parseFromString(itemNode.querySelector("description")?.textContent || "", "text/html");
                    const imgTag = descDoc.querySelector("img");
                    if (imgTag && imgTag.src) { imageUrl = imgTag.src; }
                }
            }
            const sourceName = xmlDoc.querySelector("channel > title")?.textContent.trim() || xmlDoc.querySelector("feed > title")?.textContent.trim() || new URL(feedUrl).hostname;
            items.push({ title, link, pubDateStr, description, author, imageUrl, sourceName, guid: link || title + pubDateStr });
        });
        return items;
    } catch (error) {
        console.error(`Error fetching feed ${feedUrl}:`, error);
        return [];
    }
}

// filterRelevantItems function (Keep as before)
function filterRelevantItems(items) {
    return items.filter(item => {
        const contentToCheck = `${item.title.toLowerCase()} ${item.description.toLowerCase()}`;
        return RELEVANT_KEYWORDS.some(keyword => contentToCheck.includes(keyword));
    });
}

/**
 * MODIFIED: Determines the total number of items to attempt to render in the scroll list.
 */
function getTargetTotalItemCount() {
    if (window.innerWidth < 768) return 12; // Small screens: 6 visible + 6 scrollable (approx)
    if (window.innerWidth < 1280) return 16; // Medium screens (up to lg): 8 visible + 8 scrollable (approx)
    return 20; // Large screens: 10 visible + 10 scrollable (approx)
}

/**
 * MODIFIED: Displays news items in the feed container based on screen size.
 */
function displayNewsItems() {
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    if (!feedContainer) {
        console.error("Feed container not found for displaying news.");
        return;
    }

    feedContainer.innerHTML = ''; // Clear current items

    const targetTotalItemCount = getTargetTotalItemCount();

    // Get unique, filtered items, sort by date (newest first)
    // Ensure we only process items not recently shown to fill the target count
    let potentialItems = filterRelevantItems(allFetchedItems)
        .sort((a, b) => new Date(b.pubDateStr) - new Date(a.pubDateStr));
    
    let itemsToDisplay = [];
    let newGuidsForThisBatch = new Set();

    for (const item of potentialItems) {
        if (itemsToDisplay.length >= targetTotalItemCount) break;
        if (!displayedItemsGuids.has(item.guid)) { // Avoid items shown in *previous* batches
            itemsToDisplay.push(item);
            newGuidsForThisBatch.add(item.guid);
        }
    }
    
    // If not enough new items, fill with older (but still relevant and sorted) items,
    // even if they were in displayedItemsGuids, to meet the target count.
    // This ensures the list is always full if enough relevant content exists.
    if (itemsToDisplay.length < targetTotalItemCount) {
        let fallbackIndex = 0;
        while (itemsToDisplay.length < targetTotalItemCount && fallbackIndex < potentialItems.length) {
            const item = potentialItems[fallbackIndex];
            // Add if not already in the current batch to display
            if (!itemsToDisplay.find(displayedItem => displayedItem.guid === item.guid)) {
                 itemsToDisplay.push(item);
            }
            fallbackIndex++;
        }
    }


    if (itemsToDisplay.length === 0) {
        feedContainer.innerHTML = '<p class="text-sm text-medium-gray italic p-4 text-center">No new relevant articles found. Check back soon!</p>';
        return;
    }

    itemsToDisplay.forEach(item => {
        const newsElement = document.createElement('div');
        newsElement.className = 'news-snippet py-2 opacity-0 transition-opacity duration-500';
        const articleParams = new URLSearchParams({
            title: item.title,
            link: item.link,
            pubDate: item.pubDateStr,
            source: item.sourceName,
            author: item.author,
            desc: item.description.substring(0, 400) + (item.description.length > 400 ? '...' : ''), // Longer desc for article page
            image: item.imageUrl || ''
        }).toString();

        newsElement.innerHTML = `
            <h4 class="text-sm font-semibold text-light-gray hover:text-cyber-cyan transition-colors">
                <a href="article_view.html?${articleParams}" title="${item.title}">
                    ${item.title.substring(0, 80)}${item.title.length > 80 ? '...' : ''}
                </a>
            </h4>
            <p class="text-xs text-medium-gray">${item.sourceName} - ${new Date(item.pubDateStr).toLocaleDateString()}</p>
        `;
        feedContainer.appendChild(newsElement);
        setTimeout(() => newsElement.classList.remove('opacity-0'), 50); // Trigger fade-in
    });

    // Update the global set of displayed GUIDs with new items from this batch
    newGuidsForThisBatch.forEach(guid => displayedItemsGuids.add(guid));
    
    // Prune the displayedItemsGuids set if it gets too large (e.g., keep the last 100 unique GUIDs)
    // This helps manage memory and ensures older items can reappear eventually.
    if (displayedItemsGuids.size > 100) {
        const guidsArray = Array.from(displayedItemsGuids);
        const guidsToDelete = guidsArray.slice(0, displayedItemsGuids.size - 70); // Keep approx 70 freshest
        guidsToDelete.forEach(guid => displayedItemsGuids.delete(guid));
    }
    
    console.log(`Displayed ${itemsToDisplay.length} news items. Total unique items fetched: ${allFetchedItems.length}`);
}


// refreshAllFeeds function (Keep as before, no changes needed here)
async function refreshAllFeeds() {
    console.log("Refreshing all news feeds...");
    const feedPromises = RSS_FEEDS.map(feedUrl => fetchSingleFeed(feedUrl));
    const results = await Promise.allSettled(feedPromises);
    allFetchedItems = [];
    results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            allFetchedItems.push(...result.value);
        } else if (result.status === 'rejected') { console.error("A feed failed to load:", result.reason); }
    });
    const uniqueItemsMap = new Map();
    allFetchedItems.forEach(item => { if (!uniqueItemsMap.has(item.guid)) { uniqueItemsMap.set(item.guid, item); } });
    allFetchedItems = Array.from(uniqueItemsMap.values());
    console.log(`Total unique items fetched across all feeds: ${allFetchedItems.length}`);
    displayNewsItems();
    startCountdown();
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
        if (timeLeft < 0) { timeLeft = 0; /* Should be cleared by refresh */ }
        countdownElement.innerHTML = `Next update in: <span class="font-orbitron">${formatTime(timeLeft)}</span>`;
    }, 1000);
}
function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}


// initNewsFeed function (Keep as before)
function initNewsFeed() {
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    const countdownElement = document.getElementById(COUNTDOWN_TIMER_ID);
    if (feedContainer && countdownElement) {
        refreshAllFeeds(); 
        setInterval(refreshAllFeeds, REFRESH_INTERVAL_MS);
        console.log("News feed system initialized.");
    } else {
        if (!feedContainer) console.error(`News feed container #${FEED_CONTAINER_ID} not found.`);
        if (!countdownElement) console.error(`Countdown timer element #${COUNTDOWN_TIMER_ID} not found.`);
    }
}
console.log("news-feed.js loaded.");
