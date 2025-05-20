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
    if (window.location.pathname.includes("login.html")) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const { role } = userDocSnap.data();
                        if (role === "Admin") {
                            window.location.href = "admin-dashboard/admin-dashboard.html";
                        } else if (role === "Park Guide") {
                            window.location.href = "course-dashboard/course-dashboard.html";
                        } else {
                            window.location.href = "index.html";
                        }
                    } else {
                        console.warn("No user document found.");
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err.message);
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
            const errorBox = document.getElementById("error-message");

            if (errorBox) errorBox.textContent = "";

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
                        const { role } = userDocSnap.data();

                        localStorage.setItem("userRole", role);

                        alert("Login successful!");
                        // Redirect based on user role
                        if (role === "Admin") {
                            window.location.href = "admin-dashboard/admin-dashboard.html";
                        } else if (role === "Park Guide") {
                            window.location.href = "course-dashboard/course-dashboard.html";
                        } else {
                            window.location.href = "index.html";
                        }
                    } else {
                        showError("User role not found in Firestore.");
                    }
                })
                .catch((error) => {
                    const errorCode = error.code;
                    if (errorCode === "auth/user-not-found") {
                        showError("No user found with this email.");
                    } else if (errorCode === "auth/invalid-credential") {
                        showError("Invalid email or password format.");
                    } else {
                        showError("Login failed: " + error.message);
                    }
                });

            function showError(message) {
                if (errorBox) {
                    errorBox.textContent = message;
                    errorBox.style.color = "red";
                } else {
                    alert(message);
                }
            }
        });
    }

    onAuthStateChanged(auth, (user) => {
        const loginLink = document.getElementById("login-link");
        const logoutBtn = document.getElementById("logout-btn");

        if (user) {
            const userRole = localStorage.getItem("userRole");
            console.log('Logged in as:', userRole);

            if (loginLink) loginLink.style.display = "none";
            if (logoutBtn) logoutBtn.style.display = "block";

            if (logoutBtn) {
                logoutBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    signOut(auth)
                        .then(() => {
                            localStorage.removeItem("userRole");

                            alert("You have logged out.");
                            window.location.href = "login.html";
                        })
                        .catch((error) => {
                            console.error("Logout failed:", error.message);
                        });
                });
            }
        } else {
            if (loginLink) loginLink.style.display = "block";
            if (logoutBtn) logoutBtn.style.display = "none";
        }
    });
});


// Forgot password modal logic
const forgotPasswordLink = document.getElementById("forgot-password-link");
const forgotPasswordModal = document.getElementById("forgot-password-modal");
const closeForgotPassword = document.getElementById("close-forgot-password");
const sendResetBtn = document.getElementById("send-reset");

forgotPasswordLink.addEventListener("click", (e) => {
  e.preventDefault();
  forgotPasswordModal.style.display = "flex";
});

closeForgotPassword.addEventListener("click", () => {
  forgotPasswordModal.style.display = "none";
  clearResetFields();
});

sendResetBtn.addEventListener("click", async () => {
  const emailInput = document.getElementById("reset-email");
  const message = document.getElementById("reset-message");
  const error = document.getElementById("reset-error");
  
  message.textContent = "";
  error.textContent = "";

  try {
    await sendPasswordResetEmail(auth, emailInput.value.trim());
    message.textContent = "Reset email sent. Check your inbox.";
    emailInput.value = "";
  } catch (err) {
    error.textContent = err.message;
  }
});

function clearResetFields() {
  document.getElementById("reset-email").value = "";
  document.getElementById("reset-message").textContent = "";
  document.getElementById("reset-error").textContent = "";
}

