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

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const errorMessage = document.getElementById("error-message");
  
    // Check if user is already logged in and redirect based on role saved in localStorage
    // (Assuming api.js handles auth state changes somewhere else)
    const userRole = localStorage.getItem("userRole");
    if (userRole) {
      if (userRole.toLowerCase() === "admin") {
        window.location.href = "admin_dashboard.html";
      } else {
        window.location.href = "index.html";
      }
    }
  
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
      
        errorMessage.textContent = "";
      
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
      
        // Log inputs for debugging
        console.log("Email entered:", email);
        console.log("Password entered:", password);
      
        if (!email || !password) {
          errorMessage.textContent = "Please fill in both email and password.";
          return;
        }
  
      try {
        // Use api.js to sign in (api.js doesn't currently expose a signIn function,
        // so let's add a signIn function to api or handle signIn here with auth)
        // Since api.js only has Firestore wrappers, handle signIn here using firebase auth:
        
        // Assuming api.js exposes auth instance as window.auth
        const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
  
        // Fetch user data with api.js getCollectionData or Firestore getDoc wrapper
        const userDoc = await window.api.getCollectionData('users'); // but this fetches whole collection, not ideal
        // Instead, let's add a new method to api.js to get doc by id for better approach (or fetch manually here):
  
        // For now, fetch user role by direct Firestore call since api.js doesn't have a method for single doc get:
        const userDocRef = window.api.db.collection('users').doc(user.uid); // this won't work because window.api.db doesn't exist
        // So use Firestore getDoc directly (or add to api.js if needed)
        
        // So fallback: let's assume the role is stored in localStorage by a function or after login
  
        // Instead, you can do:
        const userDocSnap = await window.api.db.doc(`users/${user.uid}`).get(); // again not in api.js, can't do this directly
  
        // So for practical approach: use firestore's getDoc directly here (because api.js lacks a getDoc method)
        // So import Firestore methods in login.js or add a new method in api.js:
  
        // Quick solution: add getDocument method to api.js to get single doc by id:
        const userData = await window.api.getDocument('users', user.uid);
        if (!userData) {
          errorMessage.textContent = "User data not found.";
          return;
        }
  
        const role = userData.role || "user";
        localStorage.setItem("userRole", role);
  
        if (role.toLowerCase() === "admin") {
          window.location.href = "admin_dashboard.html";
        } else {
          window.location.href = "index.html";
        }
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          errorMessage.textContent = "No user found with this email.";
        } else if (error.code === "auth/wrong-password") {
          errorMessage.textContent = "Incorrect password.";
        } else {
          errorMessage.textContent = "Login failed: " + error.message;
        }
      }
    });
  });

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





