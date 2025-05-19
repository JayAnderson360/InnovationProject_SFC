// app.js - Main application logic

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Define collections
const collections = ['courses'];

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    ui.init(collections, loadCollection, showAddForm);
    loadCollection('courses'); // Load courses by default
});

// Load collection data
async function loadCollection(collectionName) {
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