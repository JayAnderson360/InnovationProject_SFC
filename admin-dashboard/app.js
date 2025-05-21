// app.js - Main application logic for the admin dashboard

// Global function to load dashboard data
async function loadDashboardData() {
    try {
        // Get all pending items from different collections
        const licenses = await api.getCollectionData('licenses');
        const certificates = await api.getCollectionData('certificates');
        const enrollments = await api.getCollectionData('enrollments');
        const payments = await api.getCollectionData('payments');
        const users = await api.getCollectionData('users');
        const courses = await api.getCollectionData('courses');

        // Create a map of user IDs to names for quick lookup
        const userMap = users.reduce((map, user) => {
            map[user.id] = user.name;
            return map;
        }, {});

        // Create a map of course IDs to titles for quick lookup
        const courseMap = courses.reduce((map, course) => {
            map[course.id] = course.title;
            return map;
        }, {});

        // Count pending items
        const licensesPending = licenses.filter(item => item.status === 'pending').length;
        const certificatesPending = certificates.filter(item => item.status === 'pending').length;
        const enrollmentsPending = enrollments.filter(item => item.status === 'pending').length;
        const paymentsPending = payments.filter(item => item.status === 'pending').length;

        // Update the dashboard numbers
        document.getElementById('licenses-pending').textContent = licensesPending;
        document.getElementById('certificates-pending').textContent = certificatesPending;
        document.getElementById('enrollments-pending').textContent = enrollmentsPending;
        document.getElementById('payments-pending').textContent = paymentsPending;

        // Helper function to format date
        const formatDate = (dateObj) => {
            if (!dateObj) return '-';
            
            // Handle Firestore Timestamp
            if (dateObj.toDate && typeof dateObj.toDate === 'function') {
                return dateObj.toDate().toLocaleDateString();
            }
            
            // Handle regular Date object
            if (dateObj instanceof Date) {
                return dateObj.toLocaleDateString();
            }
            
            // Handle string date
            const date = new Date(dateObj);
            return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
        };

        // Sort enrollments by date (most recent first)
        enrollments.sort((a, b) => {
            const dateA = a.enrolledDate?.toDate?.() || new Date(a.enrolledDate);
            const dateB = b.enrolledDate?.toDate?.() || new Date(b.enrolledDate);
            return dateB - dateA;
        });

        // Create the latest enrollments section
        const latestEnrollmentsHTML = `
            <div class="latest-enrollments-section">
                <h2>Latest Enrollments</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Guide Name</th>
                                <th>Course</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${enrollments.slice(0, 4).map(item => `
                                <tr>
                                    <td>${userMap[item.userID] || '-'}</td>
                                    <td>${courseMap[item.courseID] || '-'}</td>
                                    <td>${formatDate(item.enrolledDate)}</td>
                                    <td>
                                        <span class="status-badge ${item.status === 'pending' ? 'status-pending' : 
                                            item.status === 'Approved' ? 'status-approved' : 
                                            item.status === 'Rejected' ? 'status-rejected' : ''}">
                                            ${item.status || '-'}
                                        </span>
                                    </td>
                                    <td class="actions">
                                        ${item.status === 'pending' ? `
                                            <button class="btn-icon approve" onclick="handleEnrollmentStatus('${item.id}', 'Approved')" title="Approve">
                                                <i class="fas fa-check"></i>
                                            </button>
                                            <button class="btn-icon reject" onclick="handleEnrollmentStatus('${item.id}', 'Rejected')" title="Reject">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        ` : `
                                            <span class="status-message">${item.status === 'Approved' ? 'Approved' : 'Rejected'}</span>
                                        `}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="view-more-container">
                    <button class="btn-primary view-more-btn" onclick="loadCollectionData('enrollments')">
                        View More Enrollments
                    </button>
                </div>
            </div>
        `;

        // Show the dashboard view
        ui.currentCollectionTitle.textContent = 'Dashboard';
        ui.addNewButton.style.display = 'none';
        
        // Show dashboard elements
        document.getElementById('dashboard-cards').style.display = 'grid';
        document.querySelector('.quick-actions-section').style.display = 'block';
        
        // Show dashboard display and hide collection display
        ui.dashboardDataDisplay.style.display = 'block';
        ui.collectionDataDisplay.style.display = 'none';
        
        // Update the dashboard data display with latest enrollments
        ui.dashboardDataDisplay.innerHTML = latestEnrollmentsHTML;
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        ui.dashboardDataDisplay.innerHTML = '<p>Error loading dashboard data.</p>';
    }
}

// Global function to handle enrollment status changes
async function handleEnrollmentStatus(enrollmentId, newStatus) {
    try {
        // Confirm the action
        const action = newStatus === 'Approved' ? 'approve' : 'reject';
        if (!confirm(`Are you sure you want to ${action} this enrollment?`)) {
            return;
        }

        // Update the enrollment status
        const success = await api.updateDocument('enrollments', enrollmentId, { 
            status: newStatus,
            updatedAt: new Date() // Add timestamp for when the status was changed
        });

        if (success) {
            // Show success message
            alert(`Enrollment ${action}d successfully!`);
            // Reload the dashboard to show updated status
            loadDashboardData();
        } else {
            alert(`Failed to ${action} enrollment.`);
        }
    } catch (error) {
        console.error('Error updating enrollment status:', error);
        alert('Error updating enrollment status. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const COLLECTIONS = [
        'users',
        'courses',
        'parks',
        'enrollments',
        'payment',
        'certificates'
    ];

    let currentFields = []; // To store fields of the currently loaded collection

    // Define loadCollectionData function before initializing UI
    async function loadCollectionData(collectionName) {
        const normalizedCollectionName = collectionName.toLowerCase();
        
        // If it's the dashboard, load the dashboard view
        if (normalizedCollectionName === 'dashboard') {
            await loadDashboardData();
            return;
        }

        // Show loading state in collection display
        ui.collectionDataDisplay.innerHTML = '<p>Loading data...</p>';
        ui.collectionDataDisplay.style.display = 'block';
        ui.dashboardDataDisplay.style.display = 'none';
        document.getElementById('dashboard-cards').style.display = 'none';
        document.querySelector('.quick-actions-section').style.display = 'none';

        try {
            // Special handling for enrollments collection
            if (normalizedCollectionName === 'enrollments') {
                const data = await api.getCollectionData(normalizedCollectionName);
                // Sort by date in descending order (most recent first)
                data.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // Define specific fields for enrollments
                const enrollmentFields = ['guideName', 'course', 'date', 'status'];
                ui.displayCollectionData(collectionName, data, enrollmentFields, showEditForm, handleDeleteItem);
                return;
            }

            currentFields = await api.getCollectionFields(normalizedCollectionName);
            if (currentFields.length === 0) {
                const sampleData = await api.getCollectionData(normalizedCollectionName);
                if (sampleData.length > 0) {
                    currentFields = Object.keys(sampleData[0]).filter(key => key !== 'id');
                } else {
                    ui.collectionDataDisplay.innerHTML = `<p>No fields could be determined for ${collectionName}. Add some data first or define fields manually.</p>`;
                    ui.currentCollectionTitle.textContent = `Manage ${collectionName}`;
                    ui.addNewButton.style.display = 'inline-block';
                    return;
                }
            }
            const data = await api.getCollectionData(normalizedCollectionName);
            ui.displayCollectionData(collectionName, data, currentFields, showEditForm, handleDeleteItem);
        } catch (error) {
            console.error(`Failed to load collection ${collectionName}:`, error);
            ui.collectionDataDisplay.innerHTML = `<p>Error loading data for ${collectionName}.</p>`;
        }
    }

    // Initialize UI elements with the loadCollectionData function
    ui.init(COLLECTIONS, loadCollectionData, showAddForm);

    function showAddForm(collectionName) {
        const normalizedCollectionName = collectionName.toLowerCase();
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
        ui.createForm(normalizedCollectionName, fieldsForForm, {}, handleFormSubmit);
    }

    function showEditForm(collectionName, docId, currentData) {
        const normalizedCollectionName = collectionName.toLowerCase();
        // Ensure fields are relevant to the item being edited, not just the first doc's fields
        const itemFields = Object.keys(currentData).filter(key => key !== 'id');
        ui.showModal(`Edit Item in ${collectionName}`);
        ui.createForm(normalizedCollectionName, itemFields, currentData, handleFormSubmit);
    }

    async function handleFormSubmit(collectionName, docId, data) {
        const normalizedCollectionName = collectionName.toLowerCase();
        let success = false;
        
        // Special handling for user collection
        if (normalizedCollectionName === 'users') {
            // Validate required fields based on role
            if (!data.name || !data.email || !data.role) {
                alert('Name, email, and role are required fields.');
                return;
            }

            // Password is only required for new users
            if (!docId && !data.password) {
                alert('Password is required for new users.');
                return;
            }

            // Additional validation for Park Guide role
            if (data.role === 'Park Guide') {
                if (!data.phoneNumber || !data.icNumber) {
                    alert('Phone Number and IC Number are required for Park Guide role.');
                    return;
                }
                // Validate IC Number format (accepts both formats)
                const icRegex = /^[0-9]{6}-[0-9]{2}-[0-9]{4}$|^[0-9]{12}$/;
                if (!icRegex.test(data.icNumber)) {
                    alert('Please enter a valid IC Number (format: XXXXXX-XX-XXXX or XXXXXXXXXXXX)');
                    return;
                }
                // Format IC number to standard format before storing
                if (data.icNumber.length === 12) {
                    data.icNumber = `${data.icNumber.slice(0, 6)}-${data.icNumber.slice(6, 8)}-${data.icNumber.slice(8)}`;
                }
                // Validate phone number format
                const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/;
                if (!phoneRegex.test(data.phoneNumber)) {
                    alert('Please enter a valid Malaysian phone number');
                    return;
                }
            }

            try {
                if (docId) { // Editing existing user
                    const db = firebase.firestore();
                    const userRef = db.collection('users').doc(docId);
                    const userDoc = await userRef.get();

                    if (!userDoc.exists) {
                        throw new Error('User not found');
                    }

                    const userData = userDoc.data();
                    const auth = firebase.auth();

                    // Update password in Authentication if provided
                    if (data.password) {
                        try {
                            const userRecord = await auth.getUserByEmail(userData.email);
                            await auth.updateUser(userRecord.uid, {
                                password: data.password
                            });
                            console.log('Successfully updated password in Authentication');
                        } catch (authError) {
                            console.error('Error updating password:', authError);
                            throw new Error('Failed to update password in Authentication');
                        }
                    }

                    // Prepare update data (excluding password)
                    const updateData = {
                        name: data.name,
                        email: data.email,
                        role: data.role
                    };

                    // Add Park Guide specific fields if role is Park Guide
                    if (data.role === 'Park Guide') {
                        updateData.phoneNumber = data.phoneNumber;
                        updateData.icNumber = data.icNumber;
                    } else {
                        // Remove Park Guide fields if role is changed
                        updateData.phoneNumber = firebase.firestore.FieldValue.delete();
                        updateData.icNumber = firebase.firestore.FieldValue.delete();
                    }

                    // Update Firestore document
                    await userRef.update(updateData);
                    console.log('Successfully updated user in Firestore');
                    success = true;

                } else { // Creating new user
                    try {
                        // First check if the email already exists in Firestore
                        const usersRef = firebase.firestore().collection('users');
                        const emailQuery = await usersRef.where('email', '==', data.email).get();
                        
                        if (!emailQuery.empty) {
                            throw new Error('This email is already registered in the system.');
                        }

                        // Create the user in Firebase Authentication
                        const auth = firebase.auth();
                        const userCredential = await auth.createUserWithEmailAndPassword(
                            data.email,
                            data.password
                        );
                        
                        // Get the UID from the created user
                        const uid = userCredential.user.uid;
                        console.log('Created user with UID:', uid);
                        
                        // Prepare user data for Firestore (excluding password)
                        const userData = {
                            name: data.name,
                            email: data.email,
                            role: data.role,
                            uid: uid
                        };

                        // Add Park Guide specific fields
                        if (data.role === 'Park Guide') {
                            userData.phoneNumber = data.phoneNumber;
                            userData.icNumber = data.icNumber;
                        }

                        console.log('Creating user document with data:', userData);
                        
                        // Create the user document in Firestore using the UID as document ID
                        const db = firebase.firestore();
                        await db.collection('users').doc(uid).set(userData);
                        console.log('Successfully created user document with ID:', uid);
                        success = true;

                    } catch (error) {
                        console.error('Error in user creation process:', error);
                        if (error.code === 'auth/email-already-in-use') {
                            throw new Error('This email is already registered in the authentication system.');
                        } else if (error.code === 'auth/missing-password') {
                            throw new Error('Password is required for user creation.');
                        } else if (error.code === 'auth/weak-password') {
                            throw new Error('Password is too weak. Please use a stronger password.');
                        } else if (error.code === 'auth/invalid-email') {
                            throw new Error('Invalid email address format.');
                        }
                        throw error;
                    }
                }

                if (success) {
                    ui.hideModal();
                    loadCollectionData(collectionName); // Refresh data
                    alert(`User ${docId ? 'updated' : 'created'} successfully!`);
                } else {
                    alert(`Failed to ${docId ? 'update' : 'create'} user.`);
                }
            } catch (error) {
                console.error('Error handling user:', error);
                alert(`Error: ${error.message}`);
            }
            return;
        }

        // Handle other collections
        if (docId) { // Editing existing document
            success = await api.updateDocument(normalizedCollectionName, docId, data);
        } else { // Adding new document
            const newDocId = await api.addDocument(normalizedCollectionName, data);
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
        const normalizedCollectionName = collectionName.toLowerCase();
        if (confirm(`Are you sure you want to delete this item from ${collectionName}?`)) {
            const success = await api.deleteDocument(normalizedCollectionName, docId);
            if (success) {
                loadCollectionData(collectionName); // Refresh data
                alert('Item deleted successfully!');
            } else {
                alert('Failed to delete item.');
            }
        }
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
        try {
            await firebase.auth().signOut(); // or signOut(auth) if modular SDK
            alert("You have been logged out.");
            window.location.href = "../login.html"; // Redirect after logout
        } catch (error) {
            console.error("Logout failed:", error);
            alert("Logout failed. See console for details.");
        }
        });
    }

    // --- Initial Load ---
    // Load the dashboard by default
    ui.currentCollectionTitle.textContent = 'Dashboard';
    loadDashboardData();
});
