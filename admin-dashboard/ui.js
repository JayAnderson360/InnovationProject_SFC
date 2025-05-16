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

    displayCollectionData(collectionName, data, fields, showEditFormCallback, deleteItemCallback) {
        this.currentCollectionTitle.textContent = `Manage ${collectionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
        this.addNewButton.style.display = 'inline-block';
        this.dataDisplayContainer.innerHTML = ''; // Clear previous data

        if (!data || data.length === 0) {
            this.dataDisplayContainer.innerHTML = `<p>No data found in ${collectionName}.</p>`;
            return;
        }

        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Table Headers
        const trHead = document.createElement('tr');
        fields.forEach(field => {
            const th = document.createElement('th');
            th.textContent = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            trHead.appendChild(th);
        });
        const thActions = document.createElement('th');
        thActions.textContent = 'Actions';
        trHead.appendChild(thActions);
        thead.appendChild(trHead);

        // Table Body
        data.forEach(item => {
            const trBody = document.createElement('tr');
            fields.forEach(field => {
                const td = document.createElement('td');
                let value = item[field];
                if (typeof value === 'object' && value !== null) {
                     // Handle Firestore Timestamps or other objects
                    if (value.toDate && typeof value.toDate === 'function') {
                        td.textContent = value.toDate().toLocaleDateString();
                    } else {
                        td.textContent = JSON.stringify(value).substring(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '');
                    }
                } else {
                     td.textContent = value === undefined || value === null ? '' : String(value).substring(0,100) + (String(value).length > 100 ? '...' : '');
                }
                trBody.appendChild(td);
            });

            // Action Buttons
            const tdActions = document.createElement('td');
            tdActions.className = 'actions';
            
            const editButton = document.createElement('button');
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.className = 'btn-icon edit';
            editButton.title = 'Edit';
            editButton.addEventListener('click', () => showEditFormCallback(collectionName, item.id, item));
            
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.className = 'btn-icon delete';
            deleteButton.title = 'Delete';
            deleteButton.addEventListener('click', () => deleteItemCallback(collectionName, item.id));
            
            tdActions.appendChild(editButton);
            tdActions.appendChild(deleteButton);
            trBody.appendChild(tdActions);
            tbody.appendChild(trBody);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        this.dataDisplayContainer.appendChild(tableContainer);
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

        fields.forEach(field => {
            // Skip 'id' field for forms, or make it read-only if needed for display
            if (field.toLowerCase() === 'id') return;

            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';

            const label = document.createElement('label');
            label.htmlFor = `field-${field}`;
            label.textContent = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            let input;
            // Basic type detection - can be expanded
            const value = currentData[field];
            if (typeof value === 'boolean') {
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
            }
            
            input.id = `field-${field}`;
            input.name = field;

            formGroup.appendChild(label);
            formGroup.appendChild(input);
            form.appendChild(formGroup);
        });

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
            fields.forEach(field => {
                if (field.toLowerCase() === 'id') return; // Don't include ID in submitted data if it's auto-generated
                
                const formInput = form.elements[field];
                if (formInput) {
                    if (formInput.type === 'number') {
                        data[field] = parseFloat(formData.get(field));
                    } else if (formInput.type === 'date') {
                        // Convert date string to Firestore Timestamp if necessary, or store as string
                        data[field] = new Date(formData.get(field)); // Or firebase.firestore.Timestamp.fromDate(...)
                    } else if (formInput.tagName.toLowerCase() === 'select' && (formData.get(field) === 'true' || formData.get(field) === 'false')) {
                        data[field] = formData.get(field) === 'true';
                    }
                    else {
                        data[field] = formData.get(field);
                    }
                }
            });
            submitCallback(collectionName, currentData.id, data);
        });
        
        this.modalBodyContent.innerHTML = ''; // Clear previous form
        this.modalBodyContent.appendChild(form);
    }
};
