import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elements
const roleModal = document.getElementById("role-modal");
const parkGuideBtn = document.getElementById("park-guide-btn");
const generalUserBtn = document.getElementById("general-user-btn");

const parkGuideForm = document.getElementById("park-guide-form");
const generalUserForm = document.getElementById("general-user-form");

const pgError = document.getElementById("pg-error");
const guError = document.getElementById("gu-error");

// Role Selection Modal
parkGuideBtn.addEventListener("click", () => {
  roleModal.style.display = "none";
  parkGuideForm.style.display = "block";
  generalUserForm.style.display = "none";
});

generalUserBtn.addEventListener("click", () => {
  roleModal.style.display = "none";
  generalUserForm.style.display = "block";
  parkGuideForm.style.display = "none";
});

function isValidIC(ic) {
  // Malaysian IC without dashes: 12 digits continuous
  return /^\d{12}$/.test(ic);
}

function isValidPhone(phone) {
  // Malaysian phone number starting with 01x, then 7-8 digits, no dash required
  return /^01\d{8,9}$/.test(phone);
}


// Malaysia-only modal
document.getElementById("malaysia-only-close").addEventListener("click", () => {
  document.getElementById("malaysia-only-modal").style.display = "none";
  document.getElementById("pg-ic").value = "";
  document.getElementById("pg-phone").value = "";
});

// Park Guide Registration
parkGuideForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  pgError.textContent = "";

  const name = document.getElementById("pg-name").value.trim();
  const email = document.getElementById("pg-email").value.trim();
  const phone = document.getElementById("pg-phone").value.trim();
  const ic = document.getElementById("pg-ic").value.trim();
  const password = document.getElementById("pg-password").value.trim();
  const confirmPassword = document.getElementById("pg-confirm-password").value.trim();

  if (password !== confirmPassword) {
    pgError.textContent = "Passwords do not match.";
    return;
  }

  if (!isValidIC(ic) || !isValidPhone(phone)) {
    document.getElementById("malaysia-only-modal").style.display = "flex";
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      phone,
      ic,
      role: "Park Guide",
      imgUrl: "Resources/Images/ProfilePicture/defaultProfile.jpeg"
    });
    alert("You have been successfully registered!");
    window.location.href = "index.html";
  } catch (error) {
    pgError.textContent = error.message;
  }
});

// General User Registration
generalUserForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  guError.textContent = "";

  const email = document.getElementById("gu-email").value.trim();
  const password = document.getElementById("gu-password").value.trim();
  const confirmPassword = document.getElementById("gu-confirm-password").value.trim();

  if (password !== confirmPassword) {
    guError.textContent = "Passwords do not match.";
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email,
      role: "General User",
      imgUrl: "Resources/Images/ProfilePicture/defaultProfile.jpeg"
    });
    alert("You have been successfully registered!");

    window.location.href = "index.html";
  } catch (error) {
    guError.textContent = error.message;
  }
});




