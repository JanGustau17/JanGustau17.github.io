
// js/matrix.js
/**
 * Creates a rainbow Matrix-style animation on a canvas element.
 * @param {string} canvasId The ID of the canvas element.
 */
function initRainbowMatrix(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Matrix Error: Canvas element with ID "${canvasId}" not found.`);
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error(`Matrix Error: Could not get 2D context for canvas "${canvasId}".`);
        return;
    }

    let columns;
    let drops = [];
    const fontSize = 14;
    // Extended character set for visual variety
    const matrixChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()*&^%+-=<>[]{}|;:/?.<>{}[]|";
    let animationIntervalId = null; // Store interval ID

    // Function to set canvas size and initialize drops
    function setup() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        columns = Math.floor(canvas.width / fontSize);
        drops = []; // Reset drops array
        for (let i = 0; i < columns; i++) {
            // Start drops at random heights for immediate visual effect
            drops[i] = Math.floor(Math.random() * (canvas.height / fontSize));
        }
        ctx.font = `${fontSize}px monospace`; // Set font once after resize
        console.log(`Matrix resized: ${canvas.width}x${canvas.height}, Columns: ${columns}`);
    }

    // Function to draw a single frame
    function draw() {
        // Use the body background color with low alpha for fading effect
        // Assumes body background is set via CSS
        ctx.fillStyle = "rgba(10, 10, 26, 0.06)"; // Match dark-bg-start color
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < drops.length; i++) {
            const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
            const yPos = drops[i] * fontSize;

            // Calculate Hue based on Y position, cycling through 360 degrees
            // Multiplier (0.3) controls color change speed down the screen
            const hue = (yPos * 0.3) % 360;
            // Use HSL: Full Saturation (100%), Adjusted Lightness (60-70%)
            ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;

            ctx.fillText(text, i * fontSize, yPos);

            // Reset drop randomly when it goes off-screen
            if (yPos > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    // Initial setup
    setup();

    // Clear any existing interval before starting a new one
    if (animationIntervalId) {
        clearInterval(animationIntervalId);
    }
    // Start the animation loop
    animationIntervalId = setInterval(draw, 55); // Adjust interval (milliseconds) for speed

    // Re-setup on window resize
    window.addEventListener('resize', setup);

    console.log("Rainbow Matrix background initialized.");
}
