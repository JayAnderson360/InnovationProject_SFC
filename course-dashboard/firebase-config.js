// Firebase v9+ compat version
const firebaseConfig = {
    apiKey: "AIzaSyBS4W6MddWuU3lxotE9peb7RsI_QJzIzaI", 
    authDomain: "sarawak-forestry-database.firebaseapp.com",
    projectId: "sarawak-forestry-database",
    storageBucket: "sarawak-forestry-database.appspot.com",
    messagingSenderId: "979838017340",
    appId: "1:979838017340:web:a31113d00fafcb0bcb4839",
    measurementId: "G-KXNY4PT4VY"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Make them globally available
window.db = db;
window.auth = auth;
