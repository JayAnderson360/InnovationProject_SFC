// ui.js - Handles DOM manipulation and UI updates

const ui = {
    sidebarLinksContainer: document.getElementById('sidebar-links'),
    dashboardDataDisplay: document.getElementById('dashboard-data-display'),
    collectionDataDisplay: document.getElementById('collection-data-display'),
    currentCollectionTitle: document.getElementById('current-collection-title'),
    addNewButton: document.getElementById('add-new-button'),
    formModal: document.getElementById('form-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalBodyContent: document.getElementById('modal-body-content'),
    closeModalButton: document.getElementById('close-modal-button'),
    loadCollectionDataCallback: null,

    init(collections, loadCollectionCallback, showAddFormCallback) {
        this.loadCollectionDataCallback = loadCollectionCallback;
        this.populateSidebar(collections, loadCollectionCallback);
        this.addNewButton.addEventListener('click', () => {
            const currentCollection = this.currentCollectionTitle.textContent.replace('Manage ', '');
            if (currentCollection && currentCollection !== 'Dashboard') {
                 showAddFormCallback(currentCollection);
            }
        });

        // Modal close functionality
        this.closeModalButton.addEventListener('click', () => this.hideModal());
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === this.formModal) {
                this.hideModal();
            }
        });

        // Close modal when pressing Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.formModal.style.display === 'block') {
                this.hideModal();
            }
        });

        // Add image modal to the document
        const imageModal = document.createElement('div');
        imageModal.id = 'image-modal';
        imageModal.className = 'modal';
        imageModal.innerHTML = `
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <img id="modal-image" src="" alt="Payment Proof">
            </div>
        `;
        document.body.appendChild(imageModal);

        // Add image modal event listeners
        const closeButton = imageModal.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            imageModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === imageModal) {
                imageModal.style.display = 'none';
            }
        });
    },

    populateSidebar(collections, loadCollectionCallback) {
        this.sidebarLinksContainer.innerHTML = ''; // Clear existing links

        // Add Dashboard link at the top
        const dashboardLi = document.createElement('li');
        const dashboardA = document.createElement('a');
        dashboardA.href = '#';
        dashboardA.dataset.collection = 'dashboard';
        dashboardA.classList.add('active'); // Set Dashboard as active by default
        
        const dashboardIcon = document.createElement('i');
        dashboardIcon.className = 'fas fa-tachometer-alt'; // Dashboard icon
        
        const dashboardSpan = document.createElement('span');
        dashboardSpan.textContent = 'Dashboard';

        dashboardA.appendChild(dashboardIcon);
        dashboardA.appendChild(dashboardSpan);
        
        dashboardA.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('#sidebar-links a').forEach(link => link.classList.remove('active'));
            dashboardA.classList.add('active');
            loadCollectionCallback('dashboard');
        });
        dashboardLi.appendChild(dashboardA);
        this.sidebarLinksContainer.appendChild(dashboardLi);

        // Add a separator
        const separator = document.createElement('li');
        separator.className = 'sidebar-separator';
        this.sidebarLinksContainer.appendChild(separator);

        // Add the rest of the collection links
        collections.forEach(collection => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.dataset.collection = collection;
            
            const icon = document.createElement('i');
            // Set specific icons for different collections
            if (collection === 'users') {
                icon.className = 'fas fa-users';
            } else if (collection === 'courses') {
                icon.className = 'fas fa-graduation-cap';
            } else if (collection === 'parks') {
                icon.className = 'fas fa-tree';
            } else if (collection === 'enrollments') {
                icon.className = 'fas fa-clipboard-list';
            } else if (collection === 'payment') {
                icon.className = 'fas fa-money-bill-wave';
            } else if (collection === 'certificates') {
                icon.className = 'fas fa-certificate';
            } else {
                icon.className = 'fas fa-folder'; // Default folder icon
            }
            
            const span = document.createElement('span');
            // Special handling for payment to show as "Payment"
            if (collection === 'payment') {
                span.textContent = 'Payment';
            } else {
            span.textContent = collection.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Format name
            }

            a.appendChild(icon);
            a.appendChild(span);
            
            a.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('#sidebar-links a').forEach(link => link.classList.remove('active'));
                a.classList.add('active');
                loadCollectionCallback(collection);
            });
            li.appendChild(a);
            this.sidebarLinksContainer.appendChild(li);
        });
    },

    async displayCollectionData(collectionName, data, fields, onEdit, onDelete) {
        this.currentCollectionTitle.textContent = `Manage ${collectionName}`;
        this.addNewButton.style.display = 'inline-block';

        // Show collection display and hide dashboard elements
        this.collectionDataDisplay.style.display = 'block';
        this.dashboardDataDisplay.style.display = 'none';
        document.getElementById('dashboard-cards').style.display = 'none';
        document.querySelector('.quick-actions-section').style.display = 'none';

        if (!data || data.length === 0) {
            this.collectionDataDisplay.innerHTML = `<p>No data available for ${collectionName}.</p>`;
            return;
        }

        // If this is payment or certificates, get the users data to map IDs to names
        let userMap = {};
        if (collectionName.toLowerCase() === 'payment' || collectionName.toLowerCase() === 'certificates') {
            try {
                const users = await api.getCollectionData('users');
                userMap = users.reduce((map, user) => {
                    map[user.id] = user.name;
                    return map;
                }, {});
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        }

        let tableHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
        `;

        // Special handling for specific collections
        if (collectionName.toLowerCase() === 'enrollments') {
            const headers = ['Guide Name', 'Course', 'Date', 'Status', 'Actions'];
            headers.forEach(header => {
                tableHTML += `<th>${header}</th>`;
            });
        } else if (collectionName.toLowerCase() === 'users') {
            const headers = ['ID', 'Name', 'Email', 'Role', 'IC Number', 'Phone Number', 'Actions'];
            headers.forEach(header => {
                tableHTML += `<th>${header}</th>`;
            });
        } else if (collectionName.toLowerCase() === 'courses') {
            const headers = ['Title', 'Duration (Days)', 'Price (RM)', 'License', 'Certificate', 'Actions'];
            headers.forEach(header => {
                tableHTML += `<th>${header}</th>`;
            });
        } else if (collectionName.toLowerCase() === 'parks') {
            const headers = ['Name', 'Location', 'Type', 'Land Area', 'Marine Area', 'Date of Gazettement', 'Actions'];
            headers.forEach(header => {
                tableHTML += `<th>${header}</th>`;
            });
        } else if (collectionName.toLowerCase() === 'payment') {
            const headers = ['Name', 'Amount Paid', 'Status', 'Courses', 'Date Submitted', 'Proof', 'Actions'];
            headers.forEach(header => {
                tableHTML += `<th>${header}</th>`;
            });
        } else if (collectionName.toLowerCase() === 'certificates') {
            const headers = ['Name', 'License No.', 'Cert. Name', 'Status', 'Issued At', 'Expires At', 'Actions'];
            headers.forEach(header => {
                tableHTML += `<th>${header}</th>`;
            });
        } else {
            fields.forEach(field => {
                tableHTML += `<th>${this.formatFieldName(field)}</th>`;
            });
            tableHTML += `<th>Actions</th>`;
        }

        tableHTML += `
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.forEach(item => {
            tableHTML += '<tr>';
            
            // Special handling for specific collections
            if (collectionName.toLowerCase() === 'enrollments') {
                // Guide Name
                tableHTML += `<td>${item.guideName || '-'}</td>`;
                
                // Course
                tableHTML += `<td>${item.course || '-'}</td>`;
                
                // Date
                const date = item.date ? new Date(item.date).toLocaleDateString() : '-';
                tableHTML += `<td>${date}</td>`;
                
                // Status
                const statusClass = item.status === 'pending' ? 'status-pending' : 
                                  item.status === 'approved' ? 'status-approved' : 
                                  item.status === 'rejected' ? 'status-rejected' : '';
                tableHTML += `<td><span class="status-badge ${statusClass}">${item.status || '-'}</span></td>`;
                
                // Actions
                tableHTML += `
                    <td class="actions">
                        <button class="btn-icon edit" onclick="ui.showEditForm('${collectionName}', '${item.id}', ${JSON.stringify(item).replace(/'/g, "\\'")})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="ui.handleDelete('${collectionName}', '${item.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
            } else if (collectionName.toLowerCase() === 'users') {
                // ID
                tableHTML += `<td>${item.id || '-'}</td>`;
                
                // Name
                tableHTML += `<td>${item.name || '-'}</td>`;
                
                // Email
                tableHTML += `<td>${item.email || '-'}</td>`;
                
                // Role
                tableHTML += `<td>${item.role || '-'}</td>`;
                
                // IC Number
                tableHTML += `<td>${item.icNumber || '-'}</td>`;
                
                // Phone Number
                tableHTML += `<td>${item.phoneNumber || '-'}</td>`;
                
                // Actions
                tableHTML += `
                    <td class="actions">
                        <button class="btn-icon edit" onclick="ui.showEditForm('${collectionName}', '${item.id}', ${JSON.stringify(item).replace(/'/g, "\\'")})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="ui.handleDelete('${collectionName}', '${item.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
            } else if (collectionName.toLowerCase() === 'courses') {
                // Title
                tableHTML += `<td>${item.title || '-'}</td>`;
                
                // Duration
                tableHTML += `<td>${item.completionDurationDays || '-'}</td>`;
                
                // Price
                tableHTML += `<td>RM ${item.price ? item.price.toFixed(2) : '-'}</td>`;
                
                // License - based on isGeneralLicenseCourse
                tableHTML += `<td>${item.isGeneralLicenseCourse ? 'Yes' : 'No'}</td>`;
                
                // Certificate - based on grantsCertificateName
                tableHTML += `<td>${item.grantsCertificateName ? 'Yes' : 'No'}</td>`;
                
                // Actions
                tableHTML += `
                    <td class="actions">
                        <button class="btn-icon edit" onclick="ui.showEditForm('${collectionName}', '${item.id}', ${JSON.stringify(item).replace(/'/g, "\\'")})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="ui.handleDelete('${collectionName}', '${item.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
            } else if (collectionName.toLowerCase() === 'parks') {
                // Name
                tableHTML += `<td>${item.name || '-'}</td>`;
                
                // Location
                tableHTML += `<td>${item.location || '-'}</td>`;
                
                // Type
                tableHTML += `<td>${item.type || '-'}</td>`;
                
                // Land Area
                tableHTML += `<td>${item.landArea ? `${item.landArea} km²` : '-'}</td>`;
                
                // Marine Area
                tableHTML += `<td>${item.marineArea ? `${item.marineArea} km²` : '-'}</td>`;
                
                // Date of Gazettement
                let gazettementDate = '-';
                if (item.dateOfGazettement) {
                    if (item.dateOfGazettement.toDate) {
                        // Handle Firestore Timestamp
                        gazettementDate = item.dateOfGazettement.toDate().toLocaleDateString();
                    } else if (item.dateOfGazettement instanceof Date) {
                        // Handle Date object
                        gazettementDate = item.dateOfGazettement.toLocaleDateString();
                            } else {
                        // Handle string date
                        const date = new Date(item.dateOfGazettement);
                        gazettementDate = isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
                    }
                }
                tableHTML += `<td>${gazettementDate}</td>`;
                
                // Actions
                tableHTML += `
                    <td class="actions">
                        <button class="btn-icon edit" onclick="ui.showEditForm('${collectionName}', '${item.id}', ${JSON.stringify(item).replace(/'/g, "\\'")})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="ui.handleDelete('${collectionName}', '${item.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
            } else if (collectionName.toLowerCase() === 'payment') {
                // Name - Get from userMap using userID
                tableHTML += `<td>${userMap[item.userID] || '-'}</td>`;
                
                // Amount Paid
                tableHTML += `<td>RM ${item.amount ? item.amount.toFixed(2) : '-'}</td>`;
                
                // Status
                const statusClass = item.status === 'pending' ? 'status-pending' : 
                                  item.status === 'approved' ? 'status-approved' : 
                                  item.status === 'rejected' ? 'status-rejected' : '';
                tableHTML += `<td><span class="status-badge ${statusClass}">${item.status || '-'}</span></td>`;
                
                // Courses - Display courseIDs array
                const courseIDs = item.courseIDs || [];
                tableHTML += `<td>${courseIDs.length > 0 ? courseIDs.join(', ') : '-'}</td>`;
                
                // Date Submitted - Using submittedAt field
                let submittedDate = '-';
                if (item.submittedAt) {
                    if (item.submittedAt.toDate) {
                        // Handle Firestore Timestamp
                        submittedDate = item.submittedAt.toDate().toLocaleDateString();
                    } else if (item.submittedAt instanceof Date) {
                        // Handle Date object
                        submittedDate = item.submittedAt.toLocaleDateString();
                    } else {
                        // Handle string date
                        const date = new Date(item.submittedAt);
                        submittedDate = isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
                    }
                }
                tableHTML += `<td>${submittedDate}</td>`;
                
                // Proof - Using imgUrl field with view button, preserving backslashes
                const imgUrl = item.imgUrl ? item.imgUrl.replace(/\\/g, '\\\\') : '';
                tableHTML += `<td>${item.imgUrl ? 
                    `<button class="btn-view" onclick="ui.showProofImage('${imgUrl}')">View</button>` : 
                    '-'}</td>`;
                
                // Actions
                tableHTML += `
                    <td class="actions">
                        <button class="btn-icon edit" onclick="ui.showEditForm('${collectionName}', '${item.id}', ${JSON.stringify(item).replace(/'/g, "\\'")})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="ui.handleDelete('${collectionName}', '${item.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
            } else if (collectionName.toLowerCase() === 'certificates') {
                // Name - Get from userMap using userID
                tableHTML += `<td>${userMap[item.userID] || '-'}</td>`;
                
                // License No.
                tableHTML += `<td>${item.licenseID || '-'}</td>`;
                
                // Cert. Name
                tableHTML += `<td>${item.certificateName || '-'}</td>`;
                
                // Status
                const statusClass = item.status === 'active' ? 'status-approved' : 
                                  item.status === 'expired' ? 'status-rejected' : 
                                  item.status === 'pending' ? 'status-pending' : '';
                tableHTML += `<td><span class="status-badge ${statusClass}">${item.status || '-'}</span></td>`;
                
                // Issued At
                let issuedDate = '-';
                if (item.issuedAt) {
                    if (item.issuedAt.toDate) {
                        issuedDate = item.issuedAt.toDate().toLocaleDateString();
                    } else if (item.issuedAt instanceof Date) {
                        issuedDate = item.issuedAt.toLocaleDateString();
                    } else {
                        const date = new Date(item.issuedAt);
                        issuedDate = isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
                    }
                }
                tableHTML += `<td>${issuedDate}</td>`;
                
                // Expires At
                let expiresDate = '-';
                if (item.expiresAt) {
                    if (item.expiresAt.toDate) {
                        expiresDate = item.expiresAt.toDate().toLocaleDateString();
                    } else if (item.expiresAt instanceof Date) {
                        expiresDate = item.expiresAt.toLocaleDateString();
                    } else {
                        const date = new Date(item.expiresAt);
                        expiresDate = isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
                    }
                }
                tableHTML += `<td>${expiresDate}</td>`;
                
                // Actions
                tableHTML += `
                    <td class="actions">
                        <button class="btn-icon edit" onclick="ui.showEditForm('${collectionName}', '${item.id}', ${JSON.stringify(item).replace(/'/g, "\\'")})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="ui.handleDelete('${collectionName}', '${item.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
            } else {
                fields.forEach(field => {
                    tableHTML += `<td>${this.formatFieldValue(item[field])}</td>`;
                });
                tableHTML += `
                    <td class="actions">
                        <button class="btn-icon edit" onclick="ui.showEditForm('${collectionName}', '${item.id}', ${JSON.stringify(item).replace(/'/g, "\\'")})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="ui.handleDelete('${collectionName}', '${item.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
            }
            
            tableHTML += '</tr>';
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        this.collectionDataDisplay.innerHTML = tableHTML;
    },

    showModal(title) {
        this.modalTitle.textContent = title;
        this.formModal.style.display = 'block';
    },

    hideModal() {
        this.formModal.style.display = 'none';
        this.modalBodyContent.innerHTML = ''; // Clear form
    },

    createForm(collectionName, fields, currentData, onSubmit) {
        const form = document.createElement('form');
        form.className = 'form';
        
        // Special handling for users collection
        if (collectionName === 'users') {
            // Role selection field
            const roleField = document.createElement('div');
            roleField.className = 'form-group';
            roleField.innerHTML = `
                <label for="role">Role *</label>
                <select id="role" name="role" required>
                    <option value="">Select Role</option>
                    <option value="General Users" ${currentData.role === 'General Users' ? 'selected' : ''}>General Users</option>
                    <option value="Admin" ${currentData.role === 'Admin' ? 'selected' : ''}>Admin</option>
                    <option value="Park Guide" ${currentData.role === 'Park Guide' ? 'selected' : ''}>Park Guide</option>
                </select>
            `;
            form.appendChild(roleField);

            // Common fields for all roles
            const commonFields = [
                { name: 'name', label: 'Name', type: 'text', required: true },
                { name: 'email', label: 'Email', type: 'email', required: true },
                { name: 'password', label: 'Password', type: 'password', required: true }
            ];

            // Add common fields
            commonFields.forEach(field => {
                const fieldGroup = document.createElement('div');
                fieldGroup.className = 'form-group';
                fieldGroup.innerHTML = `
                    <label for="${field.name}">${field.label} *</label>
                    <input type="${field.type}" 
                           id="${field.name}" 
                           name="${field.name}" 
                           value="${currentData[field.name] || ''}"
                           ${field.required ? 'required' : ''}>
                `;
                form.appendChild(fieldGroup);
            });

            // Add Park Guide specific fields
            const parkGuideFields = document.createElement('div');
            parkGuideFields.id = 'park-guide-fields';
            parkGuideFields.style.display = currentData.role === 'Park Guide' ? 'block' : 'none';
            parkGuideFields.innerHTML = `
                <div class="form-group">
                    <label for="phoneNumber">Phone Number *</label>
                    <input type="text" id="phoneNumber" name="phoneNumber" 
                           value="${currentData.phoneNumber || ''}" 
                           pattern="^(\+?6?01)[0-46-9]-*[0-9]{7,8}$"
                           placeholder="e.g., 0123456789">
                </div>
                <div class="form-group">
                    <label for="icNumber">IC Number *</label>
                    <input type="text" id="icNumber" name="icNumber" 
                           value="${currentData.icNumber || ''}"
                           pattern="[0-9]{6}-[0-9]{2}-[0-9]{4}|[0-9]{12}"
                           placeholder="e.g., 123456-12-1234 or 123456121234"
                           oninput="this.value = this.value.replace(/[^0-9-]/g, '')">
                </div>
            `;
            form.appendChild(parkGuideFields);

            // Add role change listener
            const roleSelect = form.querySelector('#role');
            roleSelect.addEventListener('change', (e) => {
                const parkGuideFields = form.querySelector('#park-guide-fields');
                parkGuideFields.style.display = e.target.value === 'Park Guide' ? 'block' : 'none';
                
                // Update required attributes for Park Guide fields
                const phoneInput = form.querySelector('#phoneNumber');
                const icInput = form.querySelector('#icNumber');
                    if (e.target.value === 'Park Guide') {
                    phoneInput.setAttribute('required', '');
                    icInput.setAttribute('required', '');
                    } else {
                    phoneInput.removeAttribute('required');
                    icInput.removeAttribute('required');
                }
            });

        } else if (collectionName === 'courses') {
            // Title field
            const titleField = document.createElement('div');
            titleField.className = 'form-group';
            titleField.innerHTML = `
                <label for="title">Title *</label>
                <input type="text" id="title" name="title" 
                       value="${currentData.title || ''}" 
                       required>
            `;
            form.appendChild(titleField);

            // Duration field
            const durationField = document.createElement('div');
            durationField.className = 'form-group';
            durationField.innerHTML = `
                <label for="completionDurationDays">Duration (Days) *</label>
                <input type="number" id="completionDurationDays" name="completionDurationDays" 
                       value="${currentData.completionDurationDays || ''}" 
                       min="1" required>
            `;
            form.appendChild(durationField);

            // Price field
            const priceField = document.createElement('div');
            priceField.className = 'form-group';
            priceField.innerHTML = `
                <label for="price">Price (RM) *</label>
                <input type="number" id="price" name="price" 
                       value="${currentData.price || ''}" 
                       min="0" step="0.01" required>
            `;
            form.appendChild(priceField);

            // License field
            const licenseField = document.createElement('div');
            licenseField.className = 'form-group';
            licenseField.innerHTML = `
                <label for="isGeneralLicenseCourse">Provide License</label>
                <input type="checkbox" id="isGeneralLicenseCourse" name="isGeneralLicenseCourse" 
                       ${currentData.isGeneralLicenseCourse ? 'checked' : ''}>
            `;
            form.appendChild(licenseField);

            // Certificate field
            const certificateField = document.createElement('div');
            certificateField.className = 'form-group';
            certificateField.innerHTML = `
                <label for="grantsCertificateName">Provide Certificate</label>
                <input type="checkbox" id="grantsCertificateName" name="grantsCertificateName" 
                       ${currentData.grantsCertificateName ? 'checked' : ''}>
                <input type="text" id="certificateName" name="certificateName" 
                       placeholder="Certificate Name (if provided)"
                       value="${currentData.grantsCertificateName || ''}"
                       style="display: ${currentData.grantsCertificateName ? 'block' : 'none'}; margin-top: 5px;">
            `;
            form.appendChild(certificateField);

            // Add event listener for certificate checkbox
            const certificateCheckbox = form.querySelector('#grantsCertificateName');
            const certificateNameInput = form.querySelector('#certificateName');
            certificateCheckbox.addEventListener('change', (e) => {
                certificateNameInput.style.display = e.target.checked ? 'block' : 'none';
                if (!e.target.checked) {
                    certificateNameInput.value = '';
                }
            });
        } else if (collectionName === 'parks') {
            // Name field
            const nameField = document.createElement('div');
            nameField.className = 'form-group';
            nameField.innerHTML = `
                <label for="name">Name *</label>
                <input type="text" id="name" name="name" 
                       value="${currentData.name || ''}" 
                       required>
            `;
            form.appendChild(nameField);

            // Location field
            const locationField = document.createElement('div');
            locationField.className = 'form-group';
            locationField.innerHTML = `
                <label for="location">Location *</label>
                <input type="text" id="location" name="location" 
                       value="${currentData.location || ''}" 
                       required>
            `;
            form.appendChild(locationField);

            // Type field
            const typeField = document.createElement('div');
            typeField.className = 'form-group';
            typeField.innerHTML = `
                <label for="type">Type *</label>
                <select id="type" name="type" required>
                    <option value="">Select Type</option>
                    <option value="National Park" ${currentData.type === 'National Park' ? 'selected' : ''}>National Park</option>
                    <option value="State Park" ${currentData.type === 'State Park' ? 'selected' : ''}>State Park</option>
                    <option value="Marine Park" ${currentData.type === 'Marine Park' ? 'selected' : ''}>Marine Park</option>
                </select>
            `;
            form.appendChild(typeField);

            // Land Area field
            const landAreaField = document.createElement('div');
            landAreaField.className = 'form-group';
            landAreaField.innerHTML = `
                <label for="landArea">Land Area (km²)</label>
                <input type="number" id="landArea" name="landArea" 
                       value="${currentData.landArea || ''}" 
                       min="0" step="0.01">
            `;
            form.appendChild(landAreaField);

            // Marine Area field
            const marineAreaField = document.createElement('div');
            marineAreaField.className = 'form-group';
            marineAreaField.innerHTML = `
                <label for="marineArea">Marine Area (km²)</label>
                <input type="number" id="marineArea" name="marineArea" 
                       value="${currentData.marineArea || ''}" 
                       min="0" step="0.01">
            `;
            form.appendChild(marineAreaField);

            // Date of Gazettement field
            const gazettementField = document.createElement('div');
            gazettementField.className = 'form-group';
            let gazettementDate = '';
            if (currentData.dateOfGazettement) {
                if (currentData.dateOfGazettement.toDate) {
                    gazettementDate = currentData.dateOfGazettement.toDate().toISOString().split('T')[0];
                } else if (currentData.dateOfGazettement instanceof Date) {
                    gazettementDate = currentData.dateOfGazettement.toISOString().split('T')[0];
                    } else {
                    const date = new Date(currentData.dateOfGazettement);
                    gazettementDate = isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
                }
            }
            gazettementField.innerHTML = `
                <label for="dateOfGazettement">Date of Gazettement *</label>
                <input type="date" id="dateOfGazettement" name="dateOfGazettement" 
                       value="${gazettementDate}" 
                       required>
            `;
            form.appendChild(gazettementField);
        } else if (collectionName === 'payment') {
            // Name field
            const nameField = document.createElement('div');
            nameField.className = 'form-group';
            nameField.innerHTML = `
                <label for="name">Name *</label>
                <input type="text" id="name" name="name" 
                       value="${currentData.name || ''}" 
                       required>
            `;
            form.appendChild(nameField);

            // Amount field
            const amountField = document.createElement('div');
            amountField.className = 'form-group';
            amountField.innerHTML = `
                <label for="amount">Amount (RM) *</label>
                <input type="number" id="amount" name="amount" 
                       value="${currentData.amount || ''}" 
                       min="0" step="0.01" required>
            `;
            form.appendChild(amountField);

            // Course field
            const courseField = document.createElement('div');
            courseField.className = 'form-group';
            courseField.innerHTML = `
                <label for="course">Course *</label>
                <input type="text" id="course" name="course" 
                       value="${currentData.course || ''}" 
                       required>
            `;
            form.appendChild(courseField);

            // Status field
            const statusField = document.createElement('div');
            statusField.className = 'form-group';
            statusField.innerHTML = `
                <label for="status">Status *</label>
                <select id="status" name="status" required>
                    <option value="">Select Status</option>
                    <option value="pending" ${currentData.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="approved" ${currentData.status === 'approved' ? 'selected' : ''}>Approved</option>
                    <option value="rejected" ${currentData.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
            `;
            form.appendChild(statusField);

            // Date Submitted field
            const dateSubmittedField = document.createElement('div');
            dateSubmittedField.className = 'form-group';
            let submittedDate = '';
            if (currentData.dateSubmitted) {
                if (currentData.dateSubmitted.toDate) {
                    submittedDate = currentData.dateSubmitted.toDate().toISOString().split('T')[0];
                } else if (currentData.dateSubmitted instanceof Date) {
                    submittedDate = currentData.dateSubmitted.toISOString().split('T')[0];
                } else {
                    const date = new Date(currentData.dateSubmitted);
                    submittedDate = isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
                }
            }
            dateSubmittedField.innerHTML = `
                <label for="dateSubmitted">Date Submitted *</label>
                <input type="date" id="dateSubmitted" name="dateSubmitted" 
                       value="${submittedDate}" 
                       required>
            `;
            form.appendChild(dateSubmittedField);

            // Proof field
            const proofField = document.createElement('div');
            proofField.className = 'form-group';
            proofField.innerHTML = `
                <label for="proof">Proof URL</label>
                <input type="url" id="proof" name="proof" 
                       value="${currentData.proof || ''}" 
                       placeholder="Enter URL to payment proof">
            `;
            form.appendChild(proofField);
        } else if (collectionName === 'certificates') {
            // Name field
            const nameField = document.createElement('div');
            nameField.className = 'form-group';
            nameField.innerHTML = `
                <label for="name">Name *</label>
                <input type="text" id="name" name="name" 
                       value="${currentData.name || ''}" 
                       required>
            `;
            form.appendChild(nameField);

            // License No. field
            const licenseNoField = document.createElement('div');
            licenseNoField.className = 'form-group';
            licenseNoField.innerHTML = `
                <label for="licenseNo">License No. *</label>
                <input type="text" id="licenseNo" name="licenseNo" 
                       value="${currentData.licenseNo || ''}" 
                       required>
            `;
            form.appendChild(licenseNoField);

            // Certificate Name field
            const certificateNameField = document.createElement('div');
            certificateNameField.className = 'form-group';
            certificateNameField.innerHTML = `
                <label for="certificateName">Certificate Name *</label>
                <input type="text" id="certificateName" name="certificateName" 
                       value="${currentData.certificateName || ''}" 
                       required>
            `;
            form.appendChild(certificateNameField);

            // Status field
            const statusField = document.createElement('div');
            statusField.className = 'form-group';
            statusField.innerHTML = `
                <label for="status">Status *</label>
                <select id="status" name="status" required>
                    <option value="">Select Status</option>
                    <option value="active" ${currentData.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="expired" ${currentData.status === 'expired' ? 'selected' : ''}>Expired</option>
                    <option value="pending" ${currentData.status === 'pending' ? 'selected' : ''}>Pending</option>
                </select>
            `;
            form.appendChild(statusField);

            // Issued At field
            const issuedAtField = document.createElement('div');
            issuedAtField.className = 'form-group';
            let issuedDate = '';
            if (currentData.issuedAt) {
                if (currentData.issuedAt.toDate) {
                    issuedDate = currentData.issuedAt.toDate().toISOString().split('T')[0];
                } else if (currentData.issuedAt instanceof Date) {
                    issuedDate = currentData.issuedAt.toISOString().split('T')[0];
                } else {
                    const date = new Date(currentData.issuedAt);
                    issuedDate = isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
                }
            }
            issuedAtField.innerHTML = `
                <label for="issuedAt">Issued At *</label>
                <input type="date" id="issuedAt" name="issuedAt" 
                       value="${issuedDate}" 
                       required>
            `;
            form.appendChild(issuedAtField);

            // Expires At field
            const expireAtField = document.createElement('div');
            expireAtField.className = 'form-group';
            let expireDate = '';
            if (currentData.expiresAt) {
                if (currentData.expiresAt.toDate) {
                    expireDate = currentData.expiresAt.toDate().toISOString().split('T')[0];
                } else if (currentData.expiresAt instanceof Date) {
                    expireDate = currentData.expiresAt.toISOString().split('T')[0];
                } else {
                    const date = new Date(currentData.expiresAt);
                    expireDate = isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
                }
            }
            expireAtField.innerHTML = `
                <label for="expiresAt">Expires At *</label>
                <input type="date" id="expiresAt" name="expiresAt" 
                       value="${expireDate}" 
                       required>
            `;
            form.appendChild(expireAtField);
        } else {
            // Handle other collections as before
            fields.forEach(field => {
                const fieldGroup = document.createElement('div');
                fieldGroup.className = 'form-group';
                fieldGroup.innerHTML = `
                    <label for="${field}">${field}</label>
                    <input type="text" id="${field}" name="${field}" value="${currentData[field] || ''}">
                `;
                form.appendChild(fieldGroup);
            });
        }

        // Add submit button
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'btn-primary';
        submitButton.textContent = currentData.id ? 'Update' : 'Create';
        form.appendChild(submitButton);

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                if (key === 'issuedAt' || key === 'expiresAt') {
                    // Convert date string to Firestore Timestamp
                    data[key] = firebase.firestore.Timestamp.fromDate(new Date(value));
                } else {
                    data[key] = value;
                }
            });
            await onSubmit(collectionName, currentData.id, data);
        });

        this.modalBodyContent.appendChild(form);
    },

    showEditForm(collectionName, docId, currentData) {
        this.showModal(`Edit ${collectionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
        this.createForm(collectionName, [], currentData, async (collectionName, docId, data) => {
            try {
                await handleFormSubmit(collectionName, docId, data);
            } catch (error) {
                console.error('Error in edit form submission:', error);
                alert(`Error: ${error.message}`);
            }
        });
    },

    async handleDelete(collectionName, docId) {
        if (!confirm(`Are you sure you want to delete this ${collectionName.replace(/_/g, ' ')}?`)) {
                return;
            }

        try {
            if (collectionName.toLowerCase() === 'users') {
                // Get the user document first
                const userDoc = await firebase.firestore().collection('users').doc(docId).get();
                if (!userDoc.exists) {
                    throw new Error('User not found');
                }

                const userData = userDoc.data();
                
                // Delete from Firebase Authentication if email exists
                if (userData.email) {
                    try {
                        const userRecord = await firebase.auth().getUserByEmail(userData.email);
                        await firebase.auth().deleteUser(userRecord.uid);
                        console.log('Successfully deleted user from Authentication');
                    } catch (authError) {
                        console.error('Error deleting from Authentication:', authError);
                        // Continue with Firestore deletion even if Auth deletion fails
                    }
                }

                // Delete from Firestore
                await firebase.firestore().collection('users').doc(docId).delete();
                console.log('Successfully deleted user from Firestore');
            } else {
                // Handle other collections
                await api.deleteDocument(collectionName, docId);
            }

            // Refresh the data display using the stored callback
            if (this.loadCollectionDataCallback) {
                this.loadCollectionDataCallback(collectionName);
            }
            alert('Item deleted successfully!');
        } catch (error) {
            console.error('Error deleting item:', error);
            alert(`Error deleting item: ${error.message}`);
        }
    },

    formatFieldName(field) {
        return field.replace(/([A-Z])/g, ' $1')
                   .replace(/_/g, ' ')
                   .replace(/\b\w/g, l => l.toUpperCase());
    },

    formatFieldValue(value) {
        if (value === null || value === undefined) return '-';
        if (value instanceof Date) return value.toLocaleDateString();
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        return value.toString();
    },

    showProofImage(imgUrl) {
        const imageModal = document.getElementById('image-modal');
        const modalImage = document.getElementById('modal-image');
        // Add "..\" to the beginning and convert backslashes to forward slashes for the image src
        const formattedUrl = '..\\' + imgUrl.replace(/\\\\/g, '/');
        modalImage.src = formattedUrl;
        imageModal.style.display = 'block';
    }
};
