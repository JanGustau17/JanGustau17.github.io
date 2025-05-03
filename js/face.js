// js/face.js

/**
 * ======================================
 * AI FACE CANVAS LOGIC
 * ======================================
 */

// --- Module-level variables ---
let faceCanvas, faceCtx;                  // Canvas element and context
let facePoints = [];                      // Array storing {x, y, type?, side?} for face structure
let mousePos = { x: 0, y: 0 };            // Smoothed mouse position relative to canvas center
let targetMousePos = { x: 0, y: 0 };      // Actual mouse position relative to canvas center
let centerPos = { x: 0, y: 0 };           // Canvas center coordinates
let isIdle = false;                       // Flag for idle state
let idleTimer = null;                     // Timer ID for idle detection
const IDLE_TIMEOUT = 10000;               // 10 seconds threshold for idle
let animationFrameId = null;              // ID for the requestAnimationFrame loop
let blinkState = {                        // State for eye blinking
    open: true,
    timer: null,
    duration: 120, // ms for blink duration
    nextBlinkTimeout: null // Timer for scheduling next blink
};
let subtleMoveState = {                   // State for subtle idle movements
    active: false,
    targetX: 0, // Target offset X from center
    targetY: 0, // Target offset Y from center
    currentX: 0, // Current smoothed offset X
    currentY: 0, // Current smoothed offset Y
    speed: 0.015, // Smoothing speed for idle movement
    nextMoveTimeout: null // Timer for scheduling next movement
};

// --- Constants ---
const FACE_COLOR = '#00ffcc';             // Neon Teal for active state
const IDLE_COLOR = '#00aacc';             // Slightly different cyan/blue when idle
const BLINK_COLOR = '#ffffff';            // Bright white/teal for blink emphasis
const FACE_LINE_WIDTH = 1.5;
const FACE_SHADOW_BLUR = 10;
const MOUSE_LOOK_SENSITIVITY = 0.12;      // How much the face points shift towards the mouse
const MOUSE_SMOOTHING_FACTOR = 0.08;      // Smoothing for mouse follow (lower = smoother)


/**
 * Defines the geometric points that make up the AI face structure.
 * Coordinates are relative to the canvas center.
 * @param {number} canvasWidth - The width of the face canvas.
 * @param {number} canvasHeight - The height of the face canvas.
 */
function defineFacePoints(canvasWidth, canvasHeight) {
    const scale = Math.min(canvasWidth, canvasHeight) * 0.33; // Base size scaling factor

    // More detailed points for a slightly more complex wireframe look
    facePoints = [
        // Outer Head Shape (Simplified Hexagon/Circle)
        { x: 0, y: -scale * 1.1 },        // Top
        { x: -scale * 0.95, y: -scale * 0.5 }, // Top-Left
        { x: -scale * 0.95, y: scale * 0.5 },  // Bottom-Left
        { x: 0, y: scale * 1.1 },         // Bottom
        { x: scale * 0.95, y: scale * 0.5 },   // Bottom-Right
        { x: scale * 0.95, y: -scale * 0.5 },  // Top-Right

        // Eyes (Circles/Lines for blinking)
        { x: -scale * 0.4, y: -scale * 0.25, type: 'eye', side: 'left', radius: scale * 0.1 },
        { x: scale * 0.4, y: -scale * 0.25, type: 'eye', side: 'right', radius: scale * 0.1 },

        // Eyebrows (lines)
        { x: -scale * 0.6, y: -scale * 0.55, type: 'brow', side: 'left', endX: -scale * 0.2 },
        { x: scale * 0.2, y: -scale * 0.55, type: 'brow', side: 'right', endX: scale * 0.6 },

        // Nose (simple triangle)
        { x: 0, y: -scale * 0.05, type: 'nose' },
        { x: -scale * 0.1, y: scale * 0.25, type: 'nose' },
        { x: scale * 0.1, y: scale * 0.25, type: 'nose' },

        // Mouth (line - could be animated later)
        { x: -scale * 0.35, y: scale * 0.65, type: 'mouth' },
        { x: scale * 0.35, y: scale * 0.65, type: 'mouth' },

        // Optional: Inner details / structure lines
        { x: 0, y: -scale*0.1, type: 'detail', targetIndex: 0 }, // Connect nose top to head top
        { x: -scale*0.4, y: scale*0.9, type: 'detail', targetIndex: 3 }, // Connect chin area
        { x: scale*0.4, y: scale*0.9, type: 'detail', targetIndex: 3 }  // Connect chin area
    ];
    console.log("Face points defined.");
}

/**
 * Updates the target mouse position based on the mousemove event.
 * Resets idle state and timers.
 * @param {MouseEvent} event - The mouse move event.
 */
function updateMousePos(event) {
    if (!faceCanvas) return; // Don't run if canvas isn't initialized

    const rect = faceCanvas.getBoundingClientRect();
    // Calculate mouse position relative to canvas center
    targetMousePos.x = event.clientX - rect.left - centerPos.x;
    targetMousePos.y = event.clientY - rect.top - centerPos.y;

    // --- Reset Idle State ---
    if (isIdle) {
        console.log("Face no longer idle.");
        isIdle = false;
        // Stop subtle movement immediately
        subtleMoveState.active = false;
        // Reset current idle offsets smoothly back to 0 if needed, or just snap
        subtleMoveState.currentX = 0;
        subtleMoveState.currentY = 0;
        // Stop any scheduled idle actions
        clearTimeout(blinkState.nextBlinkTimeout);
        clearTimeout(subtleMoveState.nextMoveTimeout);
    }
    // Clear and reset the main idle detection timer
    clearTimeout(idleTimer);
    idleTimer = setTimeout(enterIdleState, IDLE_TIMEOUT);
}

/**
 * Handles the mouse leaving the canvas area.
 * Centers the target look position and potentially triggers idle sooner.
 */
function handleMouseOut() {
    // Smoothly return target look direction to center when mouse leaves
    targetMousePos.x = 0;
    targetMousePos.y = 0;

    // Optionally: Trigger idle state sooner after mouse out
    if (!isIdle) {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(enterIdleState, IDLE_TIMEOUT / 3); // Enter idle faster (e.g., after ~3 seconds)
    }
}

/**
 * Sets the face state to idle and triggers initial idle animations.
 */
function enterIdleState() {
    if(isIdle) return; // Already idle
    console.log("Face entering idle state.");
    isIdle = true;
    // Start the subtle movement loop
    triggerSubtleMovement();
    // Trigger an initial blink when becoming idle
    triggerBlink(true); // Pass true to indicate it's the first idle blink
}

/**
 * Triggers a blink animation for the eyes.
 * @param {boolean} [isFirstIdleBlink=false] - Flag if this is the first blink upon entering idle.
 */
function triggerBlink(isFirstIdleBlink = false) {
    if (!blinkState.open) return; // Don't trigger if already blinking

    blinkState.open = false;
    // console.log("Blink start"); // Can be noisy

    // Clear any previous blink closing timer
    clearTimeout(blinkState.timer);
    // Set timer to re-open eyes
    blinkState.timer = setTimeout(() => {
        blinkState.open = true;
        // console.log("Blink end");

        // If still idle, schedule the *next* random blink
        if (isIdle) {
            scheduleNextIdleBlink();
        }
    }, blinkState.duration);

     // If it's the *first* blink after becoming idle, schedule the next one sooner
     if (isFirstIdleBlink) {
         scheduleNextIdleBlink(1000, 2000); // Schedule next blink 1-2 seconds after first idle blink
     }
}

/**
 * Schedules the next blink to occur randomly while idle.
 * @param {number} [minDelay=2000] - Minimum delay in ms.
 * @param {number} [maxDelay=7000] - Maximum delay in ms.
 */
function scheduleNextIdleBlink(minDelay = 2000, maxDelay = 7000) {
    clearTimeout(blinkState.nextBlinkTimeout); // Clear previous schedule
    const nextBlinkDelay = Math.random() * (maxDelay - minDelay) + minDelay;
    // console.log(`Scheduling next blink in ${nextBlinkDelay.toFixed(0)} ms`);
    blinkState.nextBlinkTimeout = setTimeout(() => {
        if (isIdle) { // Double check if still idle before blinking
            triggerBlink();
        }
    }, nextBlinkDelay);
}


/**
 * Initiates or continues the subtle random movement while idle.
 */
function triggerSubtleMovement() {
    if (!isIdle) {
        subtleMoveState.active = false;
        return; // Exit if not idle
    }

    subtleMoveState.active = true;
    // Set a new random target offset (small values)
    const maxOffset = faceCanvas.width * 0.05; // Max move 5% of canvas width
    subtleMoveState.targetX = (Math.random() - 0.5) * 2 * maxOffset;
    subtleMoveState.targetY = (Math.random() - 0.5) * 2 * maxOffset;
    // console.log(`Subtle move target: (${subtleMoveState.targetX.toFixed(1)}, ${subtleMoveState.targetY.toFixed(1)})`);

    // --- Schedule the *next* trigger ---
    clearTimeout(subtleMoveState.nextMoveTimeout); // Clear previous schedule
    const nextMoveDelay = Math.random() * 4000 + 3000; // Next movement decision in 3-7 seconds
    subtleMoveState.nextMoveTimeout = setTimeout(() => {
         if (isIdle) { // Only trigger next if still idle
             triggerSubtleMovement();
         } else {
            subtleMoveState.active = false;
         }
    }, nextMoveDelay);
}


/**
 * The main drawing loop for the AI face, called via requestAnimationFrame.
 */
function drawAIFace() {
    if (!faceCtx || !faceCanvas) {
         console.error("Cannot draw face, canvas or context missing.");
         stopAIFaceAnimation(); // Stop the loop if canvas is gone
         return;
    }

    // --- Calculate smoothed mouse position (relative to center) ---
    mousePos.x += (targetMousePos.x - mousePos.x) * MOUSE_SMOOTHING_FACTOR;
    mousePos.y += (targetMousePos.y - mousePos.y) * MOUSE_SMOOTHING_FACTOR;

    // --- Calculate look-at offset ---
    const lookOffsetX = mousePos.x * MOUSE_LOOK_SENSITIVITY;
    const lookOffsetY = mousePos.y * MOUSE_LOOK_SENSITIVITY;

    // --- Handle subtle idle movement smoothing ---
    let idleOffsetX = 0;
    let idleOffsetY = 0;
    if (isIdle && subtleMoveState.active) {
        // Smoothly move current offset towards target offset
        subtleMoveState.currentX += (subtleMoveState.targetX - subtleMoveState.currentX) * subtleMoveState.speed;
        subtleMoveState.currentY += (subtleMoveState.targetY - subtleMoveState.currentY) * subtleMoveState.speed;
        idleOffsetX = subtleMoveState.currentX;
        idleOffsetY = subtleMoveState.currentY;
    } else {
         // If not actively moving subtly, smoothly return current offset to 0
         subtleMoveState.currentX += (0 - subtleMoveState.currentX) * subtleMoveState.speed * 2; // Faster return
         subtleMoveState.currentY += (0 - subtleMoveState.currentY) * subtleMoveState.speed * 2;
         idleOffsetX = subtleMoveState.currentX;
         idleOffsetY = subtleMoveState.currentY;
    }

    // --- Clear Canvas ---
    faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

    // --- Set Drawing Styles ---
    const currentColor = isIdle ? IDLE_COLOR : FACE_COLOR;
    faceCtx.strokeStyle = currentColor;
    faceCtx.fillStyle = currentColor;
    faceCtx.lineWidth = FACE_LINE_WIDTH;
    faceCtx.shadowColor = currentColor;
    faceCtx.shadowBlur = FACE_SHADOW_BLUR;

    // --- Draw Face Elements ---
    faceCtx.save(); // Save context state
    faceCtx.translate(centerPos.x, centerPos.y); // Move origin to canvas center

    // Helper to get final point coordinates including offsets
    const getPointPos = (p) => ({
        x: p.x + lookOffsetX + idleOffsetX,
        y: p.y + lookOffsetY + idleOffsetY
    });

    // -- Draw Head Outline --
    faceCtx.beginPath();
    let headPoints = facePoints.slice(0, 6); // Get first 6 points defined as outline
    let startPos = getPointPos(headPoints[0]);
    faceCtx.moveTo(startPos.x, startPos.y);
    for (let i = 1; i < headPoints.length; i++) {
        let pos = getPointPos(headPoints[i]);
        faceCtx.lineTo(pos.x, pos.y);
    }
    faceCtx.closePath();
    faceCtx.stroke();

    // -- Draw Eyes --
    let eyePoints = facePoints.filter(p => p.type === 'eye');
    eyePoints.forEach(p => {
        let pos = getPointPos(p);
        faceCtx.beginPath();
        if (blinkState.open) {
            // Draw open eye (circle)
            faceCtx.arc(pos.x, pos.y, p.radius, 0, Math.PI * 2);
            faceCtx.fillStyle = BLINK_COLOR; // Use distinct color for pupil/iris maybe?
            faceCtx.fill();
        } else {
            // Draw closed eye (line)
            faceCtx.moveTo(pos.x - p.radius, pos.y);
            faceCtx.lineTo(pos.x + p.radius, pos.y);
            faceCtx.strokeStyle = BLINK_COLOR; // Use blink color
            faceCtx.lineWidth = FACE_LINE_WIDTH * 1.5; // Make blink line slightly thicker
            faceCtx.stroke();
             faceCtx.lineWidth = FACE_LINE_WIDTH; // Reset line width
             faceCtx.strokeStyle = currentColor; // Reset color
        }
    });

     // -- Draw Eyebrows --
     let browPoints = facePoints.filter(p => p.type === 'brow');
     browPoints.forEach(p => {
         let startPos = getPointPos(p);
         // We need to calculate the end position relative to the start point's offset
         let endPos = {
             x: p.endX + lookOffsetX + idleOffsetX,
             y: p.y + lookOffsetY + idleOffsetY // Y position is the same as start
         };
         faceCtx.beginPath();
         faceCtx.moveTo(startPos.x, startPos.y);
         faceCtx.lineTo(endPos.x, endPos.y);
         faceCtx.stroke();
     });


    // -- Draw Nose --
    let nosePoints = facePoints.filter(p => p.type === 'nose');
    if (nosePoints.length >= 3) {
        faceCtx.beginPath();
        let pos0 = getPointPos(nosePoints[0]);
        let pos1 = getPointPos(nosePoints[1]);
        let pos2 = getPointPos(nosePoints[2]);
        faceCtx.moveTo(pos0.x, pos0.y);
        faceCtx.lineTo(pos1.x, pos1.y);
        faceCtx.lineTo(pos2.x, pos2.y);
        // Optional: connect back to top point for triangle?
        // faceCtx.lineTo(pos0.x, pos0.y);
        faceCtx.stroke();
    }

    // -- Draw Mouth --
    let mouthPoints = facePoints.filter(p => p.type === 'mouth');
     if (mouthPoints.length >= 2) {
        faceCtx.beginPath();
         let pos0 = getPointPos(mouthPoints[0]);
         let pos1 = getPointPos(mouthPoints[1]);
        faceCtx.moveTo(pos0.x, pos0.y);
        faceCtx.lineTo(pos1.x, pos1.y);
        faceCtx.stroke();
     }

     // -- Draw Detail Lines --
     let detailPoints = facePoints.filter(p => p.type === 'detail');
     detailPoints.forEach(p => {
         if (p.targetIndex !== undefined && facePoints[p.targetIndex]) {
            let startPos = getPointPos(p);
            let targetPos = getPointPos(facePoints[p.targetIndex]);
            faceCtx.beginPath();
            faceCtx.moveTo(startPos.x, startPos.y);
            faceCtx.lineTo(targetPos.x, targetPos.y);
            // Make detail lines fainter maybe?
            faceCtx.save();
            faceCtx.lineWidth = FACE_LINE_WIDTH * 0.7;
            faceCtx.strokeStyle = currentColor + '99'; // Add alpha transparency
            faceCtx.stroke();
            faceCtx.restore();
         }
     });


    faceCtx.restore(); // Restore context state (removes translate)

    // --- Request Next Frame ---
    // Store the ID so we can cancel it later
    animationFrameId = requestAnimationFrame(drawAIFace);
}

/**
 * Initializes the AI Face drawing on the specified canvas.
 * Sets up dimensions, defines points, adds listeners, and starts animation.
 * @param {string} canvasId The ID of the canvas element.
 */
function initAIFace(canvasId) {
    // Avoid re-initializing if already running on the same canvas
    if (animationFrameId && faceCanvas && faceCanvas.id === canvasId) {
        console.log("AI Face animation already running.");
        // Ensure it's not stuck in idle if mouse moved before init was called again
        if (!isIdle) {
             clearTimeout(blinkState.nextBlinkTimeout);
             clearTimeout(subtleMoveState.nextMoveTimeout);
        }
        return;
    }

    faceCanvas = document.getElementById(canvasId);
    if (!faceCanvas) {
        console.error(`AI Face canvas element with id "${canvasId}" not found.`);
        return;
    }
    faceCtx = faceCanvas.getContext('2d');

    // --- Set canvas dimensions ---
    // Use the dimensions defined in CSS or default
    const canvasWidth = faceCanvas.clientWidth || 280; // Match CSS width
    const canvasHeight = faceCanvas.clientHeight || 280; // Match CSS height
    faceCanvas.width = canvasWidth; // Set internal resolution
    faceCanvas.height = canvasHeight;
    centerPos.x = canvasWidth / 2;
    centerPos.y = canvasHeight / 2;

    // --- Define face geometry ---
    defineFacePoints(faceCanvas.width, faceCanvas.height);

    // --- Reset initial positions and states ---
    mousePos = { x: 0, y: 0 }; // Start centered
    targetMousePos = { x: 0, y: 0 };
    subtleMoveState.currentX = 0;
    subtleMoveState.currentY = 0;
    isIdle = false; // Start as not idle

    // --- Add Event Listeners ---
    // Use window for mousemove to track even outside canvas bounds
    window.removeEventListener('mousemove', updateMousePos); // Remove first to prevent duplicates
    window.addEventListener('mousemove', updateMousePos);

    // Use canvas for mouseout
    faceCanvas.removeEventListener('mouseout', handleMouseOut); // Remove first
    faceCanvas.addEventListener('mouseout', handleMouseOut);

    // --- Start Idle Timer ---
    clearTimeout(idleTimer); // Clear any previous timer
    idleTimer = setTimeout(enterIdleState, IDLE_TIMEOUT);

    // --- Start Animation ---
    stopAIFaceAnimation(); // Ensure any previous loop is stopped
    animationFrameId = requestAnimationFrame(drawAIFace);

    console.log("AI Face Initialized on canvas:", canvasId);
}

/**
 * Stops the AI face animation loop and clears associated timers.
 */
function stopAIFaceAnimation() {
     if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        console.log("AI Face animation stopped.");
    }
     // Clear all timers associated with face animations
     clearTimeout(idleTimer);
     clearTimeout(blinkState.timer);
     clearTimeout(blinkState.nextBlinkTimeout);
     clearTimeout(subtleMoveState.nextMoveTimeout);

     // Optional: Could clear the canvas here if needed
     // if (faceCtx) {
     //    faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
     // }
}

// --- Global Scope ---
console.log("face.js loaded: AI Face drawing functions available.");
