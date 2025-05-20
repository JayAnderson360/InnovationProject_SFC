import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { doc, getDoc, updateDoc, getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBS4W6MddWuU3lxotE9peb7RsI_QJzIzaI",
  authDomain: "sarawak-forestry-database.firebaseapp.com",
  projectId: "sarawak-forestry-database",
  storageBucket: "sarawak-forestry-database.appspot.com",
  messagingSenderId: "979838017340",
  appId: "1:979838017340:web:a31113d00fafcb0bcb4839",
  measurementId: "G-KXNY4PT4VY"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const nameField = document.getElementById('display-name');
const emailField = document.getElementById('display-email');
const roleField = document.getElementById('display-role');
const profileImg = document.getElementById('profile-img');

const editPopup = document.getElementById('editPopup');
const editBtn = document.getElementById('editProfileBtn');
const closeBtn = document.querySelector('.close-btn');
const profileForm = document.getElementById('profileForm');
const nameInput = document.getElementById('name');
const imgUrlInput = document.getElementById('imgUrl');

// Toggle Edit Popup
editBtn.addEventListener('click', () => editPopup.classList.remove('hidden'));
closeBtn.addEventListener('click', () => editPopup.classList.add('hidden'));
document.addEventListener('click', (e) => {
  if (e.target === editPopup) editPopup.classList.add('hidden');
});

// Auth Check
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();

      // Populate display
      nameField.textContent = userData.name || '';
      emailField.textContent = userData.email || '';
      roleField.textContent = userData.role || '';
      profileImg.src = userData.imgUrl || 'Resources/Images/ProfilePicture/defaultProfile.jpeg';

      // Pre-fill form
      nameInput.value = userData.name || '';
      imgUrlInput.value = userData.imgUrl || '';
    } else {
      alert("No user data found.");
    }

    // Submit update
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        await updateDoc(userRef, {
          name: nameInput.value.trim(),
          imgUrl: imgUrlInput.value.trim()
        });

        alert("Profile updated.");
        location.reload();
      } catch (err) {
        console.error("Update failed:", err);
        alert("Update failed.");
      }
    });

  } else {
    alert("You must be logged in.");
    window.location.href = "login.html";
  }
});
