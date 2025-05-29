// admin-dashboard/firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyBS4W6MddWuU3lxotE9peb7RsI_QJzIzaI",
    authDomain: "sarawak-forestry-database.firebaseapp.com",
    databaseURL: "https://sarawak-forestry-database-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sarawak-forestry-database",
    messagingSenderId: "979838017340",
    appId: "1:979838017340:web:a31113d00fafcb0bcb4839",
    measurementId: "G-KXNY4PT4VY"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

window.db = db;
window.auth = auth;

// Conditionally initialize Realtime Database and Storage
if (typeof firebase.database === 'function') {
    const rtdb = firebase.database();
    window.rtdb = rtdb;
} else {
    console.warn('Firebase Realtime Database SDK not loaded. window.rtdb will not be available.');
}