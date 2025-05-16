// app.js - Main application logic for the admin dashboard

document.addEventListener('DOMContentLoaded', () => {
    const COLLECTIONS = [
        'courses', 
        'modules', 
        'parkguide_certification', 
        'parkguide_score', 
        'parks', 
        'tests', 
        'user', // 'users' might be more common, ensure correct name
        'visitor_feedback'
    ];

    let currentFields = []; // To store fields of the currently loaded collection

    // Initialize UI elements
    ui.init(COLLECTIONS, loadCollectionData, showAddForm);

    // --- Core Functions ---
    async function loadCollectionData(collectionName) {
        ui.dataDisplayContainer.innerHTML = '<p>Loading data...</p>';
        try {
            currentFields = await api.getCollectionFields(collectionName);
            if (currentFields.length === 0) {
                 // Attempt to get fields from a potentially non-empty document if first was empty or unrepresentative
                const sampleData = await api.getCollectionData(collectionName);
                if (sampleData.length > 0) {
                    currentFields = Object.keys(sampleData[0]).filter(key => key !== 'id');
                } else {
                     ui.dataDisplayContainer.innerHTML = `<p>No fields could be determined for ${collectionName}. Add some data first or define fields manually.</p>`;
                     ui.currentCollectionTitle.textContent = `Manage ${collectionName}`;
                     ui.addNewButton.style.display = 'inline-block'; // Allow adding even if no fields
                     return;
                }
            }
            const data = await api.getCollectionData(collectionName);
            ui.displayCollectionData(collectionName, data, currentFields, showEditForm, handleDeleteItem);
        } catch (error) {
            console.error(`Failed to load collection ${collectionName}:`, error);
            ui.dataDisplayContainer.innerHTML = `<p>Error loading data for ${collectionName}.</p>`;
        }
    }

    function showAddForm(collectionName) {
        // If currentFields is empty (e.g., new collection), prompt for field names or use a default set
        let fieldsForForm = currentFields;
        if (!fieldsForForm || fieldsForForm.length === 0) {
            // Fallback: allow user to define fields or use a generic input
            // For now, we'll use a very basic approach if fields are unknown.
            // A better approach would be a schema definition or a UI to add fields.
            const manuallyDefinedFields = prompt("No fields detected. Please enter comma-separated field names for new items (e.g., name,description,type):");
            if (manuallyDefinedFields) {
                fieldsForForm = manuallyDefinedFields.split(',').map(f => f.trim()).filter(f => f);
            } else {
                // If user cancels or provides no fields, perhaps a single 'data' textarea
                fieldsForForm = ['field1', 'field2']; // Default placeholder fields
                alert("Using placeholder fields. Edit an item later to refine structure or ensure your collection has at least one document.");
            }
        }
        ui.showModal(`Add New Item to ${collectionName}`);
        ui.createForm(collectionName, fieldsForForm, {}, handleFormSubmit);
    }

    function showEditForm(collectionName, docId, currentData) {
        // Ensure fields are relevant to the item being edited, not just the first doc's fields
        const itemFields = Object.keys(currentData).filter(key => key !== 'id');
        ui.showModal(`Edit Item in ${collectionName}`);
        ui.createForm(collectionName, itemFields, currentData, handleFormSubmit);
    }

    async function handleFormSubmit(collectionName, docId, data) {
        let success = false;
        if (docId) { // Editing existing document
            success = await api.updateDocument(collectionName, docId, data);
        } else { // Adding new document
            const newDocId = await api.addDocument(collectionName, data);
            if (newDocId) success = true;
        }

        if (success) {
            ui.hideModal();
            loadCollectionData(collectionName); // Refresh data
            alert(`Item ${docId ? 'updated' : 'added'} successfully!`);
        } else {
            alert(`Failed to ${docId ? 'update' : 'add'} item.`);
        }
    }

    async function handleDeleteItem(collectionName, docId) {
        if (confirm(`Are you sure you want to delete this item from ${collectionName}?`)) {
            const success = await api.deleteDocument(collectionName, docId);
            if (success) {
                loadCollectionData(collectionName); // Refresh data
                alert('Item deleted successfully!');
            } else {
                alert('Failed to delete item.');
            }
        }
    }

    // --- Initial Load ---
    // Optionally, load the first collection by default or show a welcome message
    if (COLLECTIONS.length > 0) {
        // Simulate a click on the first link to load it
        const firstLink = ui.sidebarLinksContainer.querySelector('li a');
        if (firstLink) {
            firstLink.click();
        } else {
             ui.currentCollectionTitle.textContent = 'Dashboard';
             ui.dataDisplayContainer.innerHTML = '<p>Welcome to the Admin Dashboard. Select a collection to manage.</p>';
        }
    } else {
        ui.currentCollectionTitle.textContent = 'Dashboard';
        ui.dataDisplayContainer.innerHTML = '<p>No collections configured.</p>';
    }
});
