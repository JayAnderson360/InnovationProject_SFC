// js/course-page/app.js
// Main application logic for the course page.

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof firebase === 'undefined' || !window.db || !window.auth) {
        console.error('Firebase SDK not loaded or not initialized properly.');
        alert('Critical error: Firebase services not available.');
        return;
    }

    // 1. Get Course Title from localStorage
    const courseTitle = localStorage.getItem('currentCourseTitle');

    if (!courseTitle) {
        console.error('No currentCourseTitle found in localStorage.');
        document.getElementById('cp-container').innerHTML = 
            '<p style="text-align:center; color:red;">No course selected. Please navigate from the dashboard.</p>';
        return;
    }

    // 2. Get User Role from localStorage
    const userRole = localStorage.getItem('userRole');

    if (!userRole) {
        console.warn('User role not found. Defaulting to student view.');
    }

    // 3. Show/Hide Admin Controls based on role
    toggleAdminControls(userRole); // ui.js function

    // 4. Fetch Course Details by Title (which includes the ID)
    const courseData = await getCourseDetailsByTitle(courseTitle); // api.js function

    if (courseData) {
        renderCourseDetails(courseData); // ui.js function

        // 5. Fetch and Render Course Modules using the courseId from courseData
        const modulesData = getCourseModules(courseData); // api.js function - now synchronous
        renderCourseModules(modulesData, userRole); // ui.js function

        // 6. Initialize Admin Event Listeners (if admin)
        if (userRole === 'Admin') {
            initializeAdminPageEventListeners(courseData.id); 
        }

        // 7. Initialize general page event listeners (now that Begin Course is gone, this might be empty or repurposed)
        initializePageEventListeners(courseData.id, courseData);

    } else {
        document.getElementById('cp-container').innerHTML = 
            `<p style="text-align:center; color:red;">Could not load course details for "${courseTitle}". Please check the course or try again later.</p>`;
        return;
    }
});

function initializeAdminPageEventListeners(courseId) {
    console.log("Initializing ADMIN event listeners for course:", courseId);
    const editTitleBtn = document.getElementById('cp-admin-edit-course-title-btn');
    if (editTitleBtn) {
        editTitleBtn.addEventListener('click', () => {
            alert(`Admin: Edit title for course ${courseId} - To be implemented`);
        });
    }
    const editDescBtn = document.getElementById('cp-admin-edit-description-btn');
    if(editDescBtn) {
        editDescBtn.addEventListener('click', () => {
            alert(`Admin: Edit description for course ${courseId} - To be implemented`);
        });
    }
    const addModuleBtn = document.getElementById('cp-admin-add-module-btn');
    if(addModuleBtn) {
        addModuleBtn.addEventListener('click', () => {
            alert(`Admin: Add module to course ${courseId} - To be implemented`);
        });
    }
}

function initializePageEventListeners(courseId, courseData) {
    console.log("Initializing general page event listeners for course:", courseId);
    // const beginCourseBtn = document.getElementById('cp-begin-course-btn'); // Button is removed
    // If there are other general listeners, add them here.
} 