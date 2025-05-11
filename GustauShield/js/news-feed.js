// File: js/news-feed.js
// Manages the rotating article display on the dashboard using static data.

// --- Constants ---
// Ensure GUSTAU_SHIELD_ARTICLES is loaded before this script runs.
// Best way is to include articles-data.js BEFORE news-feed.js in your HTML.
const ALL_STATIC_ARTICLES = typeof GUSTAU_SHIELD_ARTICLES !== 'undefined' ? GUSTAU_SHIELD_ARTICLES : [];

const FEED_CONTAINER_ID = 'intel-feed-list';
const COUNTDOWN_TIMER_ID = 'intel-feed-countdown';
const ARTICLES_PER_BATCH_DASHBOARD = 5;
const ROTATION_INTERVAL_MINUTES = 5; // Rotate every 5 minutes
const ROTATION_INTERVAL_MS = ROTATION_INTERVAL_MINUTES * 60 * 1000;

// --- State Variables ---
let currentArticleBatchIndex = 0; // 0 for first 5, 1 for next 5
let countdownIntervalIdGlobal = null;

/**
 * Displays a specific batch of articles on the dashboard.
 */
function displayDashboardArticleBatch() {
    const feedContainer = document.getElementById(FEED_CONTAINER_ID);
    if (!feedContainer) {
        console.error("Dashboard feed container element not found in HTML.");
        return;
    }
    feedContainer.innerHTML = ''; // Clear previous items

    if (ALL_STATIC_ARTICLES.length === 0) {
        feedContainer.innerHTML = '<p class="text-sm text-gray-500 italic p-4 text-center">No articles available to display.</p>';
        return;
    }

    const startIndex = currentArticleBatchIndex * ARTICLES_PER_BATCH_DASHBOARD;
    const endIndex = startIndex + ARTICLES_PER_BATCH_DASHBOARD;
    const articlesToShow = ALL_STATIC_ARTICLES.slice(startIndex, endIndex);

    if (articlesToShow.length === 0 && ALL_STATIC_ARTICLES.length > 0) {
        // This case might happen if the logic for batching is off, or if there are fewer than ARTICLES_PER_BATCH_DASHBOARD articles total
        // For 10 articles and 5 per batch, this shouldn't be an issue unless currentArticleBatchIndex is wrong.
        console.warn("No articles to show in the current batch, resetting batch index.");
        currentArticleBatchIndex = 0; // Reset to first batch
        displayDashboardArticleBatch(); // Retry with the first batch
        return;
    }
     if (articlesToShow.length === 0) {
        feedContainer.innerHTML = '<p class="text-sm text-gray-500 italic p-4 text-center">No articles in current view.</p>';
        return;
    }


    articlesToShow.forEach((item, index) => {
        const newsElement = document.createElement('div');
        newsElement.className = 'news-snippet p-3 mb-3 bg-gray-800 rounded-lg shadow-lg opacity-0 transition-opacity duration-700 ease-out flex items-start space-x-3 hover:bg-gray-700/70';
        
        const articleGuidEncoded = encodeURIComponent(item.guid);

        let imageHtmlSnippet = '';
        if (item.imageUrl) {
            imageHtmlSnippet = `
                <div class="flex-shrink-0 w-20 h-20 md:w-24 md:h-20"> {/* Adjusted height for dashboard summary */}
                    <img src="${item.imageUrl}" alt="Image for ${item.title.substring(0,30)}..."
                         class="w-full h-full object-cover rounded-md shadow-md"
                         onerror="this.style.display='none'; console.warn('Image failed to load: ${item.imageUrl}')">
                </div>
            `;
        } else {
            imageHtmlSnippet = `<div class="flex-shrink-0 w-20 h-20 md:w-24 md:h-20 bg-gray-700 rounded-md flex items-center justify-center text-gray-500 text-xs p-1">No Image</div>`;
        }

        newsElement.innerHTML = `
            ${imageHtmlSnippet}
            <div class="flex-grow overflow-hidden">
                <h4 class="text-sm font-semibold text-gray-100 hover:text-cyan-400 transition-colors duration-150" title="${item.title}">
                    <a href="${item.link}" class="focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded block">
                        ${item.title}
                    </a>
                </h4>
                <p class="text-xs text-gray-400 mb-1.5">${item.sourceName} - ${new Date(item.pubDateStr).toLocaleDateString()}</p>
                <p class="text-xs text-gray-300 dashboard-summary leading-relaxed">
                    ${item.dashboardSummary}
                </p>
            </div>
        `;
        feedContainer.appendChild(newsElement);
        setTimeout(() => newsElement.classList.remove('opacity-0'), 60 * index + 50); // Staggered fade-in
    });
    console.log(`Dashboard: Displayed batch ${currentArticleBatchIndex + 1} with ${articlesToShow.length} articles.`);
}

/**
 * Rotates to the next batch of articles and updates the display.
 */
function rotateDashboardArticles() {
    console.log("Dashboard: Rotating articles...");
    const totalBatches = Math.ceil(ALL_STATIC_ARTICLES.length / ARTICLES_PER_BATCH_DASHBOARD);
    if (totalBatches === 0) return; // No articles to rotate

    currentArticleBatchIndex = (currentArticleBatchIndex + 1) % totalBatches;
    
    displayDashboardArticleBatch();
    startDashboardCountdownTimer(); // Restart countdown for the new batch
}

/**
 * Starts or restarts the countdown timer for the next article rotation.
 */
function startDashboardCountdownTimer() {
    const countdownElement = document.getElementById(COUNTDOWN_TIMER_ID);
    if (!countdownElement) {
        console.warn("Dashboard countdown timer element not found.");
        return;
    }
    if (countdownIntervalIdGlobal) {
        clearInterval(countdownIntervalIdGlobal);
    }
    let timeLeftInMs = ROTATION_INTERVAL_MS;

    const updateTimerDisplay = () => {
        const minutes = Math.floor((timeLeftInMs / (1000 * 60)) % 60);
        const seconds = Math.floor((timeLeftInMs / 1000) % 60);
        countdownElement.innerHTML = `Next rotation in: <span class="font-semibold font-orbitron text-cyan-400">${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}</span>`;
        timeLeftInMs -= 1000;
        if (timeLeftInMs < 0) {
            clearInterval(countdownIntervalIdGlobal);
            // Rotation will be triggered by the main setInterval calling rotateDashboardArticles
        }
    };
    updateTimerDisplay(); // Initial display
    countdownIntervalIdGlobal = setInterval(updateTimerDisplay, 1000);
}

/**
 * Initializes the dashboard news feed system.
 */
function initDashboardNewsFeed() {
    if (ALL_STATIC_ARTICLES.length === 0) {
        console.warn("No static articles found. Ensure articles-data.js is loaded and GUSTAU_SHIELD_ARTICLES is populated.");
        const feedContainer = document.getElementById(FEED_CONTAINER_ID);
        if (feedContainer) {
            feedContainer.innerHTML = '<p class="text-sm text-red-500 italic p-4 text-center">Article data is missing. Please check configuration.</p>';
        }
        return;
    }

    // Store all articles in sessionStorage for blogs.html
    try {
        sessionStorage.setItem('allFetchedNewsItems', JSON.stringify(ALL_STATIC_ARTICLES));
        console.log(`Stored ${ALL_STATIC_ARTICLES.length} static articles in sessionStorage.`);
    } catch (e) {
        console.error("Error saving static articles to sessionStorage:", e);
    }

    displayDashboardArticleBatch(); // Display initial batch
    startDashboardCountdownTimer();   // Start the first countdown

    // Set up periodic rotation
    setInterval(rotateDashboardArticles, ROTATION_INTERVAL_MS);

    console.log(`Dashboard news feed initialized with static articles. Rotation interval: ${ROTATION_INTERVAL_MINUTES} minutes.`);
}

// --- Script Entry Point ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("news-feed.js (static data version) loaded. Initializing dashboard feed...");
    initDashboardNewsFeed();
});
