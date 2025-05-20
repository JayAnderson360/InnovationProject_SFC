// ui.js - Handles DOM manipulation and UI updates

const ui = {
    sidebarLinksContainer: document.getElementById('sidebar-links'),
    dataDisplayContainer: document.getElementById('data-display'),
    currentCollectionTitle: document.getElementById('current-collection-title'),
    addNewButton: document.getElementById('add-new-button'),
    formModal: document.getElementById('form-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalBodyContent: document.getElementById('modal-body-content'),
    closeModalButton: document.getElementById('close-modal-button'),

    init(collections, loadCollectionCallback, showAddFormCallback) {
        this.populateSidebar(collections, loadCollectionCallback);
        this.addNewButton.addEventListener('click', () => {
            const currentCollection = this.currentCollectionTitle.textContent.replace('Manage ', '');
            if (currentCollection && currentCollection !== 'Dashboard') {
                 showAddFormCallback(currentCollection);
            }
        });
        this.closeModalButton.addEventListener('click', () => this.hideModal());
        window.addEventListener('click', (event) => {
            if (event.target === this.formModal) {
                this.hideModal();
            }
        });
    },

    populateSidebar(collections, loadCollectionCallback) {
        this.sidebarLinksContainer.innerHTML = ''; // Clear existing links
        collections.forEach(collection => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.dataset.collection = collection;
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-folder'; // Generic folder icon
            
            const span = document.createElement('span');
            span.textContent = collection.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Format name

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

    displayCollectionData(collectionName, data, fields, onEdit, onDelete) {
        const normalizedCollectionName = collectionName.toLowerCase();
        
        // Set the title and show add button
        this.currentCollectionTitle.textContent = `Manage ${collectionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
        this.addNewButton.style.display = 'inline-block';

        if (!data || data.length === 0) {
            this.dataDisplayContainer.innerHTML = `<p>No data available for ${collectionName}.</p>`;
            return;
        }

        // Create table
        const table = document.createElement('table');
        table.className = 'data-table';

        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        // Special handling for specific collections
        if (normalizedCollectionName === 'users') {
            // Add ID column first
            const idTh = document.createElement('th');
            idTh.textContent = 'ID';
            headerRow.appendChild(idTh);

            const userFields = ['name', 'email', 'password', 'role', 'phoneNumber', 'licenseNumber'];
            userFields.forEach(field => {
                const th = document.createElement('th');
                th.textContent = field.charAt(0).toUpperCase() + field.slice(1);
                headerRow.appendChild(th);
            });
        } else if (normalizedCollectionName === 'parks') {
            // Add ID column first
            const idTh = document.createElement('th');
            idTh.textContent = 'ID';
            headerRow.appendChild(idTh);

            const parkFields = ['name', 'location', 'type', 'landArea', 'marineArea', 'dateOfGazettement'];
            parkFields.forEach(field => {
                const th = document.createElement('th');
                th.textContent = field.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, l => l.toUpperCase());
                headerRow.appendChild(th);
            });
        } else {
            // Default behavior for other collections
            fields.forEach(field => {
                const th = document.createElement('th');
                th.textContent = field.charAt(0).toUpperCase() + field.slice(1);
                headerRow.appendChild(th);
            });
        }

        // Add actions column
        const actionsTh = document.createElement('th');
        actionsTh.textContent = 'Actions';
        headerRow.appendChild(actionsTh);
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');
        data.forEach(item => {
            const row = document.createElement('tr');
            
            // Special handling for specific collections
            if (normalizedCollectionName === 'users') {
                // Add ID cell first
                const idTd = document.createElement('td');
                idTd.textContent = item.id;
                row.appendChild(idTd);

                const userFields = ['name', 'email', 'password', 'role', 'phoneNumber', 'licenseNumber'];
                userFields.forEach(field => {
                    const td = document.createElement('td');
                    // Special handling for password field
                    if (field === 'password') {
                        const passwordContainer = document.createElement('div');
                        passwordContainer.style.display = 'flex';
                        passwordContainer.style.alignItems = 'center';
                        passwordContainer.style.gap = '8px';

                        // Create eye icon
                        const eyeIcon = document.createElement('i');
                        eyeIcon.className = 'fas fa-eye';
                        eyeIcon.style.cursor = 'pointer';
                        eyeIcon.style.color = '#666';
                        
                        // Create password text
                        const passwordText = document.createElement('span');
                        passwordText.textContent = '••••••••';
                        passwordText.dataset.password = item[field] || ''; // Store actual password in data attribute
                        
                        // Add click handler for eye icon
                        eyeIcon.addEventListener('click', () => {
                            if (passwordText.textContent === '••••••••') {
                                passwordText.textContent = passwordText.dataset.password;
                                eyeIcon.className = 'fas fa-eye-slash';
                            } else {
                                passwordText.textContent = '••••••••';
                                eyeIcon.className = 'fas fa-eye';
                            }
                        });

                        passwordContainer.appendChild(eyeIcon);
                        passwordContainer.appendChild(passwordText);
                        td.appendChild(passwordContainer);
                    } else if (field === 'phoneNumber' || field === 'licenseNumber') {
                        // Only show these fields if the user is a Park Guide
                        if (item.role === 'Park Guide') {
                            if (field === 'phoneNumber') {
                                td.textContent = item[field] || '-';
                            } else if (field === 'licenseNumber') {
                                td.textContent = item[field] || 'Not Assigned';
                            }
                        } else {
                            td.textContent = '-';
                        }
                    } else {
                        td.textContent = item[field] || '';
                    }
                    row.appendChild(td);
                });
            } else if (normalizedCollectionName === 'parks') {
                // Add ID cell first
                const idTd = document.createElement('td');
                idTd.textContent = item.id;
                row.appendChild(idTd);

                const parkFields = ['name', 'location', 'type', 'landArea', 'marineArea', 'dateOfGazettement'];
                parkFields.forEach(field => {
                    const td = document.createElement('td');
                    let value = item[field];
                    
                    // Format date if it's a date field
                    if (field === 'dateOfGazettement' && value) {
                        if (value.toDate && typeof value.toDate === 'function') {
                            value = value.toDate().toLocaleDateString();
                        } else if (value instanceof Date) {
                            value = value.toLocaleDateString();
                        }
                    }
                    
                    // Format area values if they exist
                    if ((field === 'landArea' || field === 'marineArea')) {
                        value = value === 0 ? '0.0' : value;
                        value = `${value} km²`;
                    }
                    
                    td.textContent = value || '';
                    row.appendChild(td);
                });
            } else {
                // Default behavior for other collections
                fields.forEach(field => {
                    const td = document.createElement('td');
                    td.textContent = item[field] || '';
                    row.appendChild(td);
                });
            }

            // Add actions column
            const actionsTd = document.createElement('td');
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.onclick = () => onEdit(collectionName, item.id, item);
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => onDelete(collectionName, item.id);
            actionsTd.appendChild(editButton);
            actionsTd.appendChild(deleteButton);
            row.appendChild(actionsTd);
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        // Clear and append
        this.dataDisplayContainer.innerHTML = '';
        this.dataDisplayContainer.appendChild(table);
    },

    showModal(title) {
        this.modalTitle.textContent = title;
        this.formModal.style.display = 'block';
    },

    hideModal() {
        this.formModal.style.display = 'none';
        this.modalBodyContent.innerHTML = ''; // Clear form
    },

    createForm(collectionName, fields, currentData = {}, submitCallback) {
        const form = document.createElement('form');
        form.id = 'data-form';

        // Define the order of fields for specific collections
        const userFieldOrder = ['name', 'email', 'password', 'role'];
        const parkFieldOrder = ['name', 'location', 'type', 'landArea', 'marineArea', 'dateOfGazettement'];
        
        // If this is a specific collection, use the ordered fields
        const normalizedCollectionName = collectionName.toLowerCase();
        let orderedFields;
        if (normalizedCollectionName === 'users') {
            orderedFields = userFieldOrder;
        } else if (normalizedCollectionName === 'parks') {
            orderedFields = parkFieldOrder;
        } else {
            orderedFields = fields;
        }

        orderedFields.forEach(field => {
            // Skip 'id' field for forms, or make it read-only if needed for display
            if (field.toLowerCase() === 'id') return;

            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';

            const label = document.createElement('label');
            label.htmlFor = `field-${field}`;
            label.textContent = field.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, l => l.toUpperCase());
            
            let input;
            // Basic type detection - can be expanded
            const value = currentData[field];
            
            // Special handling for specific fields
            if (field === 'role') {
                input = document.createElement('select');
                const options = [
                    { value: 'General Users', text: 'General Users' },
                    { value: 'Admin', text: 'Admin' },
                    { value: 'Park Guide', text: 'Park Guide' }
                ];
                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.text;
                    input.appendChild(option);
                });
                input.value = value || 'General Users'; // Default to General Users if no value

                // Add event listener for role change
                input.addEventListener('change', (e) => {
                    const phoneNumberGroup = form.querySelector('#phone-number-group');
                    const licenseNumberGroup = form.querySelector('#license-number-group');
                    
                    if (e.target.value === 'Park Guide') {
                        if (phoneNumberGroup) phoneNumberGroup.style.display = 'block';
                        if (licenseNumberGroup) licenseNumberGroup.style.display = 'block';
                    } else {
                        if (phoneNumberGroup) phoneNumberGroup.style.display = 'none';
                        if (licenseNumberGroup) licenseNumberGroup.style.display = 'none';
                    }
                });
            } else if (field === 'type' && normalizedCollectionName === 'parks') {
                input = document.createElement('select');
                const options = [
                    { value: 'National Park', text: 'National Park' },
                    { value: 'Nature Reserve', text: 'Nature Reserve' },
                    { value: 'Wildlife Sanctuary', text: 'Wildlife Sanctuary' }
                ];
                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.text;
                    input.appendChild(option);
                });
                input.value = value || 'National Park'; // Default to National Park if no value
            } else if (field === 'location' && normalizedCollectionName === 'parks') {
                input = document.createElement('select');
                const sarawakStates = [
                    'Kuching',
                    'Sri Aman',
                    'Sibu',
                    'Miri',
                    'Limbang',
                    'Sarikei',
                    'Kapit',
                    'Bintulu',
                    'Mukah',
                    'Betong',
                    'Samarahan',
                    'Serian'
                ];
                sarawakStates.forEach(state => {
                    const option = document.createElement('option');
                    option.value = state;
                    option.textContent = state;
                    input.appendChild(option);
                });
                input.value = value || 'Kuching'; // Default to Kuching if no value
            } else if (field === 'email') {
                input = document.createElement('input');
                input.type = 'email';
                input.value = value || '';
                input.required = true;
            } else if (field === 'password') {
                input = document.createElement('input');
                input.type = 'password';
                input.value = value || '';
                input.required = !currentData.id; // Required only for new users
            } else if (field === 'landArea' || field === 'marineArea') {
                input = document.createElement('input');
                input.type = 'number';
                input.step = '0.1';
                input.min = '0';
                input.value = value || '0.0';
                input.required = true;
            } else if (field === 'dateOfGazettement') {
                input = document.createElement('input');
                input.type = 'date';
                if (value) {
                    if (value.toDate && typeof value.toDate === 'function') {
                        input.value = value.toDate().toISOString().split('T')[0];
                    } else if (value instanceof Date) {
                        input.value = value.toISOString().split('T')[0];
                    } else {
                        input.value = value;
                    }
                }
                input.required = true;
            } else if (typeof value === 'boolean') {
                input = document.createElement('select');
                const optTrue = document.createElement('option');
                optTrue.value = 'true';
                optTrue.textContent = 'True';
                const optFalse = document.createElement('option');
                optFalse.value = 'false';
                optFalse.textContent = 'False';
                input.appendChild(optTrue);
                input.appendChild(optFalse);
                input.value = String(value);
            } else if (typeof value === 'number') {
                input = document.createElement('input');
                input.type = 'number';
                input.value = value || 0;
            } else if (value && value.toDate && typeof value.toDate === 'function') { // Firestore Timestamp
                input = document.createElement('input');
                input.type = 'date';
                input.value = value.toDate().toISOString().split('T')[0];
            } else if (String(value).length > 100 || String(value).includes('\\n')) { // Heuristic for textarea
                input = document.createElement('textarea');
                input.value = value || '';
            }
            else {
                input = document.createElement('input');
                input.type = 'text';
                input.value = value || '';
                input.required = true;
            }
            
            input.id = `field-${field}`;
            input.name = field;

            formGroup.appendChild(label);
            formGroup.appendChild(input);
            form.appendChild(formGroup);
        });

        // Add phone number field for Park Guides
        const phoneNumberGroup = document.createElement('div');
        phoneNumberGroup.id = 'phone-number-group';
        phoneNumberGroup.className = 'form-group';
        phoneNumberGroup.style.display = currentData.role === 'Park Guide' ? 'block' : 'none';

        const phoneLabel = document.createElement('label');
        phoneLabel.htmlFor = 'phone-number';
        phoneLabel.textContent = 'Phone Number';

        const phoneInput = document.createElement('input');
        phoneInput.type = 'text';
        phoneInput.id = 'phone-number';
        phoneInput.name = 'phoneNumber';
        phoneInput.pattern = '01[0-9]-?[0-9]{3}-?[0-9]{4}|01[0-9]{9}';
        phoneInput.placeholder = '01x-xxx-xxxx or 01xxxxxxxx';
        phoneInput.value = currentData.phoneNumber || '';
        phoneInput.required = currentData.role === 'Park Guide';

        // Add input event listener to format phone number
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            if (value.length > 0) {
                if (value.length <= 3) {
                    value = value;
                } else if (value.length <= 6) {
                    value = value.slice(0, 3) + '-' + value.slice(3);
                } else {
                    value = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6, 10);
                }
            }
            e.target.value = value;
        });

        phoneNumberGroup.appendChild(phoneLabel);
        phoneNumberGroup.appendChild(phoneInput);
        form.appendChild(phoneNumberGroup);

        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'btn-primary';
        submitButton.textContent = currentData.id ? 'Update' : 'Create';
        
        modalFooter.appendChild(submitButton);
        form.appendChild(modalFooter);

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {};

            // Validate required fields
            const requiredFields = ['name', 'email', 'password', 'role'];
            const missingFields = [];

            requiredFields.forEach(field => {
                const value = formData.get(field);
                if (!value) {
                    missingFields.push(field);
                }
            });

            // Additional validation for Park Guide
            if (formData.get('role') === 'Park Guide' && !formData.get('phoneNumber')) {
                missingFields.push('phoneNumber');
            }

            if (missingFields.length > 0) {
                alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
                return;
            }

            // Process all fields
            fields.forEach(field => {
                if (field.toLowerCase() === 'id') return; // Don't include ID in submitted data if it's auto-generated
                
                const formInput = form.elements[field];
                if (formInput) {
                    if (formInput.type === 'number') {
                        data[field] = parseFloat(formData.get(field));
                    } else if (formInput.type === 'date') {
                        data[field] = new Date(formData.get(field));
                    } else if (formInput.tagName.toLowerCase() === 'select' && (formData.get(field) === 'true' || formData.get(field) === 'false')) {
                        data[field] = formData.get(field) === 'true';
                    } else {
                        data[field] = formData.get(field);
                    }
                }
            });

            // Add phone number for Park Guides
            if (formData.get('role') === 'Park Guide') {
                // Format phone number before storing
                let phoneNumber = formData.get('phoneNumber');
                if (phoneNumber) {
                    // Remove any non-digit characters
                    phoneNumber = phoneNumber.replace(/\D/g, '');
                    // Format as XXX-XXX-XXXX
                    phoneNumber = phoneNumber.slice(0, 3) + '-' + phoneNumber.slice(3, 6) + '-' + phoneNumber.slice(6, 10);
                }
                data.phoneNumber = phoneNumber;
            }

            // Ensure all required fields are present
            data.name = formData.get('name');
            data.email = formData.get('email');
            data.password = formData.get('password');
            data.role = formData.get('role');

            submitCallback(collectionName, currentData.id, data);
        });
        
        this.modalBodyContent.innerHTML = ''; // Clear previous form
        this.modalBodyContent.appendChild(form);
    }
};
