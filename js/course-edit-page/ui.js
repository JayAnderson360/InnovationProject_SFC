// js/course-edit-page/ui.js - Handles DOM manipulation and UI updates for the course edit page
console.log("course-edit-page/ui.js loaded");

class CourseEditUI {
    constructor() {
        this.courseTitleEl = document.getElementById('cp-course-title');
        this.courseDescriptionEl = document.getElementById('cp-course-description');
        this.modulesListEl = document.getElementById('cp-modules-list');
        
        // Metadata fields
        this.courseTypeInput = document.getElementById('cp-course-type');
        this.courseDurationInput = document.getElementById('cp-course-duration');
        this.courseFeeInput = document.getElementById('cp-course-fee');
        this.certificateNameInput = document.getElementById('cp-certificate-name');
        this.courseImageUrlInput = document.getElementById('cp-course-image-url');
        this.publishToggle = document.getElementById('cp-publish-toggle');
        this.publishStatusText = document.getElementById('cp-publish-status-text');

        // Modals (can be expanded later)
        this.genericModal = document.getElementById('cp-generic-modal');
        this.genericModalTitle = document.getElementById('cp-generic-modal-title');
        this.genericModalBody = document.getElementById('cp-generic-modal-body');
        this.genericModalSaveBtn = document.getElementById('cp-generic-modal-save-btn');

        this.currentCourseData = null; // To store loaded course data
        this.api = null; // To store reference to API instance
        this.courseId = null; // To store current course ID
        this.testsData = {}; // To store loaded tests data for quick lookup
        this.currentManagingTestDetails = null; // To store details of the test being managed in the modal
    }

    initializeEventListeners(courseId, apiInstance) {
        this.api = apiInstance;
        this.courseId = courseId;

        const saveMetaBtn = document.getElementById('cp-admin-save-meta-btn');
        if (saveMetaBtn) {
            saveMetaBtn.addEventListener('click', async () => {
                const metadata = {
                    courseType: this.courseTypeInput.value.trim(),
                    durationMonths: parseInt(this.courseDurationInput.value, 10) || 0,
                    courseFee: parseFloat(this.courseFeeInput.value) || 0,
                    certificateName: this.certificateNameInput.value.trim(),
                    imgUrl: this.courseImageUrlInput.value.trim(),
                    published: this.publishToggle.checked
                };
                try {
                    await this.api.updateCourseMetadata(this.courseId, metadata);
                    // Update currentCourseData with new metadata
                    if (this.currentCourseData) {
                        this.currentCourseData = { ...this.currentCourseData, ...metadata };
                    }
                    alert('Course metadata updated successfully!'); // Simple feedback
                    this.updatePublishStatusText(metadata.published); // Update text next to toggle
                } catch (error) {
                    console.error("Error updating course metadata:", error);
                    alert('Failed to update course metadata. See console for details.');
                }
            });
        }

        if (this.publishToggle) {
            this.publishToggle.addEventListener('change', () => {
                this.updatePublishStatusText(this.publishToggle.checked);
                // The actual save of publish status is handled by saveMetaBtn for now
                // Or, we can make it save immediately:
                /*
                try {
                    await this.api.updatePublishStatus(this.courseId, this.publishToggle.checked);
                    if (this.currentCourseData) {
                        this.currentCourseData.published = this.publishToggle.checked;
                    }
                    alert('Publish status updated!');
                } catch (error) {
                    console.error("Error updating publish status:", error);
                    alert('Failed to update publish status.');
                }
                */
            });
        }

        // Edit Title Button
        const editTitleBtn = document.getElementById('cp-admin-edit-course-title-btn');
        if (editTitleBtn) {
            editTitleBtn.addEventListener('click', () => {
                const currentTitle = this.currentCourseData ? this.currentCourseData.title : '';
                this.openModal('cp-generic-modal', 'Edit Course Title',
                    (modalBody) => { // Function to populate modal body
                        modalBody.innerHTML = `
                            <div class="form-group">
                                <label for="modal-course-title">Course Title:</label>
                                <input type="text" id="modal-course-title" class="form-control" value="${currentTitle.replace(/"/g, '&quot;')}">
                            </div>
                        `;
                    },
                    async () => { // OnSave callback
                        const newTitle = document.getElementById('modal-course-title').value.trim();
                        if (newTitle) {
                            try {
                                await this.api.updateCourseTitle(this.courseId, newTitle);
                                this.courseTitleEl.textContent = newTitle;
                                if (this.currentCourseData) this.currentCourseData.title = newTitle;
                                this.closeModal('cp-generic-modal');
                                alert('Course title updated successfully!');
                            } catch (error) {
                                console.error("Error updating course title:", error);
                                alert('Failed to update course title.');
                            }
                        } else {
                            alert('Title cannot be empty.');
                        }
                    }
                );
            });
        }

        // Edit Description Button
        const editDescBtn = document.getElementById('cp-admin-edit-description-btn');
        if (editDescBtn) {
            editDescBtn.addEventListener('click', () => {
                const currentDescription = this.currentCourseData ? this.currentCourseData.description : '';
                this.openModal('cp-generic-modal', 'Edit Course Description',
                    (modalBody) => {
                        modalBody.innerHTML = `
                            <div class="form-group">
                                <label for="modal-course-description">Course Description:</label>
                                <textarea id="modal-course-description" class="form-control" rows="5">${currentDescription}</textarea>
                            </div>
                        `;
                    },
                    async () => {
                        const newDescription = document.getElementById('modal-course-description').value.trim();
                        try {
                            await this.api.updateCourseDescription(this.courseId, newDescription);
                            this.courseDescriptionEl.textContent = newDescription;
                            if (this.currentCourseData) this.currentCourseData.description = newDescription;
                            this.closeModal('cp-generic-modal');
                            alert('Course description updated successfully!');
                        } catch (error) {
                            console.error("Error updating course description:", error);
                            alert('Failed to update course description.');
                        }
                    }
                );
            });
        }

        // Add Module Button
        const addModuleBtn = document.getElementById('cp-admin-add-module-btn');
        if (addModuleBtn) {
            addModuleBtn.addEventListener('click', () => {
                this.openModal('cp-generic-modal', 'Add New Module',
                    (modalBody) => {
                        modalBody.innerHTML = `
                            <div class="form-group">
                                <label for="modal-module-title">Module Title:</label>
                                <input type="text" id="modal-module-title" class="form-control" placeholder="Enter module title">
                            </div>
                            <div class="form-group">
                                <label for="modal-module-description">Module Description:</label>
                                <textarea id="modal-module-description" class="form-control" rows="5" placeholder="Enter module description"></textarea>
                            </div>
                        `;
                    },
                    async () => {
                        const title = document.getElementById('modal-module-title').value.trim();
                        const content = document.getElementById('modal-module-description').value.trim();

                        if (title) {
                            try {
                                const newModuleData = { title, content, resources: [], testIds: [] }; // Basic structure
                                const result = await this.api.addModule(this.courseId, newModuleData);
                                
                                // Update currentCourseData with the new module structure from API response
                                if (this.currentCourseData) {
                                    this.currentCourseData.modules = result.modules;
                                    this.currentCourseData.moduleOrder = result.moduleOrder;
                                }
                                this.renderModules(result.modules, result.moduleOrder); // Re-render modules list
                                this.closeModal('cp-generic-modal');
                                alert('Module added successfully!');
                            } catch (error) {
                                console.error("Error adding module:", error);
                                alert('Failed to add module. See console for details.');
                            }
                        } else {
                            alert('Module title cannot be empty.');
                        }
                    }
                );
            });
        }

        // Event listeners for dynamically created module edit/delete buttons
        // This needs to use event delegation since modules are re-rendered
        this.modulesListEl.addEventListener('click', async (event) => {
            const target = event.target;
            const editButton = target.closest('.btn-edit-module');
            const deleteButton = target.closest('.btn-delete-module');
            const saveLinksButton = target.closest('.cp-btn-save-module-links');
            const assignTestButton = target.closest('.cp-btn-assign-test');
            const removeLinkButton = target.closest('.cp-btn-remove-link');
            const removeTestButton = target.closest('.cp-btn-remove-test');
            const manageTestButton = target.closest('.cp-btn-manage-test');
            const moduleHeader = target.closest('.cp-module-header');

            if (moduleHeader && !editButton && !deleteButton && !saveLinksButton && !assignTestButton && !removeLinkButton && !removeTestButton && !manageTestButton) { // Toggle module content display
                const moduleElement = moduleHeader.closest('.cp-module');
                const content = moduleElement.querySelector('.cp-module-content');
                if (content) {
                    content.style.display = content.style.display === 'none' ? 'block' : 'none';
                    const toggleIcon = moduleHeader.querySelector('.cp-module-toggle-icon i');
                    if (toggleIcon) {
                        toggleIcon.classList.toggle('fa-chevron-right');
                        toggleIcon.classList.toggle('fa-chevron-down');
                    }
                }
            }

            if (editButton) {
                const moduleElement = editButton.closest('.cp-module');
                const moduleId = moduleElement.dataset.moduleId;
                const moduleData = this.currentCourseData.modules[moduleId];
                // Implement edit module modal interaction here
                this.openEditModuleModal(moduleId, moduleData);
            }

            if (saveLinksButton) {
                const moduleId = saveLinksButton.dataset.moduleid;
                const videoLinkInput = document.getElementById(`module-${moduleId}-videoLink`);
                const documentLinkInput = document.getElementById(`module-${moduleId}-documentLink`);

                const links = {
                    videoLink: videoLinkInput ? videoLinkInput.value.trim() : '',
                    documentLink: documentLinkInput ? documentLinkInput.value.trim() : ''
                };

                try {
                    const result = await this.api.updateModuleLinks(this.courseId, moduleId, links);
                    if (this.currentCourseData && result.modules) {
                        this.currentCourseData.modules = result.modules;
                        // No need to re-render all modules if only links changed and inputs are live
                        // However, if other parts of module data could change, re-rendering is safer.
                        // For now, let's update the stored data and assume inputs reflect current state.
                        // If direct manipulation of module object in currentCourseData is preferred:
                        // this.currentCourseData.modules[moduleId].videoLink = links.videoLink;
                        // this.currentCourseData.modules[moduleId].documentLink = links.documentLink;
                    }
                    alert('Module links updated successfully!');
                } catch (error) {
                    console.error("Error updating module links:", error);
                    alert('Failed to update module links. See console for details.');
                }
            }

            if (assignTestButton) {
                const moduleId = assignTestButton.dataset.moduleid;
                this.openAssignTestModal(moduleId);
            }

            if (removeLinkButton) {
                const moduleId = removeLinkButton.dataset.moduleid;
                const linkType = removeLinkButton.dataset.linktype; // 'videoLink' or 'documentLink'

                if (confirm(`Are you sure you want to remove the ${linkType === 'videoLink' ? 'video' : 'document'} link for this module?`)) {
                    try {
                        const result = await this.api.removeModuleLink(this.courseId, moduleId, linkType);
                        if (this.currentCourseData && result.modules) {
                            this.currentCourseData.modules = result.modules;
                            // Clear the input field in the UI
                            const inputField = document.getElementById(`module-${moduleId}-${linkType}`);
                            if (inputField) {
                                inputField.value = '';
                            }
                        }
                        alert(`${linkType === 'videoLink' ? 'Video' : 'Document'} link removed successfully!`);
                        // Optionally re-render if more complex UI updates are needed beyond clearing input
                        // this.renderModules(this.currentCourseData.modules, this.currentCourseData.moduleOrder);
                    } catch (error) {
                        console.error(`Error removing ${linkType} link:`, error);
                        alert(`Failed to remove ${linkType === 'videoLink' ? 'video' : 'document'} link. See console for details.`);
                    }
                }
            }

            if (removeTestButton) {
                const moduleId = removeTestButton.dataset.moduleid;
                const testId = removeTestButton.dataset.testid;
                const testTitle = this.testsData[testId]?.title || testId; // Use this.testsData

                if (confirm(`Are you sure you want to unassign the test "${testTitle}" from this module?`)) {
                    try {
                        const result = await this.api.unassignTestFromModule(this.courseId, moduleId, testId);
                        if (this.currentCourseData && result.modules) {
                            this.currentCourseData.modules = result.modules;
                        }
                        this.renderModules(this.currentCourseData.modules, this.currentCourseData.moduleOrder);
                        alert('Test unassigned successfully!');
                    } catch (error) {
                        console.error(`Error unassigning test ${testId}:`, error);
                        alert('Failed to unassign test. See console for details.');
                    }
                }
            }

            if (manageTestButton) {
                const testId = manageTestButton.dataset.testid;
                const moduleId = manageTestButton.dataset.moduleid;
                this.openTestManagementModal(testId, moduleId);
            }

            if (deleteButton) {
                const moduleElement = deleteButton.closest('.cp-module');
                const moduleId = moduleElement.dataset.moduleId;
                const moduleTitle = this.currentCourseData.modules[moduleId]?.title || 'this module';
                
                if (confirm(`Are you sure you want to delete the module "${moduleTitle}"? This action cannot be undone.`)) {
                    try {
                        const result = await this.api.deleteModule(this.courseId, moduleId);
                        if (this.currentCourseData) {
                            this.currentCourseData.modules = result.modules;
                            this.currentCourseData.moduleOrder = result.moduleOrder;
                        }
                        this.renderModules(result.modules, result.moduleOrder);
                        alert('Module deleted successfully.');
                    } catch (error) {
                        console.error("Error deleting module:", error);
                        alert('Failed to delete module. See console for details.');
                    }
                }
            }
        });

    }

    displayCourseData(course) {
        if (!course) {
            this.showError("Course data could not be loaded.");
            return;
        }
        this.currentCourseData = course;
        this.testsData = JSON.parse(localStorage.getItem('tests') || '{}'); // Load tests data here

        this.courseTitleEl.textContent = course.title || 'Untitled Course';
        this.courseDescriptionEl.textContent = course.description || 'No description provided.';

        // Populate metadata fields
        this.courseTypeInput.value = course.courseType || '';
        this.courseDurationInput.value = course.durationMonths || '';
        this.courseFeeInput.value = course.courseFee || '';
        this.certificateNameInput.value = course.certificateName || '';
        this.courseImageUrlInput.value = course.imgUrl || ''; // Assuming imgUrl for course image
        
        this.publishToggle.checked = course.published || false;
        this.updatePublishStatusText(course.published || false);

        this.renderModules(course.modules || {}, course.moduleOrder || []);
    }

    updatePublishStatusText(isPublished) {
        this.publishStatusText.textContent = isPublished ? 'Published' : 'Draft';
        this.publishStatusText.className = 'publish-status-text ' + (isPublished ? 'status-published' : 'status-draft'); // Add a base class
    }

    renderModules(modules, moduleOrder) {
        this.modulesListEl.innerHTML = ''; // Clear existing modules
        const testsData = JSON.parse(localStorage.getItem('tests') || '{}'); // Get tests data

        if (!moduleOrder || moduleOrder.length === 0) {
            this.modulesListEl.innerHTML = '<p>No modules yet. Click "Add Module" to create one.</p>';
            return;
        }

        moduleOrder.forEach(moduleId => {
            const module = modules[moduleId];
            if (module) {
                const moduleEl = document.createElement('div');
                moduleEl.className = 'cp-module';
                moduleEl.dataset.moduleId = moduleId;
                
                let testsHtml = '<p>No tests assigned to this module.</p>';
                if (module.testIds && module.testIds.length > 0) {
                    testsHtml = '<ul>' + module.testIds.map(testId => {
                        const test = testsData[testId];
                        const testTitle = test ? test.title : 'Unknown Test';
                        // The button will eventually open the test management modal with context
                        return `<li class="cp-test-item">
                                    <span>${testTitle} (ID: ${testId})</span>
                                    <div>
                                        <button class="cp-btn cp-btn-secondary cp-btn-manage-test" data-testid="${testId}" data-moduleid="${moduleId}" title="Manage Test Settings"><i class="fas fa-cog"></i> Manage</button>
                                        <button class="cp-btn cp-btn-icon cp-btn-remove-test" data-testid="${testId}" data-moduleid="${moduleId}" title="Unassign Test from Module"><i class="fas fa-times-circle"></i></button>
                                    </div>
                                </li>`;
                    }).join('') + '</ul>';
                }

                moduleEl.innerHTML = `
                    <div class="cp-module-header">
                        <div class="cp-module-title-toggle">
                           <span class="cp-module-toggle-icon"><i class="fas fa-chevron-right"></i><h3>${module.title || 'Untitled Module'}</h3></span>
                        </div>
                        <div class="cp-module-header-actions">
                            <button class="cp-btn cp-btn-icon cp-btn-edit btn-edit-module" title="Edit Module"><i class="fas fa-pencil-alt"></i></button>
                            <button class="cp-btn cp-btn-icon cp-btn-delete btn-delete-module" title="Delete Module"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="cp-module-content" style="display: none;">
                         <p class="cp-module-description">${module.content || 'No description.'}</p>
                         
                         <div class="cp-module-links-section">
                            <h4><i class="fas fa-link"></i> Module Links:</h4>
                            <div class="form-group cp-link-input-group">
                                <label for="module-${moduleId}-videoLink">Video Link:</label>
                                <input type="url" id="module-${moduleId}-videoLink" class="form-control cp-module-videoLink-input" value="${module.videoLink || ''}" placeholder="https://example.com/video">
                                <button class="cp-btn cp-btn-icon cp-btn-remove-link" data-moduleid="${moduleId}" data-linktype="videoLink" title="Remove Video Link"><i class="fas fa-times-circle"></i></button>
                            </div>
                            <div class="form-group cp-link-input-group">
                                <label for="module-${moduleId}-documentLink">Document Link:</label>
                                <input type="url" id="module-${moduleId}-documentLink" class="form-control cp-module-documentLink-input" value="${module.documentLink || ''}" placeholder="https://example.com/document.pdf">
                                <button class="cp-btn cp-btn-icon cp-btn-remove-link" data-moduleid="${moduleId}" data-linktype="documentLink" title="Remove Document Link"><i class="fas fa-times-circle"></i></button>
                            </div>
                             <button class="cp-btn cp-btn-primary cp-btn-save-module-links" data-moduleid="${moduleId}" style="margin-top:10px;"><i class="fas fa-save"></i> Save Links</button>
                         </div>

                         <div class="cp-module-tests-section">
                             <h4><i class="fas fa-vial"></i> Tests:</h4>
                             ${testsHtml}
                             <button class="cp-btn cp-btn-add cp-btn-assign-test" data-moduleid="${moduleId}" style="margin-top:10px;"><i class="fas fa-plus"></i> Assign Test</button>
                         </div>
                    </div>
                `;
                this.modulesListEl.appendChild(moduleEl);
            }
        });
    }

    showError(message) {
        // Simple error display, can be enhanced
        const container = document.querySelector('.cp-container');
        const errorEl = document.createElement('p');
        errorEl.className = 'error-message';
        errorEl.style.color = 'red';
        errorEl.textContent = message;
        container.insertBefore(errorEl, container.firstChild);
    }

    // Modal helper methods
    openModal(modalId, title, bodyContent, onSaveCallback) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error("Modal with ID " + modalId + " not found.");
            return;
        }

        const modalTitleEl = modal.querySelector('.cp-modal-title') || document.getElementById(`${modalId}-title`);
        const modalBodyEl = modal.querySelector('.cp-modal-body') || document.getElementById(`${modalId}-body`);
        const saveBtn = modal.querySelector('.cp-modal-save-btn') || document.getElementById(`${modalId}-save-btn`);
        const closeBtn = modal.querySelector('.cp-modal-close-btn'); // Generic close button
        const cancelBtn = modal.querySelector('.cp-btn-secondary.cp-modal-close-btn'); // Specifically target cancel buttons

        if (modalTitleEl) modalTitleEl.textContent = title;
        if (modalBodyEl) modalBodyEl.innerHTML = ''; // Clear previous content
        if (typeof bodyContent === 'string') {
            if (modalBodyEl) modalBodyEl.innerHTML = bodyContent;
        } else if (typeof bodyContent === 'function') {
            if (modalBodyEl) bodyContent(modalBodyEl); // Callback to populate body
        }
        
        if (saveBtn && onSaveCallback) {
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            newSaveBtn.onclick = onSaveCallback; 
        }

        // Setup close button functionality
        if (closeBtn) {
            closeBtn.onclick = () => this.closeModal(modalId);
        }

        // Hide the cancel button if it exists
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }

        // Also allow closing by clicking outside the modal content (optional)
        // window.onclick = (event) => {
        //     if (event.target == modal) {
        //         this.closeModal(modalId);
        //     }
        // };

        modal.style.display = 'block';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            const modalBodyEl = modal.querySelector('.cp-modal-body') || document.getElementById(`${modalId}-body`);
            if (modalBodyEl) modalBodyEl.innerHTML = ''; // Clear body
        }
    }

    openEditModuleModal(moduleId, moduleData) {
        this.openModal('cp-generic-modal', 'Edit Module',
            (modalBody) => {
                modalBody.innerHTML = `
                    <div class="form-group">
                        <label for="modal-edit-module-title">Module Title:</label>
                        <input type="text" id="modal-edit-module-title" class="form-control" value="${(moduleData.title || '').replace(/"/g, '&quot;')}">
                    </div>
                    <div class="form-group">
                        <label for="modal-edit-module-description">Module Content:</label>
                        <textarea id="modal-edit-module-description" class="form-control" rows="5">${moduleData.content || ''}</textarea>
                    </div>
                    <!-- TODO: Add fields for resources and tests here -->
                `;
            },
            async () => {
                const title = document.getElementById('modal-edit-module-title').value.trim();
                const content = document.getElementById('modal-edit-module-description').value.trim();

                if (title) {
                    try {
                        const updatedModuleData = { ...moduleData, title, content }; // Preserve other fields like resources, testIds
                        await this.api.updateModule(this.courseId, moduleId, updatedModuleData);
                        
                        if (this.currentCourseData && this.currentCourseData.modules) {
                            this.currentCourseData.modules[moduleId] = updatedModuleData;
                        }
                        this.renderModules(this.currentCourseData.modules, this.currentCourseData.moduleOrder);
                        this.closeModal('cp-generic-modal');
                        alert('Module updated successfully!');
                    } catch (error) {
                        console.error("Error updating module:", error);
                        alert('Failed to update module. See console for details.');
                    }
                } else {
                    alert('Module title cannot be empty.');
                }
            }
        );
    }

    openAssignTestModal(moduleId) {
        const testsData = JSON.parse(localStorage.getItem('tests') || '{}');
        const currentModule = this.currentCourseData && this.currentCourseData.modules && this.currentCourseData.modules[moduleId];
        const assignedTestIds = currentModule && currentModule.testIds ? currentModule.testIds : [];

        this.openModal('cp-generic-modal', 'Assign Test to Module',
            (modalBody) => {
                let optionsHtml = '<option value="">Select a test to assign</option>';
                for (const testId in testsData) {
                    if (testsData.hasOwnProperty(testId) && !assignedTestIds.includes(testId)) {
                        optionsHtml += `<option value="${testId}">${testsData[testId].title || 'Unnamed Test'} (ID: ${testId})</option>`;
                    }
                }
                if (optionsHtml === '<option value="">Select a test to assign</option>') {
                    optionsHtml = '<option value="">No available tests to assign or all tests already assigned.</option>';
                }

                modalBody.innerHTML = `
                    <div class="form-group">
                        <label for="modal-assign-test-select">Select Test:</label>
                        <select id="modal-assign-test-select" class="form-control">
                            ${optionsHtml}
                        </select>
                    </div>
                    <p class="cp-modal-note">Only tests not already assigned to this module are shown.</p>
                `;
            },
            async () => {
                const selectedTestId = document.getElementById('modal-assign-test-select').value;

                if (!selectedTestId) {
                    alert('Please select a test to assign.');
                    return;
                }

                try {
                    const result = await this.api.assignTestToModule(this.courseId, moduleId, selectedTestId);
                    if (this.currentCourseData && result.modules) {
                        this.currentCourseData.modules = result.modules;
                    }
                    // It is crucial to update the specific module in currentCourseData accurately
                    // if the API returns only the specific module or just a success status.
                    // For now, assuming result.modules contains all modules, which triggers full re-render.
                    this.renderModules(this.currentCourseData.modules, this.currentCourseData.moduleOrder);
                    this.closeModal('cp-generic-modal');
                    alert('Test assigned successfully!');
                } catch (error) {
                    console.error("Error assigning test to module:", error);
                    alert('Failed to assign test. See console for details.');
                }
            }
        );
    }

    async openTestManagementModal(testId, moduleId) {
        const testTitleFromCache = this.testsData[testId]?.title || testId;
        let modalTitle = `Manage Test: ${testTitleFromCache}`;
        let initialModalBodyContent = `<p>Loading test details for ${testTitleFromCache} (ID: ${testId})...</p>`;

        // Open modal immediately with loading state
        this.openModal('cp-test-management-modal', modalTitle,
            (modalBody) => {
                modalBody.innerHTML = initialModalBodyContent;
            },
            async () => {
                // Placeholder for Save Test Changes logic
                console.log("Attempting to save changes for test:", testId);
                alert('Save Test Changes functionality not yet implemented.');
            }
        );

        try {
            const testDetails = await this.api.getTestDetails(testId);
            const modalInstance = document.getElementById('cp-test-management-modal');
            const modalBodyEl = modalInstance?.querySelector('.cp-modal-body');
            const modalTitleEl = modalInstance?.querySelector('.cp-modal-title');

            if (!modalBodyEl || !modalTitleEl) {
                console.error("Could not find modal body or title elements to update after fetching test details.");
                return;
            }

            if (testDetails) {
                modalTitleEl.textContent = `Manage Test: ${testDetails.title || testTitleFromCache}`;
                this.currentManagingTestDetails = testDetails; // Store fetched details

                let questionsHtml = '<p>No questions yet for this test.</p>';
                // Adjusted to handle questions as an object
                if (testDetails.questions && typeof testDetails.questions === 'object' && Object.keys(testDetails.questions).length > 0) {
                    let questionNumber = 0;
                    questionsHtml = Object.entries(testDetails.questions).map(([questionId, q]) => {
                        questionNumber++;
                        let optionsDisplay = '';
                        if (q.type === 'multiple_choice' && Array.isArray(q.options)) {
                            optionsDisplay = '<ul>' + q.options.map(opt => `<li>${opt}</li>`).join('') + '</ul>';
                        }
                        return `<div class="cp-question-item" style="border:1px solid #eee; padding:10px; margin-bottom:10px;" data-question-id="${questionId}">
                                    <div class="cp-question-item-header">
                                        <h4>Question ${questionNumber}: ${q.text || 'N/A'}</h4>
                                        <div class="cp-question-item-actions">
                                            <button class="cp-btn cp-btn-icon cp-btn-edit-question" data-testid="${testId}" data-questionid="${questionId}" title="Edit Question"><i class="fas fa-pencil-alt"></i></button>
                                            <button class="cp-btn cp-btn-icon cp-btn-delete-question" data-testid="${testId}" data-questionid="${questionId}" title="Delete Question"><i class="fas fa-trash"></i></button>
                                        </div>
                                    </div>
                                    <p>Type: ${q.type || 'N/A'}</p>
                                    ${q.type === 'multiple_choice' ? `<p><strong>Options:</strong></p>${optionsDisplay}` : ''}
                                    ${q.correctAnswer ? `<p><strong>Correct Answer:</strong> ${q.correctAnswer}</p>` : ''}
                                 </div>`;
                    }).join('');
                } else if (typeof testDetails.questions === 'object' && Object.keys(testDetails.questions).length === 0) {
                     questionsHtml = '<p>This test currently has no questions.</p>';
                }

                modalBodyEl.innerHTML = `
                    <p><strong>Description:</strong> ${testDetails.description || 'No description provided.'}</p>
                    <hr>
                    <h4>Questions:</h4>
                    <div id="cp-test-questions-list">
                        ${questionsHtml}
                    </div>
                    <button type="button" class="cp-btn cp-btn-add" id="cp-add-question-btn" style="margin-top: 15px;" data-testid="${testId}"><i class="fas fa-plus"></i> Add Question</button>
                `;

                // Re-attach event listener for the dynamically added "Add Question" button if needed
                const addQuestionBtn = modalBodyEl.querySelector('#cp-add-question-btn');
                if (addQuestionBtn) {
                    addQuestionBtn.onclick = () => this.openAddQuestionModal(testId);
                }

                // Add event listener for question actions (edit/delete) within this modal
                this.addQuestionActionListeners(testId, modalBodyEl);

            } else {
                modalBodyEl.innerHTML = `<p>Could not load details for test ID: ${testId}. It might not exist or there was an error.</p>`;
                this.currentManagingTestDetails = null; // Clear if failed
            }
        } catch (error) {
            console.error("Error fetching test details for modal:", error);
            this.currentManagingTestDetails = null; // Clear on error
            const modalInstance = document.getElementById('cp-test-management-modal');
            const modalBodyEl = modalInstance?.querySelector('.cp-modal-body');
            if (modalBodyEl) {
                modalBodyEl.innerHTML = `<p>Error loading test details: ${error.message}</p>`;
            }
        }
    }

    // Placeholder for openAddQuestionModal
    openAddQuestionModal(testId) {
        console.log("openAddQuestionModal called for testId:", testId);
        const testTitle = this.testsData[testId]?.title || testId;

        const genericModal = document.getElementById('cp-generic-modal');
        if (genericModal) {
            genericModal.style.zIndex = '1060'; // Higher than cp-test-management-modal (assuming it's around 1050 or default)
        }

        this.openModal('cp-generic-modal', `Add Question to: ${testTitle}`,
        (modalBody) => {
            modalBody.innerHTML = `
                <div class="form-group">
                    <label for="modal-question-text">Question Text:</label>
                    <input type="text" id="modal-question-text" class="form-control" placeholder="Enter the question">
                </div>
                <div class="form-group">
                    <label for="modal-question-type">Question Type:</label>
                    <select id="modal-question-type" class="form-control">
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="short-answer">Short Answer (Not fully supported yet)</option>
                    </select>
                </div>
                <!-- Further fields for options, correct answer will be added based on type -->
                <div id="modal-question-options-container"></div> 
            `;
            // Add logic to change options based on type select
            const typeSelect = modalBody.querySelector('#modal-question-type');
            typeSelect.onchange = (e) => this.handleQuestionTypeChange(e.target.value, modalBody.querySelector('#modal-question-options-container'));
            // Trigger initial call to setup for default type
            this.handleQuestionTypeChange(typeSelect.value, modalBody.querySelector('#modal-question-options-container'));
        },
        async () => {
            const text = document.getElementById('modal-question-text').value.trim();
            const type = document.getElementById('modal-question-type').value;
            let questionData = { text, type };

            if (!text) {
                alert('Question text cannot be empty.');
                return;
            }

            if (type === 'multiple_choice') {
                const options = [];
                const optionInputs = document.querySelectorAll('#modal-question-options-container .mc-option');
                optionInputs.forEach(input => {
                    if (input.value.trim() !== '') {
                        options.push(input.value.trim());
                    }
                });

                if (options.length < 2) {
                    alert('Multiple choice questions must have at least 2 options.');
                    return;
                }
                questionData.options = options;

                const correctAnswerRadio = document.querySelector('#modal-question-options-container input[name="correctAnswer"]:checked');
                if (!correctAnswerRadio || !options[correctAnswerRadio.value]) {
                    alert('Please select a correct answer for the multiple choice question.');
                    return;
                }
                questionData.correctAnswer = options[correctAnswerRadio.value]; // Store the text of the correct option
            
            } else if (type === 'true-false') {
                const correctAnswerSelect = document.querySelector('#modal-question-options-container .tf-correct-answer');
                questionData.correctAnswer = correctAnswerSelect.value; // "true" or "false"
            }
            // For short-answer, no extra fields are strictly needed for now beyond text and type.

            try {
                // console.log("Saving question data:", questionData);
                // API call will go here: 
                await this.api.addQuestionToTest(testId, questionData);
                alert('Question added successfully!');
                this.closeModal('cp-generic-modal');
                // Reset z-index after closing
                if (genericModal) {
                    genericModal.style.zIndex = ''; // Or to its original default if it had one explicitly set
                }
                this.refreshTestQuestionsInModal(testId); 

            } catch (error) {
                console.error("Error adding question:", error);
                alert(`Failed to add question: ${error.message}`);
            }
        });
    }

    async refreshTestQuestionsInModal(testId) {
        const modalInstance = document.getElementById('cp-test-management-modal');
        const questionsListEl = modalInstance?.querySelector('#cp-test-questions-list');
        if (!questionsListEl) return;

        questionsListEl.innerHTML = '<p>Refreshing questions...</p>';
        try {
            const testDetails = await this.api.getTestDetails(testId);
            if (testDetails && testDetails.questions) {
                let questionsHtml = '<p>No questions yet for this test.</p>';
                if (typeof testDetails.questions === 'object' && Object.keys(testDetails.questions).length > 0) {
                    let questionNumber = 0;
                    questionsHtml = Object.entries(testDetails.questions).map(([questionId, q]) => {
                        questionNumber++;
                        let optionsDisplay = '';
                        if (q.type === 'multiple_choice' && Array.isArray(q.options)) {
                            optionsDisplay = '<ul>' + q.options.map(opt => `<li>${opt}</li>`).join('') + '</ul>';
                        }
                        return `<div class="cp-question-item" style="border:1px solid #eee; padding:10px; margin-bottom:10px;" data-question-id="${questionId}">
                                    <div class="cp-question-item-header">
                                        <h4>Question ${questionNumber}: ${q.text || 'N/A'}</h4>
                                        <div class="cp-question-item-actions">
                                            <button class="cp-btn cp-btn-icon cp-btn-edit-question" data-testid="${testId}" data-questionid="${questionId}" title="Edit Question"><i class="fas fa-pencil-alt"></i></button>
                                            <button class="cp-btn cp-btn-icon cp-btn-delete-question" data-testid="${testId}" data-questionid="${questionId}" title="Delete Question"><i class="fas fa-trash"></i></button>
                                        </div>
                                    </div>
                                    <p>Type: ${q.type || 'N/A'}</p>
                                    ${q.type === 'multiple_choice' ? `<p><strong>Options:</strong></p>${optionsDisplay}` : ''}
                                    ${q.correctAnswer ? `<p><strong>Correct Answer:</strong> ${q.correctAnswer}</p>` : ''}
                                 </div>`;
                    }).join('');
                }
                questionsListEl.innerHTML = questionsHtml;
            } else {
                questionsListEl.innerHTML = '<p>Could not refresh questions.</p>';
            }
        } catch (error) {
            questionsListEl.innerHTML = `<p>Error refreshing questions: ${error.message}</p>`;
        }
    }

    handleQuestionTypeChange(questionType, optionsContainer) {
        optionsContainer.innerHTML = ''; // Clear previous options
        if (questionType === 'multiple_choice') {
            optionsContainer.innerHTML = `
                <p><strong>Options:</strong> (Specify at least 2, mark correct one)</p>
                <div class="form-group">
                    <label>Option 1:</label> <input type="text" class="form-control mc-option"> <input type="radio" name="correctAnswer" value="0">
                </div>
                <div class="form-group">
                    <label>Option 2:</label> <input type="text" class="form-control mc-option"> <input type="radio" name="correctAnswer" value="1">
                </div>
                <button type="button" class="cp-btn cp-btn-secondary btn-add-mc-option" style="font-size:0.8em; margin-top: 10px;">Add Another Option</button>
            `;
            // Add event listener for btn-add-mc-option if needed
            optionsContainer.querySelector('.btn-add-mc-option').onclick = () => {
                const optionCount = optionsContainer.querySelectorAll('.mc-option').length;
                const newOptionDiv = document.createElement('div');
                newOptionDiv.className = 'form-group';
                newOptionDiv.innerHTML = `<label>Option ${optionCount + 1}:</label> <input type="text" class="form-control mc-option"> <input type="radio" name="correctAnswer" value="${optionCount}">`;
                // Insert before the add button
                optionsContainer.insertBefore(newOptionDiv, optionsContainer.querySelector('.btn-add-mc-option'));
            };

        } else if (questionType === 'true-false') {
            optionsContainer.innerHTML = `
                <div class="form-group">
                    <label>Correct Answer:</label>
                    <select class="form-control tf-correct-answer">
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                </div>
            `;
        }
        // short-answer needs no specific options fields here, just the text input for the question itself.
    }

    addQuestionActionListeners(testId, modalBodyElement) {
        const questionsList = modalBodyElement.querySelector('#cp-test-questions-list');
        if (!questionsList) return;

        questionsList.addEventListener('click', async (event) => {
            const target = event.target;
            const deleteButton = target.closest('.cp-btn-delete-question');
            const editButton = target.closest('.cp-btn-edit-question');

            if (deleteButton) {
                const questionId = deleteButton.dataset.questionid;
                const questionText = deleteButton.closest('.cp-question-item')?.querySelector('h4')?.textContent || `ID: ${questionId}`;
                
                if (confirm(`Are you sure you want to delete the question: "${questionText}"?`)) {
                    try {
                        await this.api.deleteQuestionFromTest(testId, questionId);
                        alert('Question deleted successfully!');
                        this.refreshTestQuestionsInModal(testId); // Refresh the list
                    } catch (error) {
                        console.error("Error deleting question:", error);
                        alert(`Failed to delete question: ${error.message}`);
                    }
                }
            }

            if (editButton) {
                const questionId = editButton.dataset.questionid;
                this.openEditQuestionModal(testId, questionId);
            }
        });
    }

    openEditQuestionModal(testId, questionId) {
        console.log("openEditQuestionModal called for testId:", testId, "questionId:", questionId);
        
        // Get the current question data from stored test details
        if (!this.currentManagingTestDetails || !this.currentManagingTestDetails.questions || !this.currentManagingTestDetails.questions[questionId]) {
            alert('Question data not found. Please refresh the test management modal and try again.');
            return;
        }

        const currentQuestion = this.currentManagingTestDetails.questions[questionId];
        const testTitle = this.testsData[testId]?.title || testId;

        const genericModal = document.getElementById('cp-generic-modal');
        if (genericModal) {
            genericModal.style.zIndex = '1060'; // Higher than cp-test-management-modal
        }

        this.openModal('cp-generic-modal', `Edit Question in: ${testTitle}`,
            (modalBody) => {
                modalBody.innerHTML = `
                    <div class="form-group">
                        <label for="modal-question-text">Question Text:</label>
                        <input type="text" id="modal-question-text" class="form-control" value="${(currentQuestion.text || '').replace(/"/g, '&quot;')}" placeholder="Enter the question">
                    </div>
                    <div class="form-group">
                        <label for="modal-question-type">Question Type:</label>
                        <select id="modal-question-type" class="form-control">
                            <option value="multiple_choice" ${currentQuestion.type === 'multiple_choice' ? 'selected' : ''}>Multiple Choice</option>
                            <option value="true-false" ${currentQuestion.type === 'true-false' ? 'selected' : ''}>True/False</option>
                            <option value="short-answer" ${currentQuestion.type === 'short-answer' ? 'selected' : ''}>Short Answer (Not fully supported yet)</option>
                        </select>
                    </div>
                    <!-- Further fields for options, correct answer will be added based on type -->
                    <div id="modal-question-options-container"></div> 
                `;
                // Add logic to change options based on type select
                const typeSelect = modalBody.querySelector('#modal-question-type');
                typeSelect.onchange = (e) => this.handleQuestionTypeChange(e.target.value, modalBody.querySelector('#modal-question-options-container'));
                // Trigger initial call to setup for current type and populate with existing data
                this.handleQuestionTypeChangeForEdit(currentQuestion, modalBody.querySelector('#modal-question-options-container'));
            },
            async () => {
                const text = document.getElementById('modal-question-text').value.trim();
                const type = document.getElementById('modal-question-type').value;
                let questionData = { text, type };

                if (!text) {
                    alert('Question text cannot be empty.');
                    return;
                }

                if (type === 'multiple_choice') {
                    const options = [];
                    const optionInputs = document.querySelectorAll('#modal-question-options-container .mc-option');
                    optionInputs.forEach(input => {
                        if (input.value.trim() !== '') {
                            options.push(input.value.trim());
                        }
                    });

                    if (options.length < 2) {
                        alert('Multiple choice questions must have at least 2 options.');
                        return;
                    }
                    questionData.options = options;

                    const correctAnswerRadio = document.querySelector('#modal-question-options-container input[name="correctAnswer"]:checked');
                    if (!correctAnswerRadio || !options[correctAnswerRadio.value]) {
                        alert('Please select a correct answer for the multiple choice question.');
                        return;
                    }
                    questionData.correctAnswer = options[correctAnswerRadio.value]; // Store the text of the correct option
                
                } else if (type === 'true-false') {
                    const correctAnswerSelect = document.querySelector('#modal-question-options-container .tf-correct-answer');
                    questionData.correctAnswer = correctAnswerSelect.value; // "true" or "false"
                }
                // For short-answer, no extra fields are strictly needed for now beyond text and type.

                try {
                    await this.api.updateQuestionInTest(testId, questionId, questionData);
                    alert('Question updated successfully!');
                    this.closeModal('cp-generic-modal');
                    // Reset z-index after closing
                    if (genericModal) {
                        genericModal.style.zIndex = ''; // Or to its original default if it had one explicitly set
                    }
                    // Update the stored test details with the new question data
                    if (this.currentManagingTestDetails && this.currentManagingTestDetails.questions) {
                        this.currentManagingTestDetails.questions[questionId] = questionData;
                    }
                    this.refreshTestQuestionsInModal(testId); 

                } catch (error) {
                    console.error("Error updating question:", error);
                    alert(`Failed to update question: ${error.message}`);
                }
            }
        );
    }

    handleQuestionTypeChangeForEdit(currentQuestion, optionsContainer) {
        const questionType = currentQuestion.type;
        optionsContainer.innerHTML = ''; // Clear previous options
        
        if (questionType === 'multiple_choice') {
            const existingOptions = currentQuestion.options || [];
            const correctAnswer = currentQuestion.correctAnswer || '';
            
            let optionsHtml = '<p><strong>Options:</strong> (Specify at least 2, mark correct one)</p>';
            
            // Add existing options
            existingOptions.forEach((option, index) => {
                const isCorrect = option === correctAnswer;
                optionsHtml += `
                    <div class="form-group">
                        <label>Option ${index + 1}:</label> 
                        <input type="text" class="form-control mc-option" value="${option.replace(/"/g, '&quot;')}"> 
                        <input type="radio" name="correctAnswer" value="${index}" ${isCorrect ? 'checked' : ''}>
                    </div>
                `;
            });
            
            // If no options exist, add default 2 empty options
            if (existingOptions.length === 0) {
                optionsHtml += `
                    <div class="form-group">
                        <label>Option 1:</label> <input type="text" class="form-control mc-option"> <input type="radio" name="correctAnswer" value="0">
                    </div>
                    <div class="form-group">
                        <label>Option 2:</label> <input type="text" class="form-control mc-option"> <input type="radio" name="correctAnswer" value="1">
                    </div>
                `;
            }
            
            optionsHtml += '<button type="button" class="cp-btn cp-btn-secondary btn-add-mc-option" style="font-size:0.8em; margin-top: 10px;">Add Another Option</button>';
            optionsContainer.innerHTML = optionsHtml;
            
            // Add event listener for btn-add-mc-option
            optionsContainer.querySelector('.btn-add-mc-option').onclick = () => {
                const optionCount = optionsContainer.querySelectorAll('.mc-option').length;
                const newOptionDiv = document.createElement('div');
                newOptionDiv.className = 'form-group';
                newOptionDiv.innerHTML = `<label>Option ${optionCount + 1}:</label> <input type="text" class="form-control mc-option"> <input type="radio" name="correctAnswer" value="${optionCount}">`;
                // Insert before the add button
                optionsContainer.insertBefore(newOptionDiv, optionsContainer.querySelector('.btn-add-mc-option'));
            };

        } else if (questionType === 'true-false') {
            const correctAnswer = currentQuestion.correctAnswer || 'true';
            optionsContainer.innerHTML = `
                <div class="form-group">
                    <label>Correct Answer:</label>
                    <select class="form-control tf-correct-answer">
                        <option value="true" ${correctAnswer === 'true' ? 'selected' : ''}>True</option>
                        <option value="false" ${correctAnswer === 'false' ? 'selected' : ''}>False</option>
                    </select>
                </div>
            `;
        }
        // short-answer needs no specific options fields here, just the text input for the question itself.
    }

}

window.courseEditUI = new CourseEditUI(); 