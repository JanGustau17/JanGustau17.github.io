// js/script.js

/**
 * ======================================
 * MATRIX BACKGROUND EFFECT
 * ======================================
 */

let matrixCanvas, matrixCtx; // Canvas element and 2D rendering context
let matrixColumns;           // Number of columns for the falling text
let matrixDrops = [];        // Array to store the Y-position of each drop in each column
const matrixChars = "ニューロシールドサイバーAI脅威分析監視防御0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*()*&^%+-=/"; // Characters including Japanese Katakana for theme
const matrixFontSize = 14;   // Font size of the characters
const matrixRefreshRate = 35; // Milliseconds between frames (~28 FPS - slightly slower can look good for matrix)
let matrixIntervalId = null; // To store the interval ID for stopping later

/**
 * Draws a single frame of the Matrix animation.
 */
function drawMatrix() {
    // Ensure canvas and context are available
    if (!matrixCtx || !matrixCanvas) {
        console.warn("Matrix canvas or context not ready for drawing.");
        return;
    }

    // Draw a semi-transparent black rectangle over the entire canvas.
    // This creates the fading trail effect for the characters.
    // Adjust alpha (0.05) for shorter/longer trails.
    matrixCtx.fillStyle = "rgba(0, 0, 0, 0.05)";
    matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

    // Set the color and font for the falling characters
    matrixCtx.fillStyle = "#00ffcc"; // Neon Teal/Green
    matrixCtx.font = matrixFontSize + "px monospace"; // Monospaced font is crucial

    // Loop through each column
    for (let i = 0; i < matrixDrops.length; i++) {
        // Pick a random character from the matrixChars string
        const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));

        // Calculate the x and y coordinates for the character
        const xPos = i * matrixFontSize;
        const yPos = matrixDrops[i] * matrixFontSize;

        // Draw the character onto the canvas
        matrixCtx.fillText(text, xPos, yPos);

        // Randomly reset the drop back to the top (y=0) if it's gone off screen.
        // The Math.random() > 0.975 condition adds randomness, so columns don't all restart at once.
        if (yPos > matrixCanvas.height && Math.random() > 0.975) {
            matrixDrops[i] = 0;
        }

        // Move the drop down by one character height for the next frame
        matrixDrops[i]++;
    }

    // --- Subtle pulsing glow effect --- (Optional, can be performance intensive)
    // This adds a very subtle overall glow that pulses slowly.
    // const glowIntensity = 0.03 + Math.sin(Date.now() / 1500) * 0.02; // Slow pulse (adjust divisor for speed)
    // matrixCtx.fillStyle = `rgba(0, 255, 204, ${glowIntensity})`;
    // matrixCtx.globalCompositeOperation = 'lighter'; // Use additive blending for glow
    // matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    // matrixCtx.globalCompositeOperation = 'source-over'; // IMPORTANT: Reset blending mode
}

/**
 * Initializes the Matrix background effect on the specified canvas.
 * @param {string} canvasId The ID of the canvas element.
 */
function initMatrixBackground(canvasId) {
    matrixCanvas = document.getElementById(canvasId);
    if (!matrixCanvas) {
        console.error(`Matrix canvas element with id "${canvasId}" not found.`);
        return;
    }
    matrixCtx = matrixCanvas.getContext("2d");

    // Function to resize canvas and recalculate columns
    const resizeCanvas = () => {
        if (!matrixCanvas) return;
        matrixCanvas.width = window.innerWidth;
        matrixCanvas.height = window.innerHeight;

        // Calculate the number of columns based on canvas width and font size
        matrixColumns = Math.floor(matrixCanvas.width / matrixFontSize);

        // Initialize or re-initialize the drops array.
        // Try to preserve existing drop positions if columns still exist.
        const newDrops = [];
        for (let x = 0; x < matrixColumns; x++) {
            // If resizing larger, add new drops starting at random heights
            // If resizing smaller, old drops beyond the new width are just ignored
            newDrops[x] = matrixDrops[x] !== undefined ? matrixDrops[x] : Math.floor(Math.random() * matrixCanvas.height / matrixFontSize);
        }
        matrixDrops = newDrops;
        console.log(`Matrix resized. Columns: ${matrixColumns}`);
    };

    // Initial setup
    resizeCanvas(); // Call initially to set size and drops

    // Stop any previous animation loop before starting a new one
    if (matrixIntervalId) {
        clearInterval(matrixIntervalId);
    }

    // Start the drawing loop using setInterval
    matrixIntervalId = setInterval(drawMatrix, matrixRefreshRate);
    console.log("Matrix background initialized and animation started.");

    // Add event listener for window resize to adapt the effect
    window.addEventListener('resize', resizeCanvas);
}


/**
 * ======================================
 * OTHER UTILITY FUNCTIONS (Placeholder)
 * ======================================
 * These will be used later for the dashboard etc.
 */

/**
 * Animates a number counter from 0 to target value.
 * @param {HTMLElement} element The HTML element to update.
 * @param {number} targetValue The final number to display.
 * @param {number} duration The duration of the animation in ms.
 */
function animateCounter(element, targetValue, duration = 1500) {
    // Implementation will be added later when needed for dashboard.html
    if(element) {
        element.textContent = targetValue.toLocaleString(); // Placeholder: just set final value for now
    }
    console.log(`Placeholder: animateCounter called for element ${element?.id} to ${targetValue}`);
}

/**
 * Initializes the live statistics counters on the dashboard.
 */
function initLiveStatsCounters() {
    // Implementation will be added later when needed for dashboard.html
    console.log("Placeholder: initLiveStatsCounters called.");
     // Example of how it would be used:
     // const threatsEl = document.getElementById('threatsDetected');
     // if (threatsEl) animateCounter(threatsEl, 123456, 2000);
}

/**
 * Populates the list of simulated phishing websites.
 * @param {string} listId The ID of the UL element.
 */
function populatePhishingList(listId) {
    // Implementation will be added later when needed for dashboard.html
    console.log(`Placeholder: populatePhishingList called for list ${listId}`);
    // Example:
    // const listElement = document.getElementById(listId);
    // if (listElement) listElement.innerHTML = '<li class="list-item text-gray-500">Data loading...</li>';
}


// --- Global Initialization ---
console.log("script.js loaded: General page logic and Matrix background available.");

// Note: Specific initializations like initMatrixBackground are called
// from the inline script in the HTML files after DOMContentLoaded.
