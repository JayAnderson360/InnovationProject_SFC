// Firebase v9+ modular SDK
// IMPORTANT: Replace with your actual Firebase project configuration
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
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app); // Using Firestore
const auth = firebase.auth(app);

window.db = db;
window.auth = auth;
// Make db globally available or export it if using modules (not used in this simple setup)
// For simplicity in this multi-file non-module setup, we'll assume firebase.firestore() is available after this script.
// If you were using ES6 modules, you'd export: export { db };
