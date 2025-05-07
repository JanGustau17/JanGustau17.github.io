// js/news-feed.js

const RSS_FEEDS = [
    'https://feeds.feedburner.com/TheHackersNews', // Keep this one
    'https://grahamcluley.com/feed/',
    'https://krebsonsecurity.com/feed/',
    'https://securelist.com/feed/',
    'https://news.sophos.com/en-us/category/security-operations/feed/',
    'https://news.sophos.com/en-us/category/threat-research/feed/',
    'https://www.troyhunt.com/rss/',
    'https://feeds.feedburner.com/eset/blog'
    // Note: Removed podcast and Turkish language feeds from your list as they are less suitable
];
console.log("news-feed.js loaded with updated feed list.");

const CORS_PROXY_URL = "https://api.allorigins.win/raw?url=";
const FEED_CONTAINER_ID = 'intel-feed-list';
const COUNTDOWN_TIMER_ID = 'intel-feed-countdown';
const REFRESH_INTERVAL_MINUTES = 5;
const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_MINUTES * 60 * 1000;

let allFetchedItems = []; // Stores all unique items from the last successful fetch
let displayedItemsGuids = new Set(); // Tracks GUIDs of items to avoid immediate visual repetition
let countdownIntervalId = null;

const RELEVANT_KEYWORDS = [ // Customize these for filtering
    'ai', 'artificial intelligence', 'cybersecurity', 'phishing', 'malware',
    'deepfake', 'hacking', 'vulnerability', 'ransomware', 'threat',
    'breach', 'exploit', 'defense', 'attack', 'secure', 'security', 'data protection'
];

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
        const parseErrorNode = xmlDoc.querySelector("parsererror"); // For Firefox
        if (parseErrorNode) {
            console.error("XML Parsing Error for " + feedUrl + ":", parseErrorNode.textContent);
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
            // Strip HTML tags from description more carefully
            let description = itemNode.querySelector("description")?.textContent || itemNode.querySelector("summary")?.textContent || 'No summary.';
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = description;
            description = tempDiv.textContent || tempDiv.innerText || "";
            description = description.trim();

            const author = itemNode.querySelector("author > name")?.textContent.trim() || itemNode.querySelector("dc\\:creator")?.textContent.trim() || 'Unknown Author';
            
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

function filterRelevantItems(items) {
    return items.filter(item => {
        const contentToCheck = `${item.title.toLowerCase()} ${item.description.toLowerCase()}`;
        return RELEVANT_KEYWORDS.some(keyword => contentToCheck.includes(keyword));
    });
}

function getTargetTotalItemCount() {
    if (window.innerWidth < 768) return 12;
    if (window.innerWidth < 1280) return 16;
    return 20;
}

function displayNewsItems() {
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    if (!feedContainer) { console.error("Feed container not found."); return; }
    feedContainer.innerHTML = '';

    const targetTotalItemCount = getTargetTotalItemCount();
    let potentialItems = filterRelevantItems(allFetchedItems)
        .sort((a, b) => new Date(b.pubDateStr) - new Date(a.pubDateStr));
    
    let itemsToDisplay = [];
    let newGuidsForThisBatch = new Set();

    for (const item of potentialItems) {
        if (itemsToDisplay.length >= targetTotalItemCount) break;
        if (!displayedItemsGuids.has(item.guid)) {
            itemsToDisplay.push(item);
            newGuidsForThisBatch.add(item.guid);
        }
    }
    
    if (itemsToDisplay.length < targetTotalItemCount) {
        let fallbackIndex = 0;
        while (itemsToDisplay.length < targetTotalItemCount && fallbackIndex < potentialItems.length) {
            const item = potentialItems[fallbackIndex];
            if (!itemsToDisplay.find(displayedItem => displayedItem.guid === item.guid)) {
                 itemsToDisplay.push(item);
            }
            fallbackIndex++;
        }
    }

    if (itemsToDisplay.length === 0) {
        feedContainer.innerHTML = '<p class="text-sm text-medium-gray italic p-4 text-center">No new relevant articles found from The Hacker News.</p>';
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
            desc: item.description.substring(0, 400) + (item.description.length > 400 ? '...' : ''),
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
        setTimeout(() => newsElement.classList.remove('opacity-0'), 50);
    });

    newGuidsForThisBatch.forEach(guid => displayedItemsGuids.add(guid));
    if (displayedItemsGuids.size > 100) {
        const guidsArray = Array.from(displayedItemsGuids);
        const guidsToDelete = guidsArray.slice(0, displayedItemsGuids.size - 70);
        guidsToDelete.forEach(guid => displayedItemsGuids.delete(guid));
    }
    console.log(`Displayed ${itemsToDisplay.length} news items.`);
}

async function refreshAllFeeds() {
    console.log("Refreshing news feed from The Hacker News...");
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    if (feedContainer && !feedContainer.querySelector('.text-red-400')) { // Avoid overwriting persistent error messages
        feedContainer.innerHTML = '<p class="text-sm text-medium-gray italic p-4 text-center">Fetching latest intel from The Hacker News...</p>';
    }

    const feedPromises = RSS_FEEDS.map(feedUrl => fetchSingleFeed(feedUrl));
    const results = await Promise.allSettled(feedPromises);
    let newFetchedItems = [];
    results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            newFetchedItems.push(...result.value);
        } else if (result.status === 'rejected') { 
            console.error("The feed failed to load:", result.reason);
            if(feedContainer) feedContainer.innerHTML = `<div class="news-snippet text-red-400 italic"><p>Error loading live feed:</p><p class="text-xs mt-1">${result.reason.message || 'Source or proxy unavailable.'}</p></div>`;
        }
    });
    
    const uniqueItemsMap = new Map();
    newFetchedItems.forEach(item => { if (!uniqueItemsMap.has(item.guid)) { uniqueItemsMap.set(item.guid, item); } });
    allFetchedItems = Array.from(uniqueItemsMap.values());

    // **Store allFetchedItems in sessionStorage**
    try {
        sessionStorage.setItem('allFetchedNewsItems', JSON.stringify(allFetchedItems));
        console.log(`Stored ${allFetchedItems.length} unique news items in sessionStorage.`);
    } catch (e) {
        console.error("Error saving news items to sessionStorage:", e);
    }

    displayNewsItems();
    startCountdown();
}

function startCountdown() {
    const countdownElement = document.getElementById(COUNTDOWN_TIMER_ID);
    if (!countdownElement) return;
    if (countdownIntervalId) clearInterval(countdownIntervalId);
    let timeLeft = REFRESH_INTERVAL_MS;
    countdownElement.innerHTML = `Next update in: <span class="font-orbitron">${formatTime(timeLeft)}</span>`;
    countdownIntervalId = setInterval(() => {
        timeLeft -= 1000;
        if (timeLeft < 0) { timeLeft = 0; }
        countdownElement.innerHTML = `Next update in: <span class="font-orbitron">${formatTime(timeLeft)}</span>`;
    }, 1000);
}

function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

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
