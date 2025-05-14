import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAJn4_xPJTiurXnttyrfplp06sgJKNKefU",
    authDomain: "register-574e7.firebaseapp.com",
    projectId: "register-574e7",
    storageBucket: "register-574e7.appspot.com",
    messagingSenderId: "208987609770",
    appId: "1:208987609770:web:d0c8c3976989753ef24ed3"
};

// Initialize Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Authentication state check
function checkAuth() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userRole = localStorage.getItem("userRole");

    // Hide both buttons initially to prevent flashing
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';

    onAuthStateChanged(auth, (user) => {
        const navbar = document.querySelector('.main-nav');
        const navLinks = navbar ? navbar.querySelector('.nav-links') : null;

        if (user) {
            console.log("User is logged in:", user.email);
            console.log("User Role on page load:", userRole);

            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';

            // Only add dropdown if not already present
            if (navLinks && !document.querySelector('.dropdown') && userRole) {
                const dropdown = document.createElement('li');
                dropdown.classList.add('dropdown');

                let dropdownMenu = '';

                if (userRole === "ParkGuide") {
                    dropdownMenu = `
                        <div class="dropdown-toggle">
                            <img src="Resources/Images/logo.png" alt="Profile Icon" />
                        </div>
                        <div class="dropdown-menu">
                            <a href="courses.html">Courses</a>
                            <a href="guideprofile.html">Profile</a>
                            <a href="#" id="navbar-logout-btn">Logout</a>
                        </div>
                    `;
                } else if (userRole === "user") {
                    dropdownMenu = `
                        <div class="dropdown-toggle">
                            <img src="Resources/Images/logo.png" alt="Profile Icon" />
                        </div>
                        <div class="dropdown-menu">
                            <a href="#" id="navbar-logout-btn">Logout</a>
                        </div>
                    `;
                } else if (userRole === "admin") {
                    dropdownMenu = `
                        <div class="dropdown-toggle">
                            <img src="Resources/Images/logo.png" alt="Admin Icon" />
                        </div>
                        <div class="dropdown-menu">
                            <a href="index.html">Index</a>
                            <a href="admin_dashboard.html">Dashboard</a>
                            <a href="#" id="navbar-logout-btn">Logout</a>
                        </div>
                    `;
                }

                dropdown.innerHTML = dropdownMenu;
                navLinks.appendChild(dropdown);

                const navbarLogoutBtn = dropdown.querySelector('#navbar-logout-btn');
                if (navbarLogoutBtn) {
                    navbarLogoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        localStorage.clear(); // Clear local storage upon logout
                        signOut(auth).then(() => {
                            alert("You have logged out.");
                            window.location.href = "login.html";
                        }).catch((error) => {
                            console.error("Error during logout:", error.message);
                        });
                    });
                }
            }

        } else {
            console.log("No user is logged in");

            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';

            const dropdown = document.querySelector('.dropdown');
            if (dropdown) dropdown.remove();
        }
    });
}

// Call the checkAuth function when the document is ready
document.addEventListener('DOMContentLoaded', checkAuth);


