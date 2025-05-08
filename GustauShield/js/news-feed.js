// js/news-feed.js

const RSS_FEEDS = [ // Updated list of 8 feeds
    'https://feeds.feedburner.com/TheHackersNews',
    'https://grahamcluley.com/feed/',
    'https://krebsonsecurity.com/feed/',
    'https://securelist.com/feed/',
    'https://news.sophos.com/en-us/category/security-operations/feed/',
    'https://news.sophos.com/en-us/category/threat-research/feed/',
    'https://www.troyhunt.com/rss/',
    'https://feeds.feedburner.com/eset/blog'
];
const CORS_PROXY_URL = "https://api.allorigins.win/raw?url=";
const FEED_CONTAINER_ID = 'intel-feed-list';
const COUNTDOWN_TIMER_ID = 'intel-feed-countdown';
const REFRESH_INTERVAL_MINUTES = 5;
const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_MINUTES * 60 * 1000;

let allFetchedItems = [];
let displayedItemsGuids = new Set(); // Only track GUIDs displayed in the *current* visible list batch
let countdownIntervalId = null;

// Improved Keyword Filtering Setup
const AI_KEYWORDS = ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'generative ai', 'llm', 'large language model', 'deepfake', 'neural network', 'computer vision', 'nlp', 'natural language processing', 'automation', 'automated'];
const SECURITY_KEYWORDS = ['cybersecurity', 'security', 'phishing', 'malware', 'hacking', 'hacker', 'cyberattack', 'vulnerability', 'ransomware', 'threat', 'breach', 'exploit', 'defense', 'attack', 'secure', 'data protection', 'zero-day', 'incident response', 'infosec', 'endpoint', 'network security', 'iam', 'identity', 'encryption', 'firewall', 'intrusion', 'pentest', 'red team', 'spoofing', 'credential', 'backdoor', 'trojan', 'spyware', 'cert', 'cisa', 'mitigation', 'patch'];
const SPECIFIC_AI_SEC_KEYWORDS = ['ai security', 'ai cybersecurity', 'ai defense', 'ai attack', 'ai threat', 'adversarial ai', 'adversarial machine learning', 'deepfake scam', 'ai phishing', 'ml security', 'ai vulnerability', 'ai red team', 'ai soc', 'generative ai security', 'llm security', 'ai incident response', 'weaponized ai', 'ai cybercrime', 'ai malware', 'ai-powered attack', 'ai-driven defense'];

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
        if (parseErrorNode) { console.error(`XML Parsing Error for ${feedUrl}:`, parseErrorNode.textContent); return []; }

        const items = [];
        const sourceName = xmlDoc.querySelector("channel > title")?.textContent.trim() || xmlDoc.querySelector("feed > title")?.textContent.trim() || new URL(feedUrl).hostname;

        xmlDoc.querySelectorAll("item, entry").forEach(itemNode => {
            const title = itemNode.querySelector("title")?.textContent.trim() || 'No Title';
            let link = itemNode.querySelector("guid")?.textContent.trim() || itemNode.querySelector("link")?.textContent.trim() || '';
            if (!link && itemNode.querySelector("link")?.hasAttribute('href')) { link = itemNode.querySelector("link")?.getAttribute('href').trim(); }
            const pubDateStr = itemNode.querySelector("pubDate")?.textContent || itemNode.querySelector("published")?.textContent || itemNode.querySelector("updated")?.textContent || new Date().toISOString();
            let descriptionHTML = itemNode.querySelector("description")?.innerHTML || itemNode.querySelector("summary")?.innerHTML || itemNode.querySelector("content")?.innerHTML || '';
            const tempDiv = document.createElement("div"); tempDiv.innerHTML = descriptionHTML;
            const descriptionText = (tempDiv.textContent || tempDiv.innerText || "").trim();
            const author = itemNode.querySelector("author > name")?.textContent.trim() || itemNode.querySelector("dc\\:creator")?.textContent.trim() || 'Unknown Author';
            let imageUrl = null;
            const enclosure = itemNode.querySelector("enclosure[type^='image']");
            if (enclosure) { imageUrl = enclosure.getAttribute('url'); }
            else { const mediaContent = itemNode.querySelector("media\\:content[medium='image'], media\\:thumbnail"); if (mediaContent) { imageUrl = mediaContent.getAttribute('url'); }
            else { const imgTag = tempDiv.querySelector("img"); if (imgTag && imgTag.src) { imageUrl = imgTag.src; } } }
            const guid = link || title + pubDateStr; // Use link if available, otherwise title+date as unique ID

            // Only add if title and link/guid exist
            if (title !== 'No Title' && guid) {
                 items.push({ title, link, pubDateStr, description: descriptionText, // Store plain text description
                                 descriptionHTML: descriptionHTML, // Store original HTML description
                                 author, imageUrl, sourceName, guid });
            }
        });
        return items;
    } catch (error) { console.error(`Error processing feed ${feedUrl}:`, error); return []; }
}

function filterRelevantItems(items) {
    // console.log(`Filtering ${items.length} raw items for AI+Security relevance...`); // Verbose
    const relevantItems = items.filter(item => {
        const titleLower = item.title.toLowerCase();
        const descLower = item.description.toLowerCase(); // Use plain text description for filtering
        const contentToCheck = titleLower + ' ' + descLower;
        if (SPECIFIC_AI_SEC_KEYWORDS.some(keyword => contentToCheck.includes(keyword))) return true;
        const hasAiKeyword = AI_KEYWORDS.some(keyword => contentToCheck.includes(keyword));
        if (hasAiKeyword) {
            const hasSecKeyword = SECURITY_KEYWORDS.some(keyword => contentToCheck.includes(keyword));
            if (hasSecKeyword) return true;
        }
        return false;
    });
    // console.log(`Found ${relevantItems.length} potentially relevant items after filtering.`); // Verbose
    return relevantItems;
}

function getTargetTotalItemCount() {
    if (window.innerWidth < 768) return 12;
    if (window.innerWidth < 1280) return 16;
    return 20;
}

function displayNewsItems() {
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    if (!feedContainer) return;
    feedContainer.innerHTML = ''; // Clear previous

    const targetTotalItemCount = getTargetTotalItemCount();
    let potentialItems = filterRelevantItems(allFetchedItems)
        .sort((a, b) => new Date(b.pubDateStr) - new Date(a.pubDateStr));

    let itemsToDisplay = potentialItems.slice(0, targetTotalItemCount); // Take the top relevant items

    // Update the set of GUIDs that are currently visible or scrollable in this batch
    displayedItemsGuids = new Set(itemsToDisplay.map(item => item.guid));

    if (itemsToDisplay.length === 0) {
        feedContainer.innerHTML = '<p class="text-sm text-medium-gray italic p-4 text-center">No relevant AI/Cybersecurity articles found in feeds currently.</p>';
        return;
    }

    itemsToDisplay.forEach(item => {
        const newsElement = document.createElement('div');
        newsElement.className = 'news-snippet py-2 opacity-0 transition-opacity duration-500';
        const articleGuid = encodeURIComponent(item.guid); // Pass GUID to blog page

        let displayDate = '';
        try { displayDate = new Date(item.pubDateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch(e) {}

        newsElement.innerHTML = `
            <h4 class="text-sm font-semibold text-light-gray hover:text-cyber-cyan transition-colors truncate" title="${item.title}">
                <a href="blogs.html?article=${articleGuid}">
                    ${item.title}
                </a>
            </h4>
            <p class="text-xs text-medium-gray">${item.sourceName} - ${displayDate}</p>
        `;
        feedContainer.appendChild(newsElement);
        setTimeout(() => newsElement.classList.remove('opacity-0'), 50);
    });
    console.log(`Displayed ${itemsToDisplay.length} news items.`);
}

async function refreshAllFeeds() {
    console.log("Refreshing all news feeds...");
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    let isShowingError = feedContainer ? feedContainer.querySelector('.text-red-400') !== null : false;
    if (feedContainer && !isShowingError) {
        feedContainer.innerHTML = '<p class="text-sm text-medium-gray italic p-4 text-center">Fetching latest intel...</p>';
    }

    const feedPromises = RSS_FEEDS.map(feedUrl => fetchSingleFeed(feedUrl));
    const results = await Promise.allSettled(feedPromises);
    let newlyFetchedItems = []; // Use temporary array
    let fetchErrorOccurred = false;
    results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            newlyFetchedItems.push(...result.value);
        } else if (result.status === 'rejected') {
            console.error("A feed failed to load:", result.reason);
            fetchErrorOccurred = true;
        }
    });

    // De-duplicate based on GUID
    const uniqueItemsMap = new Map();
    newlyFetchedItems.forEach(item => { if (!uniqueItemsMap.has(item.guid)) { uniqueItemsMap.set(item.guid, item); } });
    allFetchedItems = Array.from(uniqueItemsMap.values()); // Update the global store

    // Store in sessionStorage for blogs.html
    try {
        sessionStorage.setItem('allFetchedNewsItems', JSON.stringify(allFetchedItems));
        console.log(`Stored ${allFetchedItems.length} unique news items in sessionStorage.`);
    } catch (e) { console.error("Error saving news items to sessionStorage:", e); }

    displayNewsItems(); // Update the dashboard list
    if (fetchErrorOccurred && feedContainer && allFetchedItems.length === 0) {
         feedContainer.innerHTML = `<div class="news-snippet text-red-400 italic p-4"><p>Error loading live feed. Some sources may be unavailable. Please try again later.</p></div>`;
    }
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
        if (timeLeft < 0) { timeLeft = 0; /* Visually stop at 0 */ }
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
console.log("news-feed.js loaded and ready.");
