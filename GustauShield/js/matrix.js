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
    const matrixChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()*&^%+-=<>[]{}|"; // Adjusted char set
    let animationIntervalId = null;

    function setup() {
        // Debounce resize event slightly
        let resizeTimeout;
        const handleResize = () => {
             canvas.width = window.innerWidth;
             canvas.height = window.innerHeight;
             columns = Math.floor(canvas.width / fontSize);
             // Ensure drops array is resized correctly, maintaining positions if possible
             const newDrops = Array(columns);
             for(let i=0; i<columns; i++) {
                  // Start drops at random heights initially or after resize makes array longer
                 newDrops[i] = (drops && drops[i] !== undefined && i < drops.length) ? drops[i] : Math.floor(Math.random() * (canvas.height / fontSize));
             }
             drops = newDrops;
             ctx.font = `${fontSize}px monospace`;
             console.log(`Matrix resized: ${canvas.width}x${canvas.height}, Columns: ${columns}`);
        };

        // Clear previous resize listener if any
        window.removeEventListener('resize', setup); // Use setup directly or a debounced handler
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 100); // Adjust debounce delay (ms)
        });

        handleResize(); // Initial setup
    }

    function draw() {
        // Use body background color with low alpha for fading effect
        ctx.fillStyle = "rgba(10, 10, 26, 0.06)"; // Match dark-bg-start color from CSS
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < drops.length; i++) {
            const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
            const yPos = drops[i] * fontSize;

            // Rainbow Logic: Calculate Hue based on Y position
            const hue = (yPos * 0.3) % 360;
            ctx.fillStyle = `hsl(${hue}, 100%, 65%)`; // HSL: Hue, Saturation, Lightness

            ctx.fillText(text, i * fontSize, yPos);

            // Reset drop randomly when it goes off-screen
            if (yPos > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    setup(); // Initial setup

    if (animationIntervalId) clearInterval(animationIntervalId);
    // Adjust interval for desired speed (milliseconds)
    animationIntervalId = setInterval(draw, 55);

    console.log("Rainbow Matrix background initialized.");
}
