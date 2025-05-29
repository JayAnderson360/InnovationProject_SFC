// js/course-page/ui.js
// Handles DOM manipulation and UI updates for the course page.

const courseTitleElement = document.getElementById('cp-course-title');
const courseDescriptionElement = document.getElementById('cp-course-description');
const modulesListElement = document.getElementById('cp-modules-list');

// Admin buttons (will be shown/hidden based on role)
const adminEditCourseTitleBtn = document.getElementById('cp-admin-edit-course-title-btn');
const adminEditDescriptionBtn = document.getElementById('cp-admin-edit-description-btn');
const adminAddModuleBtn = document.getElementById('cp-admin-add-module-btn');

/**
 * Renders the main course details (title, description).
 * @param {Object} courseData The course data object.
 */
function renderCourseDetails(courseData) {
    if (!courseData) return;
    if (courseTitleElement) courseTitleElement.textContent = courseData.title || 'Course Title Not Found';
    if (courseDescriptionElement) courseDescriptionElement.textContent = courseData.description || 'No description available.';
    // Potentially update the 'Begin Course' button or other general elements here
}

/**
 * Renders the list of course modules as an accordion.
 * @param {Array} modules An array of module objects.
 * @param {string} userRole The role of the current user ('Admin', 'Park Guide', etc.).
 */
function renderCourseModules(modules, userRole) {
    if (!modulesListElement) return;
    modulesListElement.innerHTML = ''; // Clear existing modules

    if (!modules || modules.length === 0) {
        modulesListElement.innerHTML = '<p>No modules available for this course yet.</p>';
        return;
    }

    modules.forEach(module => {
        const moduleDiv = document.createElement('div');
        moduleDiv.className = 'cp-module';
        moduleDiv.dataset.moduleId = module.id;

        // Module Header (clickable for accordion)
        let moduleHtml = `
            <div class="cp-module-header">
                <h3>${module.title || 'Untitled Module'}</h3>
                <div class="cp-module-header-actions">
                    <i class="far fa-square cp-module-status-icon" title="Pending"></i> <!-- Placeholder status -->
        `;
        // Admin buttons for the module
        if (userRole === 'Admin') {
            moduleHtml += `
                <button class="cp-btn cp-btn-admin cp-btn-edit-module" data-module-id="${module.id}" title="Edit Module"><i class="fas fa-edit"></i></button>
                <button class="cp-btn cp-btn-admin cp-btn-delete-module" data-module-id="${module.id}" title="Delete Module"><i class="fas fa-trash"></i></button>
            `;
        }
        moduleHtml += `
                    <i class="fas fa-chevron-down cp-module-toggle-icon"></i>
                </div>
            </div>
        `;

        // Module Content (collapsible)
        moduleHtml += `<div class="cp-module-content" style="display: none;">`; // Initially hidden

        // Module content/description from Firestore (assuming 'content' field)
        if (module.content) {
            moduleHtml += `<p class="cp-module-main-content">${module.content}</p>`;
        } else {
            moduleHtml += `<p class="cp-module-main-content">No detailed content for this module.</p>`;
        }
        
        // Module Resources
        moduleHtml += `<div class="cp-module-resources">`;
        if (module.resources && module.resources.length > 0) {
            module.resources.forEach(resource => {
                let iconClass = 'fa-link';
                let typeClass = 'link'; // Default type class for styling
                if (resource.type === 'pdf') {
                    iconClass = 'fa-file-pdf';
                    typeClass = 'pdf';
                } else if (resource.type === 'video') {
                    iconClass = 'fa-video';
                    typeClass = 'video';
                }
                moduleHtml += `<a href="${resource.url || '#'}" target="_blank" class="cp-resource-link ${typeClass}"><i class="fas ${iconClass}"></i> ${resource.name || 'Resource Link'}</a>`;
            });
        } else {
            // moduleHtml += `<p>No resources for this module.</p>`; // Or just leave empty
        }
        moduleHtml += `</div>`; // End cp-module-resources

        // Test Button
        // Later: Hide "Take Test" if no test exists (e.g., check module.testIds) or if admin is viewing in a specific mode
        const hasTests = module.testIds && module.testIds.length > 0;
        if (hasTests) {
            moduleHtml += `<button class="cp-btn cp-btn-take-test" data-module-id="${module.id}"><i class="fas fa-tasks"></i> Take Test</button>`;
        } else {
            moduleHtml += `<p class="cp-no-test-message">No test available for this module.</p>`;
        }
        
        moduleHtml += `</div>`; // End cp-module-content

        moduleDiv.innerHTML = moduleHtml;
        modulesListElement.appendChild(moduleDiv);
    });

    attachModuleAccordionListeners(); // For expanding/collapsing modules
    if (userRole === 'Admin') {
        attachAdminModuleButtonListeners();
    }
    attachTakeTestButtonListeners();
}

/**
 * Attaches event listeners to module headers for accordion functionality.
 */
function attachModuleAccordionListeners() {
    document.querySelectorAll('.cp-module-header').forEach(header => {
        header.addEventListener('click', (e) => {
            // Prevent toggling if an admin button within the header was clicked
            if (e.target.closest('.cp-btn-admin')) {
                return;
            }
            const content = header.nextElementSibling;
            const icon = header.querySelector('.cp-module-toggle-icon');
            if (content && content.classList.contains('cp-module-content')) {
                if (content.style.display === 'none' || content.style.display === '') {
                    content.style.display = 'block';
                    if (icon) icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
                } else {
                    content.style.display = 'none';
                    if (icon) icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
                }
            }
        });
    });
}

/**
 * Shows or hides admin-specific UI elements based on user role.
 * @param {string} userRole The role of the current user.
 */
function toggleAdminControls(userRole) {
    const isAdmin = userRole === 'Admin';
    const displayStyle = isAdmin ? 'inline-block' : 'none'; // Or 'block' depending on button type

    if (adminEditCourseTitleBtn) adminEditCourseTitleBtn.style.display = displayStyle;
    if (adminEditDescriptionBtn) adminEditDescriptionBtn.style.display = displayStyle;
    if (adminAddModuleBtn) adminAddModuleBtn.style.display = isAdmin ? 'block' : 'none'; // Add module might be a block button

    // Module-specific admin buttons are handled during module rendering (renderCourseModules)
}

function attachAdminModuleButtonListeners() {
    document.querySelectorAll('.cp-btn-edit-module').forEach(button => {
        button.addEventListener('click', (e) => {
            const moduleId = e.currentTarget.dataset.moduleId; // Use currentTarget for consistency
            console.log(`Admin wants to EDIT module: ${moduleId}`);
            alert(`Admin: Edit module ${moduleId} - To be implemented`);
        });
    });
    document.querySelectorAll('.cp-btn-delete-module').forEach(button => {
        button.addEventListener('click', (e) => {
            const moduleId = e.currentTarget.dataset.moduleId;
            console.log(`Admin wants to DELETE module: ${moduleId}`);
            alert(`Admin: Delete module ${moduleId} - To be implemented`);
        });
    });
}

function attachTakeTestButtonListeners() {
    document.querySelectorAll('.cp-btn-take-test').forEach(button => {
        button.addEventListener('click', (e) => {
            const moduleId = e.currentTarget.dataset.moduleId;
            console.log(`User wants to TAKE TEST for module: ${moduleId}`);
            alert(`Take test for module ${moduleId} - To be implemented`);
        });
    });
}

// Add other UI functions as needed (e.g., for modals) 