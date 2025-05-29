import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBS4W6MddWuU3lxotE9peb7RsI_QJzIzaI", // Replace with your actual API key
    authDomain: "sarawak-forestry-database.firebaseapp.com",
    // databaseURL: "https://sarawak-forestry-database-default-rtdb.asia-southeast1.firebasedatabase.app", // For Realtime Database
    projectId: "sarawak-forestry-database",
    storageBucket: "sarawak-forestry-database.appspot.com", // Correct format is typically project-id.appspot.com
    messagingSenderId: "979838017340",
    appId: "1:979838017340:web:a31113d00fafcb0bcb4839",
    measurementId: "G-KXNY4PT4VY"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    // Moved the showError function to be accessible by both handlers
    const errorBox = document.getElementById("error-message");
    function showError(message) {
        if (errorBox) {
            errorBox.textContent = message;
            errorBox.style.color = "red";
        } else {
            alert(message);
        }
    }

    if (window.location.pathname.includes("login.html")) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        const { role, name, status } = userData;

                        // === Check for disabled status ===
                        if (status === 'disabled') {
                            console.warn(`User ${user.uid} (${name}) is disabled. Preventing login.`);
                            await signOut(auth);
                            localStorage.removeItem("userRole");
                            localStorage.removeItem("userName");
                            localStorage.removeItem("userUID");
                            showError("Your account has been disabled. Please contact an administrator.");
                            // Optionally redirect to login page if not already there, though onAuthStateChanged might run on other pages too.
                            // If on login.html, they just stay. If on another page, this would kick them out.
                            // if (window.location.pathname !== "/login.html" && window.location.pathname !== "/") {
                            //     window.location.href = "login.html";
                            // }
                            return;
                        }
                        // === End disabled status check ===

                        localStorage.setItem("userName", name);
                        localStorage.setItem("userRole", role);
                        localStorage.setItem("userUID", user.uid);
                        console.log('Auth state change: User already logged in. Role:', role, 'Name:', name);

                        if (role === "Admin") {
                            window.location.href = "admin-dashboard/admin-dashboard.html";
                        } else if (role === "Park Guide") {
                            window.location.href = "course-dashboard/course-dashboard.html";
                        } else {
                            // Default redirect for other roles or if role is undefined but user doc exists
                            window.location.href = "index.html"; 
                        }
                    } else {
                        console.warn("No user document found for already logged-in user. Clearing session.");
                        await signOut(auth);
                        localStorage.removeItem("userRole");
                        localStorage.removeItem("userName");
                        localStorage.removeItem("userUID");
                        // showError("User data not found. Please log in again."); // Optional message
                    }
                } catch (err) {
                    console.error("Error fetching user data on auth state change:", err.message);
                    await signOut(auth); // Sign out on error
                    localStorage.removeItem("userRole");
                    localStorage.removeItem("userName");
                    localStorage.removeItem("userUID");
                    showError("An error occurred during login. Please try again.");
                }
            }
        });
    }

    const submitButton = document.getElementById("submit");

    if (submitButton) {
        submitButton.addEventListener("click", (event) => {
            event.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            
            if (errorBox) errorBox.textContent = ""; // Clear previous error messages

            if (!email || !password) {
                showError("Please fill in both email and password.");
                return;
            }

            signInWithEmailAndPassword(auth, email, password)
                .then(async (userCredential) => {
                    const user = userCredential.user;
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        const { role, name, status } = userData;

                        // === Check for disabled status ===
                        if (status === 'disabled') {
                            console.warn(`User ${user.uid} (${name}) is disabled. Preventing login from form.`);
                            await signOut(auth);
                            localStorage.removeItem("userRole");
                            localStorage.removeItem("userName");
                            localStorage.removeItem("userUID");
                            showError("Your account has been disabled. Please contact an administrator.");
                            return;
                        }
                        // === End disabled status check ===

                        localStorage.setItem("userName", name);
                        localStorage.setItem("userRole", role);
                        localStorage.setItem("userUID", user.uid);
                        console.log('Login form success. Role:', role, 'Name:', name);

                        alert("Login successful!");
                        if (role === "Admin") {
                            window.location.href = "admin-dashboard/admin-dashboard.html";
                        } else if (role === "Park Guide") {
                            window.location.href = "course-dashboard/course-dashboard.html";
                        } else {
                            window.location.href = "index.html";
                        }
                    } else {
                        showError("User data not found in Firestore."); // Changed message for clarity
                        await signOut(auth);
                        localStorage.removeItem("userRole");
                        localStorage.removeItem("userName");
                        localStorage.removeItem("userUID");
                    }
                })
                .catch((error) => {
                    const errorCode = error.code;
                    if (errorCode === "auth/user-not-found" || errorCode === "auth/invalid-credential" || errorCode === "auth/wrong-password" || errorCode === "auth/invalid-email") {
                        showError("Invalid email or password.");
                    } else {
                        showError("Login failed: " + error.message);
                    }
                    console.error("Login error:", error);
                });
        });
    }

    // This onAuthStateChanged is for managing login/logout button visibility primarily
    // The one inside `if (window.location.pathname.includes("login.html"))` handles auto-login/redirect logic
    onAuthStateChanged(auth, (user) => {
        const loginLink = document.getElementById("login-link");
        const logoutBtn = document.getElementById("logout-btn");

        if (user) {
            // Ensure userRole and userName are from localStorage, which should be set after status check
            const userRole = localStorage.getItem("userRole");
            const userName = localStorage.getItem("userName");
            // console.log('Global Auth state: Logged in as:', userRole, 'User:', userName); // Can be noisy

            if (loginLink) loginLink.style.display = "none";
            if (logoutBtn) logoutBtn.style.display = "block";

            if (logoutBtn) {
                // Ensure event listener is not added multiple times if onAuthStateChanged fires more than once
                if (!logoutBtn.hasAttribute('data-listener-attached')) {
                    logoutBtn.addEventListener('click', (event) => {
                        event.preventDefault();
                        signOut(auth)
                            .then(() => {
                                localStorage.removeItem("userRole");
                                localStorage.removeItem("userName");
                                localStorage.removeItem("userUID");
                                alert("You have logged out.");
                                window.location.href = "login.html";
                            })
                            .catch((error) => {
                                console.error("Logout failed:", error.message);
                            });
                    });
                    logoutBtn.setAttribute('data-listener-attached', 'true');
                }
            }
        } else {
            if (loginLink) loginLink.style.display = "block";
            if (logoutBtn) {
                logoutBtn.style.display = "none";
                logoutBtn.removeAttribute('data-listener-attached'); // Clean up listener flag
            }
        }
    });

    // Forgot password modal logic (remains unchanged)
    const forgotPasswordLink = document.getElementById("forgot-password-link");
    const forgotPasswordModal = document.getElementById("forgot-password-modal");
    const closeForgotPassword = document.getElementById("close-forgot-password");
    const sendResetBtn = document.getElementById("send-reset");

    if(forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", (e) => {
            e.preventDefault();
            if(forgotPasswordModal) forgotPasswordModal.style.display = "flex";
        });
    }
    if(closeForgotPassword) {
        closeForgotPassword.addEventListener("click", () => {
            if(forgotPasswordModal) forgotPasswordModal.style.display = "none";
            clearResetFields();
        });
    }
    if(sendResetBtn) {
        sendResetBtn.addEventListener("click", async () => {
            const emailInput = document.getElementById("reset-email");
            const message = document.getElementById("reset-message");
            const error = document.getElementById("reset-error");
            
            if(message) message.textContent = "";
            if(error) error.textContent = "";

            try {
                await sendPasswordResetEmail(auth, emailInput.value.trim());
                if(message) message.textContent = "Reset email sent. Check your inbox.";
                if(emailInput) emailInput.value = "";
            } catch (err) {
                if(error) error.textContent = err.message;
            }
        });
    }
});

function clearResetFields() { // Make sure this is globally accessible or defined where needed
    const emailInput = document.getElementById("reset-email");
    const message = document.getElementById("reset-message");
    const error = document.getElementById("reset-error");
    if(emailInput) emailInput.value = "";
    if(message) message.textContent = "";
    if(error) error.textContent = "";
}

