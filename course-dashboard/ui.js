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
        if (normalizedCollectionName === 'courses') {
            // Add ID column first
            const idTh = document.createElement('th');
            idTh.textContent = 'ID';
            headerRow.appendChild(idTh);

            const courseFields = ['name', 'description', 'duration', 'level', 'price', 'createdAt'];
            courseFields.forEach(field => {
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
            if (normalizedCollectionName === 'courses') {
                // Add ID cell first
                const idTd = document.createElement('td');
                idTd.textContent = item.id;
                row.appendChild(idTd);

                const courseFields = ['name', 'description', 'duration', 'level', 'price', 'createdAt'];
                courseFields.forEach(field => {
                    const td = document.createElement('td');
                    let value = item[field];
                    
                    // Format date if it's a date field
                    if (field === 'createdAt' && value) {
                        if (value.toDate && typeof value.toDate === 'function') {
                            value = value.toDate().toLocaleDateString();
                        } else if (value instanceof Date) {
                            value = value.toLocaleDateString();
                        }
                    }
                    
                    // Format price if it's a price field
                    if (field === 'price') {
                        value = `RM ${parseFloat(value).toFixed(2)}`;
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
        const courseFieldOrder = ['name', 'description', 'duration', 'level', 'price'];
        
        // If this is a specific collection, use the ordered fields
        const normalizedCollectionName = collectionName.toLowerCase();
        let orderedFields;
        if (normalizedCollectionName === 'courses') {
            orderedFields = courseFieldOrder;
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
            if (field === 'level') {
                input = document.createElement('select');
                const options = [
                    { value: 'Beginner', text: 'Beginner' },
                    { value: 'Intermediate', text: 'Intermediate' },
                    { value: 'Advanced', text: 'Advanced' }
                ];
                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.text;
                    input.appendChild(option);
                });
                input.value = value || 'Beginner'; // Default to Beginner if no value
            } else if (field === 'duration') {
                input = document.createElement('input');
                input.type = 'number';
                input.min = '1';
                input.value = value || '1';
                input.required = true;
            } else if (field === 'price') {
                input = document.createElement('input');
                input.type = 'number';
                input.step = '0.01';
                input.min = '0';
                input.value = value || '0.00';
                input.required = true;
            } else if (field === 'description') {
                input = document.createElement('textarea');
                input.value = value || '';
                input.required = true;
            } else {
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

            submitCallback(collectionName, currentData.id, data);
        });
        
        this.modalBodyContent.innerHTML = ''; // Clear previous form
        this.modalBodyContent.appendChild(form);
    }
}; 