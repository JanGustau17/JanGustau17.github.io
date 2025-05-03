
// js/data.js

/**
 * ======================================
 * SIMULATED DATA STORAGE & GENERATION
 * ======================================
 * Handles mock user accounts using localStorage and generates
 * fake data for dashboard elements.
 */

// --- Simulated User Account Storage (Using localStorage) ---

const SIMULATED_USERS_KEY = 'neuroshield_sim_users_v1'; // Key for localStorage

/**
 * Retrieves the simulated user data object from localStorage.
 * Initializes with a default user if no data exists.
 * WARNING: localStorage is insecure for sensitive data in real applications.
 * @returns {object} The object containing user data (e.g., { 'username': { email, passwordHash, fullName } }).
 */
function getSimulatedUsers() {
    const usersJson = localStorage.getItem(SIMULATED_USERS_KEY);
    // Define a default user for initial setup or if storage is corrupted
    const defaultUsers = {
         // Example user: username is key (lowercase recommended)
         'admin': {
            fullName: "Admin User",
            email: "admin@neuroshield.io",
            // IMPORTANT: Store a HASH, not plain text, even in simulation!
            passwordHash: simpleHash("password123") // Use the simple hash function below
        }
    };

    try {
        const users = usersJson ? JSON.parse(usersJson) : defaultUsers;
        // Basic validation: Ensure it's a non-null object
        if (typeof users === 'object' && users !== null) {
            return users;
        } else {
            console.warn("Invalid user data found in localStorage, reverting to default.");
            // Attempt to fix localStorage by saving the default users
            saveSimulatedUsers(defaultUsers);
            return defaultUsers;
        }
    } catch (e) {
        console.error("Error parsing users from localStorage:", e);
        console.warn("Reverting to default users due to parsing error.");
        // Attempt to fix localStorage
        saveSimulatedUsers(defaultUsers);
        return defaultUsers; // Fallback to default on error
    }
}

/**
 * Saves the provided user data object to localStorage.
 * WARNING: localStorage is insecure for sensitive data in real applications.
 * @param {object} users - The user data object to save.
 */
function saveSimulatedUsers(users) {
    try {
        // Ensure we are saving a valid object
        if (typeof users === 'object' && users !== null) {
            localStorage.setItem(SIMULATED_USERS_KEY, JSON.stringify(users));
             // console.log("Simulated users saved to localStorage."); // Can be noisy
        } else {
            console.error("Attempted to save invalid user data (not an object).");
        }
    } catch (e) {
        console.error("Error saving users to localStorage:", e);
        // Consider potential quota exceeded errors
        if (e.name === 'QuotaExceededError') {
            alert("Could not save user data: LocalStorage quota exceeded. Please clear some site data.");
        }
    }
}

// --- Simple (INSECURE!) Hashing Function ---
// IMPORTANT: DO NOT USE THIS FOR REAL-WORLD PASSWORD STORAGE.
// It's only here to demonstrate the *concept* of hashing passwords
// instead of storing plain text, even in this simulation.
// Use libraries like bcrypt in a real backend.
function simpleHash(str) {
    let hash = 0;
    if (typeof str !== 'string' || str.length === 0) return "sim_invalid_hash"; // Handle empty or non-string input
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char; // Basic bitwise operation
        hash |= 0; // Convert to 32bit integer (ensures consistent behaviour)
    }
    // Add a prefix to distinguish it and convert negative results to positive hex
    return "sim_hash_" + (hash >>> 0).toString(16); // Use unsigned right shift before hex conversion
}


// --- Simulated Threat Data Generation ---

/**
 * Generates slightly randomized numbers for the dashboard's live stats.
 * @returns {object} Object with keys like threatsDetected, phishingCampaigns, etc.
 */
function getSimulatedThreatStats() {
    // Define base numbers and add some random fluctuation
    const baseThreats = 85000 + Math.floor(Math.random() * 15000);
    const basePhishing = 750 + Math.floor(Math.random() * 250);
    const baseDeepfakes = 80 + Math.floor(Math.random() * 40);
    const baseNetworks = 1200 + Math.floor(Math.random() * 150);

    // Introduce slight random changes to simulate live updates
    return {
        threatsDetected: baseThreats + Math.floor(Math.random() * 600 - 300), // +/- 300
        phishingCampaigns: basePhishing + Math.floor(Math.random() * 20 - 10), // +/- 10
        deepfakesIntercepted: baseDeepfakes + Math.floor(Math.random() * 10 - 5), // +/- 5
        networksSecured: baseNetworks + Math.floor(Math.random() * 10 - 3), // Mostly increasing or stable
    };
}

/**
 * Generates data formatted for the Chart.js scam types chart.
 * @returns {object} A Chart.js data object { labels: [], datasets: [{...}] }.
 */
function getSimulatedScamData() {
    // Data for Chart.js (e.g., for a bar or doughnut chart)
    const labels = [
        'AI Spear Phishing',
        'Ransomware (AI Evasion)',
        'CEO Fraud (Impersonation)',
        'Voice Deepfake (Vishing)',
        'Video Deepfake (Compromise)',
        'AI Credential Stuffing',
        'Synthetic ID Fraud'
    ];
    const data = [
        Math.floor(Math.random() * 400 + 180), // Phishing
        Math.floor(Math.random() * 150 + 60),  // Ransomware
        Math.floor(Math.random() * 250 + 90),  // Impersonation
        Math.floor(Math.random() * 70 + 30),   // Voice Deepfake
        Math.floor(Math.random() * 40 + 15),   // Video Deepfake
        Math.floor(Math.random() * 180 + 80),  // Credential Stuffing
        Math.floor(Math.random() * 100 + 40)   // Synthetic ID
    ];
    const backgroundColors = [ // Neon palette
        'rgba(0, 255, 204, 0.7)', // Teal
        'rgba(255, 77, 77, 0.7)',  // Red
        'rgba(255, 255, 102, 0.7)',// Yellow
        'rgba(173, 51, 255, 0.7)', // Purple
        'rgba(51, 153, 255, 0.7)', // Blue
        'rgba(255, 165, 0, 0.7)',  // Orange
        'rgba(255, 105, 180, 0.7)' // Pink
    ];
    const borderColors = backgroundColors.map(color => color.replace('0.7', '1')); // Solid border

    return {
        labels: labels,
        datasets: [{
            label: 'Detected Incidents (Simulated Week)',
            data: data,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1,
            // Options specific to chart type can be added here or in charts.js
             barThickness: 'flex',
             maxBarThickness: 40
        }]
    };
}

/**
 * Provides a list of simulated high-risk AI-related phishing URLs.
 * @param {number} [count=10] - The number of URLs to return.
 * @returns {string[]} An array of simulated URL strings.
 */
function getSimulatedPhishingList(count = 10) {
    // Larger list of plausible-looking fake URLs
    const simulatedPhishingSites = [
        "secure-login-update.com/microsoft365-reactivate",
        "amazon-prime-rewards-claim.net/verify-account-details",
        "wellsfargo-securityalert.org/auth-id-confirm",
        "appleid-recovery-session.info/signin-lock-resolve",
        "paypal-transaction-dispute-resolve.co/login-secure-area",
        "google-account-verification-required.xyz/prompt-continue",
        "chasebank-online-services-auth.com/login?session=expired",
        "netflix-subscription-update-needed.biz/payment-details-confirm",
        "irs-taxrefund-onlineclaim.us/verify-identity-secure",
        "facebook-security-checkup-required.me/login-checkpoint",
        "bankofamerica-resolve-issue.site/online-banking-verify",
        "docusign-secure-document-view.online/auth-view-pending",
        "dropbox-storage-limit-exceeded.info/upgrade-account",
        "linkedin-profile-view-notification.co/view-recent",
        "yourbank-unusual-activity-detected.org/verify-login"
    ];

    // Shuffle the array randomly using Fisher-Yates (or simpler sort)
    const shuffled = simulatedPhishingSites.sort(() => 0.5 - Math.random());

    // Return the requested number of items
    return shuffled.slice(0, count);
}


// --- Script Load Confirmation ---
console.log("data.js loaded: Simulated data functions and storage helpers available.");
// console.log("Default user hash (password123):", simpleHash("password123")); // For debugging the hash
// console.log("Initial simulated users:", getSimulatedUsers()); // Log initial users
