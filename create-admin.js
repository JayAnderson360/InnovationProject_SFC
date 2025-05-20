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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Function to create an admin user
async function createAdminUser() {
    const email = "admin@sarawakforestry.com";
    const password = "Admin123!";
    
    try {
        // Register user first
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Set user role as admin
        await db.collection("users").doc(user.uid).set({
            email,
            role: "Admin",
            imgUrl: "Resources/Images/ProfilePicture/defaultProfile.jpeg"
        });
        
        console.log("Admin user created successfully!");
        alert("Admin user created successfully!");
    } catch (error) {
        console.error("Error creating admin user:", error);
        alert("Error: " + error.message);
    }
}

// Create button to trigger admin creation
const adminBtn = document.createElement('button');
adminBtn.textContent = 'Create Admin User';
adminBtn.style.position = 'fixed';
adminBtn.style.top = '10px';
adminBtn.style.right = '10px';
adminBtn.style.zIndex = '9999';
adminBtn.style.padding = '10px';
adminBtn.style.backgroundColor = '#4CAF50';
adminBtn.style.color = 'white';
adminBtn.style.border = 'none';
adminBtn.style.borderRadius = '5px';
adminBtn.style.cursor = 'pointer';
adminBtn.addEventListener('click', createAdminUser);

document.body.appendChild(adminBtn);
