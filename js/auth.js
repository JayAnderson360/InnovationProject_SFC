import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase config for sarawak-forestry-database
const firebaseConfig = {
    apiKey: "AIzaSyBS4W6MddWuU3lxotE9peb7RsI_QJzIzaI", // Replace with your actual API key for sarawak-forestry-database
    authDomain: "sarawak-forestry-database.firebaseapp.com",
    projectId: "sarawak-forestry-database",
    storageBucket: "sarawak-forestry-database.appspot.com", // Correct format is typically project-id.appspot.com
    messagingSenderId: "979838017340",
    appId: "1:979838017340:web:a31113d00fafcb0bcb4839",
    measurementId: "G-KXNY4PT4VY"
};

// Initialize Firebase app (ensure it's only initialized once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

// Authentication state check and navbar update
async function checkAuth() { // Made async to use await
    const loginLink = document.getElementById('login-link'); // Assuming you have a Login link with this ID
    const navLinksContainer = document.querySelector('.nav-links'); // Get the ul containing nav links

    // Hide default login link initially if it exists
    if (loginLink) {
        loginLink.style.display = 'none';
    }

    onAuthStateChanged(auth, async (user) => {
        const existingDropdown = document.querySelector('.dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        if (user) {
            console.log("User is logged in:", user.email);

            try {
                // Fetch user data from Firestore
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);

                let userRole = null;
                let userName = null;
                let profilePictureUrl = 'Resources/Images/ProfilePicture/defaultProfile.jpeg';

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    userName = userData.name;
                    userRole = userData.role;
                    if (userData.profilePictureUrl) {
                        profilePictureUrl = userData.profilePictureUrl;
                    }
                    console.log("User Role from Firestore:", userRole);
                    console.log("Profile Picture URL from Firestore:", profilePictureUrl);
                    localStorage.setItem("userName", userName);
                    localStorage.setItem("userRole", userRole);
                } else {
                    console.warn("No user document found for UID:", user.uid);
                    // If no user doc, default to 'General User' role and default picture
                    userRole = 'General User';
                    localStorage.setItem("userRole", userRole); // Store default role
                }

                // Create and add the dropdown element
                if (navLinksContainer) {
                    const dropdown = document.createElement('li');
                    dropdown.classList.add('dropdown');

                    let dropdownMenuHTML = `
                        <div class="dropdown-toggle">
                            <img src="${profilePictureUrl}" alt="Profile Picture">
                        </div>
                        <div class="dropdown-menu">
                    `;

                    // Add role-specific links
                    if (userRole === "Park Guide") {
                        dropdownMenuHTML += `
                            <a href="userprofile.html">Profile</a>
                            <a href="course-dashboard/course-dashboard.html">Courses</a>
                        `;
                    } else if (userRole === "Admin") {
                         dropdownMenuHTML += `
                            <a href="admin-dashboard/admin-dashboard.html">Dashboard</a>
                            <a href="course-dashboard/course-dashboard.html">Courses</a>
                        `;
                    } else { // Default for 'General User' or unknown roles
                         dropdownMenuHTML += `
                            <a href="userprofile.html">Profile</a>
                        `;
                    }

                    // Add logout link for all logged-in users
                    dropdownMenuHTML += `
                            <a href="#" id="navbar-logout-btn">Logout</a>
                        </div>
                    `;

                    dropdown.innerHTML = dropdownMenuHTML;

                    // Find and replace the 'Login' link or append if not found
                    const loginLi = navLinksContainer.querySelector('li a[href="login.html"]');
                    if (loginLi && loginLi.parentElement) {
                         navLinksContainer.replaceChild(dropdown, loginLi.parentElement);
                    } else {
                        // If no login link found, append dropdown (e.g., on pages without a default login link)
                        // Find the last list item to append the dropdown after it
                        const lastLi = navLinksContainer.lastElementChild;
                        if (lastLi) {
                             lastLi.after(dropdown);
                        } else {
                             // If the list is empty, just append
                             navLinksContainer.appendChild(dropdown);
                        }
                    }

                    // Add click listener to the dropdown toggle to show/hide the menu
                    const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
                    if (dropdownToggle) {
                        dropdownToggle.addEventListener('click', (event) => {
                            event.stopPropagation(); // Prevent the document click listener from immediately closing it
                            dropdown.classList.toggle('show');
                        });
                    }

                    // Attach logout listener to the new button
                    const navbarLogoutBtn = dropdown.querySelector('#navbar-logout-btn');
                    if (navbarLogoutBtn) {
                        navbarLogoutBtn.addEventListener('click', async (e) => { // Made async
                            e.preventDefault();
                            try {
                                await signOut(auth);
                                localStorage.clear(); // Clear local storage upon logout
                                alert("You have logged out.");
                                window.location.href = "login.html";
                            } catch (error) {
                                console.error("Error during logout:", error.message);
                                alert("Logout failed: " + error.message);
                            }
                        });
                    }
                }

            } catch (error) {
                console.error("Error fetching user data:", error);
                // Fallback if Firestore fetch fails - perhaps show a generic logged-in state without role details
                if (navLinksContainer) {
                     const dropdown = document.createElement('li');
                    dropdown.classList.add('dropdown');
                    dropdown.innerHTML = `
                        <div class="dropdown-toggle">
                            <img src="Resources/Images/ProfilePicture/defaultProfile.jpeg" alt="Profile Picture">
                        </div>
                        <div class="dropdown-menu">
                            <a href="#" id="navbar-logout-btn">Logout</a>
                        </div>
                    `;
                     const loginLi = navLinksContainer.querySelector('li a[href="login.html"]');
                    if (loginLi && loginLi.parentElement) {
                         navLinksContainer.replaceChild(dropdown, loginLi.parentElement);
                    } else {
                        const lastLi = navLinksContainer.lastElementChild;
                        if (lastLi) {
                             lastLi.after(dropdown);
                        } else {
                             navLinksContainer.appendChild(dropdown);
                        }
                    }
                     const navbarLogoutBtn = dropdown.querySelector('#navbar-logout-btn');
                    if (navbarLogoutBtn) {
                        navbarLogoutBtn.addEventListener('click', async (e) => { // Made async
                            e.preventDefault();
                             try {
                                await signOut(auth);
                                localStorage.clear(); // Clear local storage upon logout
                                alert("You have logged out.");
                                window.location.href = "login.html";
                            } catch (error) {
                                console.error("Error during logout:", error.message);
                                alert("Logout failed: " + error.message);
                            }
                        });
                    }
                }
            }

        } else {
            console.log("No user is logged in");
            // Show login link if no user is logged in and it was hidden
             if (loginLink) {
                loginLink.style.display = 'block';
             }
            // Remove dropdown if it exists
             const dropdown = document.querySelector('.dropdown');
             if (dropdown) {
                 dropdown.remove();
             }
        }
    });
}

// Call the checkAuth function when the document is ready
document.addEventListener('DOMContentLoaded', checkAuth);

// Close the dropdown if the user clicks outside of it
document.addEventListener('click', (event) => {
    const openDropdown = document.querySelector('.dropdown.show');
    if (openDropdown && !openDropdown.contains(event.target)) {
        openDropdown.classList.remove('show');
    }
});


