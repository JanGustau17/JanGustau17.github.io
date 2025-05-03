// js/script.js

/**
 * ======================================
 * MATRIX BACKGROUND EFFECT
 * ======================================
 */

let matrixCanvas, matrixCtx;
let matrixColumns;
let matrixDrops = [];
const matrixChars = "ニューロシールドサイバーAI脅威分析監視防御0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*()*&^%+-=/";
const matrixFontSize = 14;
const matrixRefreshRate = 35;
let matrixIntervalId = null;

function drawMatrix() {
    if (!matrixCtx || !matrixCanvas) return;
    matrixCtx.fillStyle = "rgba(0, 0, 0, 0.05)";
    matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    matrixCtx.fillStyle = "#00ffcc";
    matrixCtx.font = matrixFontSize + "px monospace";
    for (let i = 0; i < matrixDrops.length; i++) {
        const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
        const xPos = i * matrixFontSize;
        const yPos = matrixDrops[i] * matrixFontSize;
        matrixCtx.fillText(text, xPos, yPos);
        if (yPos > matrixCanvas.height && Math.random() > 0.975) {
            matrixDrops[i] = 0;
        }
        matrixDrops[i]++;
    }
}

function initMatrixBackground(canvasId) {
    matrixCanvas = document.getElementById(canvasId);
    if (!matrixCanvas) {
        console.error(`Matrix canvas element with id "${canvasId}" not found.`);
        return;
    }
    matrixCtx = matrixCanvas.getContext("2d");

    const resizeCanvas = () => {
        if (!matrixCanvas) return;
        matrixCanvas.width = window.innerWidth;
        matrixCanvas.height = window.innerHeight;
        matrixColumns = Math.floor(matrixCanvas.width / matrixFontSize);
        const newDrops = [];
        for (let x = 0; x < matrixColumns; x++) {
            newDrops[x] = matrixDrops[x] !== undefined ? matrixDrops[x] : Math.floor(Math.random() * matrixCanvas.height / matrixFontSize);
        }
        matrixDrops = newDrops;
        // console.log(`Matrix resized. Columns: ${matrixColumns}`); // Less verbose
    };

    resizeCanvas();
    if (matrixIntervalId) clearInterval(matrixIntervalId);
    matrixIntervalId = setInterval(drawMatrix, matrixRefreshRate);
    console.log("Matrix background initialized.");
    window.addEventListener('resize', resizeCanvas);
}


/**
 * ======================================
 * DASHBOARD UTILITY FUNCTIONS
 * ======================================
 */

/**
 * Animates a number counter from its current value to a target value.
 * Uses requestAnimationFrame for smoother animation.
 * @param {HTMLElement} element The HTML element (e.g., <p>) to update.
 * @param {number} targetValue The final number to display.
 * @param {number} duration The duration of the animation in ms.
 */
function animateCounter(element, targetValue, duration = 2000) {
    if (!element) {
        console.warn("animateCounter: Element not provided.");
        return;
    }

    const startValue = parseInt(element.textContent.replace(/,/g, ''), 10) || 0; // Get current value or start from 0
    const startTime = performance.now(); // Use high-resolution time

    // Prevent starting a new animation if one is already running on this element
    if (element.animationFrameId) {
        cancelAnimationFrame(element.animationFrameId);
    }

    function step(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(1, elapsedTime / duration); // Ensure progress doesn't exceed 1

        // Apply an easing function (e.g., easeOutQuad) for smoother effect
        const easedProgress = progress * (2 - progress);
        // Calculate the current value based on eased progress
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easedProgress);

        // Update the element's text content, formatted with commas
        element.textContent = currentValue.toLocaleString();

        // Continue the animation if not finished
        if (progress < 1) {
            element.animationFrameId = requestAnimationFrame(step);
        } else {
            // Ensure the final value is exactly the target value
            element.textContent = targetValue.toLocaleString();
            element.animationFrameId = null; // Clear the animation ID
            // console.log(`Counter animation finished for ${element.id}`); // Optional log
        }
    }

    // Start the animation loop
    element.animationFrameId = requestAnimationFrame(step);
}

/**
 * Initializes and periodically updates the live statistics counters on the dashboard.
 */
function initLiveStatsCounters() {
    console.log("Initializing live stats counters...");
    const statsContainer = document.getElementById('liveStats');
    if (!statsContainer) {
        console.error("Live stats container not found.");
        return;
    }

    // Get references to the specific stat elements
    const elements = {
        threats: document.getElementById('threatsDetected'),
        phishing: document.getElementById('phishingCampaigns'),
        deepfakes: document.getElementById('deepfakesIntercepted'),
        networks: document.getElementById('networksSecured')
    };

    // Check if all elements were found
    if (!elements.threats || !elements.phishing || !elements.deepfakes || !elements.networks) {
        console.error("One or more live stat elements not found within #liveStats.");
        return;
    }

    // Initial data fetch and animation
    let currentStats = {}; // Store current values to check for updates
    const updateStats = (isInitial = false) => {
        if (typeof getSimulatedThreatStats !== 'function') {
            console.error("getSimulatedThreatStats function not found.");
            clearInterval(updateInterval); // Stop trying to update
            return;
        }
        const newStats = getSimulatedThreatStats();
        const duration = isInitial ? 2500 : 1000; // Longer initial animation, faster updates

        // Update each stat if the value changed or it's the initial run
        if (isInitial || newStats.threatsDetected !== currentStats.threatsDetected) {
            animateCounter(elements.threats, newStats.threatsDetected, duration);
            currentStats.threatsDetected = newStats.threatsDetected;
        }
        if (isInitial || newStats.phishingCampaigns !== currentStats.phishingCampaigns) {
            animateCounter(elements.phishing, newStats.phishingCampaigns, duration * 0.8); // Slightly faster
            currentStats.phishingCampaigns = newStats.phishingCampaigns;
        }
        if (isInitial || newStats.deepfakesIntercepted !== currentStats.deepfakesIntercepted) {
            animateCounter(elements.deepfakes, newStats.deepfakesIntercepted, duration * 0.9);
            currentStats.deepfakesIntercepted = newStats.deepfakesIntercepted;
        }
        if (isInitial || newStats.networksSecured !== currentStats.networksSecured) {
            animateCounter(elements.networks, newStats.networksSecured, duration * 0.85);
            currentStats.networksSecured = newStats.networksSecured;
        }
         console.log("Stats updated (or checked for update).");
    };

    // Perform initial update
    updateStats(true);

    // Set interval for periodic updates
    const UPDATE_INTERVAL_STATS = 7500; // Update every 7.5 seconds (adjust as needed)
    const updateInterval = setInterval(() => updateStats(false), UPDATE_INTERVAL_STATS);
    console.log(`Stats counters initialized. Updates every ${UPDATE_INTERVAL_STATS / 1000}s.`);

     // Note: Consider clearing this interval if the user navigates away / logs out
     // This might require more advanced state management or cleanup logic.
}

/**
 * Populates the list of simulated high-risk phishing websites on the dashboard.
 * @param {string} listId The ID of the UL element to populate.
 */
function populatePhishingList(listId) {
    console.log(`Populating phishing list for #${listId}`);
    const listElement = document.getElementById(listId);
    if (!listElement) {
        console.error(`Phishing list element with id "${listId}" not found.`);
        return;
    }

    // Fetch the list of sites
    if (typeof getSimulatedPhishingList !== 'function') {
         console.error("getSimulatedPhishingList function not found.");
         listElement.innerHTML = '<li class="list-item text-red-500">Error loading threat feed function.</li>';
         return;
    }
    const sites = getSimulatedPhishingList(12); // Get 12 sites

    // Clear current list content (e.g., "Loading..." message)
    listElement.innerHTML = '';

    // Check if any sites were returned
    if (!sites || sites.length === 0) {
        const li = document.createElement('li');
        li.className = 'list-item text-gray-400 italic';
        li.textContent = 'No high-risk URLs currently flagged in simulation.';
        listElement.appendChild(li);
        console.log("Phishing list populated: No sites found.");
        return;
    }

    // Create and append list items for each site
    sites.forEach(site => {
        const li = document.createElement('li');
        li.className = 'list-item text-sm truncate'; // Use truncate for potentially long URLs
        li.textContent = site;
        li.title = site; // Show full URL on hover (useful with truncate)

        // Optional: Make it a clickable link (but don't actually navigate)
        // const link = document.createElement('a');
        // link.href = "#"; // Prevent navigation
        // link.textContent = site;
        // link.title = `Simulated phishing URL: ${site} (Do not visit real suspicious links!)`;
        // link.onclick = (e) => e.preventDefault(); // Ensure it doesn't navigate
        // li.appendChild(link);

        listElement.appendChild(li);
    });

    console.log(`Phishing list populated with ${sites.length} items.`);

    // Optional: Add subtle fade-in animation for the list items?
    listElement.classList.add('opacity-0', 'transition-opacity', 'duration-500');
    setTimeout(() => listElement.classList.remove('opacity-0'), 50); // Start fade-in shortly after adding
}


// --- Global Initialization Confirmation ---
console.log("script.js loaded: General page logic, Matrix background, and Dashboard utilities available.");
