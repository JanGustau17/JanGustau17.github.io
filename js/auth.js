// js/auth.js

/**
 * ======================================
 * AUTHENTICATION LOGIC (SIMULATED)
 * ======================================
 * Handles user sign-up, sign-in, sign-out, and status checking
 * using simulated user data from data.js and localStorage.
 */

// Key used in localStorage to mark a user as logged in.
// The value stored will be the username (lowercase).
const LOGGED_IN_KEY = 'neuroshield_logged_in_user_v1';

/**
 * Attempts to register a new user.
 * @param {string} fullName - The user's full name.
 * @param {string} username - The desired username.
 * @param {string} email - The user's email address.
 * @param {string} password - The desired password.
 * @returns {{success: boolean, message: string}} Result object indicating success or failure.
 */
function signUp(fullName, username, email, password) {
    // --- Input Validation ---
    if (!fullName || !username || !email || !password) {
        console.error("Sign up failed: Missing required fields.");
        return { success: false, message: "All fields are required." };
    }
    // Basic email format check (not exhaustive)
    if (!/\S+@\S+\.\S+/.test(email)) {
         console.error("Sign up failed: Invalid email format.");
         return { success: false, message: "Please enter a valid email address." };
    }
     // Basic password length check (example)
     if (password.length < 8) {
          console.error("Sign up failed: Password too short.");
          return { success: false, message: "Password must be at least 8 characters long." };
     }

    // --- Check against existing users ---
    const users = getSimulatedUsers(); // Get current users from data.js helper
    const usernameLower = username.toLowerCase();
    const emailLower = email.toLowerCase();

    // Check if username already exists (case-insensitive)
    if (users[usernameLower]) {
        console.warn(`Sign up failed: Username "${username}" already exists.`);
        return { success: false, message: "Username already taken. Please choose another." };
    }

    // Check if email already exists (case-insensitive)
    const emailExists = Object.values(users).some(userData => userData.email.toLowerCase() === emailLower);
    if (emailExists) {
         console.warn(`Sign up failed: Email "${email}" already registered.`);
         return { success: false, message: "Email address is already registered." };
    }

    // --- Add New User ---
    console.log(`Attempting to sign up user: ${username}`);
    try {
        // Hash the password BEFORE storing
        const passwordHash = simpleHash(password); // Use the INSECURE hash from data.js

        // Add the new user entry (use lowercase username as the key)
        users[usernameLower] = {
            fullName: fullName.trim(), // Trim whitespace
            email: emailLower,
            passwordHash: passwordHash,
            createdAt: new Date().toISOString() // Add a timestamp (optional)
        };

        // Save the updated user list
        saveSimulatedUsers(users);

        console.log(`User "${username}" signed up successfully.`);
        return { success: true, message: "Sign up successful! You can now sign in." };

    } catch (error) {
        console.error("An unexpected error occurred during sign up:", error);
        return { success: false, message: "An internal error occurred. Please try again later." };
    }
}

/**
 * Attempts to log in a user.
 * @param {string} usernameOrEmail - The username or email entered by the user.
 * @param {string} password - The password entered by the user.
 * @returns {{success: boolean, message: string}} Result object indicating success or failure.
 */
function signIn(usernameOrEmail, password) {
    if (!usernameOrEmail || !password) {
        return { success: false, message: "Username/Email and Password are required." };
    }

    const users = getSimulatedUsers();
    const inputLower = usernameOrEmail.toLowerCase().trim();
    let foundUser = null;
    let foundUsername = null;

    // --- Find User ---
    // 1. Check if input matches a username key directly (case-insensitive)
    if (users[inputLower]) {
        foundUser = users[inputLower];
        foundUsername = inputLower;
    } else {
        // 2. If not found by username, iterate and check emails (case-insensitive)
        const userEntry = Object.entries(users).find(([uname, udata]) => udata.email.toLowerCase() === inputLower);
        if (userEntry) {
            foundUsername = userEntry[0]; // The key (username)
            foundUser = userEntry[1]; // The user data object
        }
    }

    // --- Validate Password ---
    if (foundUser && foundUsername) {
        // Hash the entered password using the SAME (insecure) hash function
        const enteredPasswordHash = simpleHash(password);

        // Compare the hash of the entered password with the stored hash
        if (foundUser.passwordHash === enteredPasswordHash) {
            // --- Sign in Successful ---
            localStorage.setItem(LOGGED_IN_KEY, foundUsername); // Store the logged-in username
            console.log(`User "${foundUsername}" signed in successfully.`);
            return { success: true, message: "Sign in successful!" };
        } else {
            // Password mismatch
            console.warn(`Sign in failed for "${foundUsername}": Incorrect password.`);
            return { success: false, message: "Incorrect username/email or password." };
        }
    } else {
        // User not found
        console.warn(`Sign in failed: User "${usernameOrEmail}" not found.`);
        return { success: false, message: "Incorrect username/email or password." };
    }
}

/**
 * Logs the current user out by removing the session marker from localStorage.
 */
function signOut() {
    localStorage.removeItem(LOGGED_IN_KEY);
    console.log("User signed out.");
    // Optionally, redirect to login page immediately after sign out
    // window.location.href = 'index.html';
}

/**
 * Checks if a user is currently marked as logged in.
 * @returns {boolean} True if a user session marker exists, false otherwise.
 */
function isLoggedIn() {
    // Checks for the existence of the key in localStorage
    return localStorage.getItem(LOGGED_IN_KEY) !== null;
}

/**
 * Gets the username of the currently logged-in user.
 * @returns {string | null} The logged-in username (lowercase) or null if not logged in.
 */
function getCurrentUser() {
     return localStorage.getItem(LOGGED_IN_KEY);
}


/**
 * Attaches event listeners to the Sign Up and Sign In forms
 * found in index.html to handle submissions.
 */
function handleAuthForms() {
    const signupForm = document.getElementById('signupForm');
    const signInForm = document.getElementById('signInForm');
    const signupErrorEl = document.getElementById('signupError');
    const signInErrorEl = document.getElementById('signInError');

    // --- Sign Up Form Listener ---
    if (signupForm && signupErrorEl) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Stop default browser form submission
            signupErrorEl.textContent = ''; // Clear previous errors
            signupErrorEl.classList.add('hidden'); // Hide error element

            // Get form data
            const formData = new FormData(signupForm);
            const fullName = formData.get('fullName');
            const username = formData.get('username');
            const email = formData.get('email');
            const password = formData.get('password');

            // Attempt sign up
            const result = signUp(fullName, username, email, password);

            if (result.success) {
                console.log("Sign up successful, switching to Sign In view.");
                signupForm.reset(); // Clear the form fields

                // Show success message briefly on the *Sign In* form's error area
                if (signInErrorEl) {
                    signInErrorEl.textContent = result.message;
                    signInErrorEl.classList.remove('hidden', 'text-red-500');
                    signInErrorEl.classList.add('text-green-500'); // Use green for success
                }

                // Switch the view (requires access to elements in index.html)
                // This relies on the showScreen function potentially being global or accessible.
                // Let's assume showScreen exists as defined in the index.html inline script.
                 if (typeof showScreen === 'function') {
                     const signInScreen = document.getElementById('signInScreen');
                     if (signInScreen) {
                        showScreen(signInScreen);
                     } else {
                        console.error("Cannot switch view: signInScreen element not found.");
                     }
                 } else {
                     console.error("Cannot switch view: showScreen function not found.");
                     // Fallback: Manual hide/show (less ideal)
                     // document.getElementById('signupScreen').style.display = 'none';
                     // document.getElementById('signInScreen').style.display = 'block';
                 }

            } else {
                // Show error message on sign up form
                signupErrorEl.textContent = result.message;
                signupErrorEl.classList.remove('hidden');
                signupErrorEl.classList.add('text-red-500'); // Ensure red for errors
            }
        });
    } else if (!signupForm) {
         console.warn("Signup form element not found for attaching listener.");
    } else if (!signupErrorEl) {
         console.warn("Signup error element not found.");
    }

    // --- Sign In Form Listener ---
     if (signInForm && signInErrorEl) {
        signInForm.addEventListener('submit', (e) => {
            e.preventDefault();
            signInErrorEl.textContent = ''; // Clear previous errors/messages
            signInErrorEl.classList.add('hidden');

            const formData = new FormData(signInForm);
            const usernameOrEmail = formData.get('usernameOrEmail');
            const password = formData.get('password');

            const result = signIn(usernameOrEmail, password);

            if (result.success) {
                console.log("Sign in successful, redirecting to dashboard...");
                signInForm.reset();
                // Redirect to the main dashboard page
                window.location.href = 'dashboard.html'; // <<< REDIRECTION HERE
            } else {
                 // Show error message on sign in form
                signInErrorEl.textContent = result.message;
                signInErrorEl.classList.remove('hidden');
                signInErrorEl.classList.add('text-red-500'); // Ensure red for errors
            }
        });
     } else if (!signInForm) {
         console.warn("Sign in form element not found for attaching listener.");
     } else if (!signInErrorEl) {
          console.warn("Sign in error element not found.");
     }
}

// --- Script Load Confirmation ---
console.log("auth.js loaded: Authentication functions available.");

// Example: Check login status on script load (useful for debugging)
// console.log("User currently logged in:", isLoggedIn(), "(User:", getCurrentUser(), ")");
