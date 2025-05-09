import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAJn4_xPJTiurXnttyrfplp06sgJKNKefU",
  authDomain: "register-574e7.firebaseapp.com",
  projectId: "register-574e7",
  storageBucket: "register-574e7.appspot.com",
  messagingSenderId: "208987609770",
  appId: "1:208987609770:web:d0c8c3976989753ef24ed3"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// 🔄 Redirect logged-in users away from login.html based on role
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes("login.html")) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const { role } = userDocSnap.data();
                        if (role === "admin") {
                            window.location.href = "admin_dashboard.html";
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
                        const { role, extraFeatures = [] } = userDocSnap.data();

                        localStorage.setItem("userRole", role);
                        localStorage.setItem("extraFeatures", JSON.stringify(extraFeatures));

                        alert("Login successful!");
                        window.location.href = role === "admin" ? "admin_dashboard.html" : "index.html";
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
                            localStorage.removeItem("extraFeatures");

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


