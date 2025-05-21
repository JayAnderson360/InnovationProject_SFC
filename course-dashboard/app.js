// app.js - Main application logic

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Define collections
const collections = ['courses'];

// Check authentication state
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        console.log('User is signed in:', user.email);
        document.getElementById('user-name').textContent = user.displayName || user.email;
        
        // Initialize UI
        ui.init(collections, loadCollection, showAddForm);
        loadCollection('courses'); // Load courses by default
        
        // Implement logout functionality
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await auth.signOut();
                    localStorage.clear(); // Clear local storage upon logout
                    alert("You have logged out.");
                    window.location.href = "../login.html";
                } catch (error) {
                    console.error("Error during logout:", error.message);
                    alert("Logout failed: " + error.message);
                }
            });
        }
    } else {
        // User is signed out, redirect to login page
        console.log('No user is signed in');
        window.location.href = '../login.html';
    }
});

// Load collection data
async function loadCollection(collectionName) {
    console.log(`Loading data for collection: ${collectionName}`);
    try {
        const data = await api.getCollectionData(collectionName);
        const fields = await api.getCollectionFields(collectionName);
        ui.displayCollectionData(collectionName, data, fields, handleEdit, handleDelete);
    } catch (error) {
        console.error('Error loading collection:', error);
        alert('Error loading collection. Check console.');
    }
}

// Show add form
function showAddForm(collectionName) {
    api.getCollectionFields(collectionName).then(fields => {
        ui.showModal(`Add New ${collectionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
        ui.createForm(collectionName, fields, {}, handleFormSubmit);
    });
}

// Handle form submission
async function handleFormSubmit(collectionName, docId, data) {
    try {
        if (docId) {
            // Update existing document
            const success = await api.updateDocument(collectionName, docId, data);
            if (success) {
                alert('Document updated successfully!');
                ui.hideModal();
                loadCollection(collectionName);
            }
        } else {
            // Add new document
            const newDocId = await api.addDocument(collectionName, data);
            if (newDocId) {
                alert('Document added successfully!');
                ui.hideModal();
                loadCollection(collectionName);
            }
        }
    } catch (error) {
        console.error('Error handling form submission:', error);
        alert('Error saving document. Check console.');
    }
}

// Handle edit
function handleEdit(collectionName, docId, currentData) {
    api.getCollectionFields(collectionName).then(fields => {
        ui.showModal(`Edit ${collectionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
        ui.createForm(collectionName, fields, { id: docId, ...currentData }, handleFormSubmit);
    });
}

// Handle delete
async function handleDelete(collectionName, docId) {
    if (confirm('Are you sure you want to delete this document?')) {
        try {
            const success = await api.deleteDocument(collectionName, docId);
            if (success) {
                alert('Document deleted successfully!');
                loadCollection(collectionName);
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Error deleting document. Check console.');
        }
    }
}
