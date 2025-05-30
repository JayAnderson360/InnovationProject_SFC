// js/course-page/app.js
// Main application logic for the course page.

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof firebase === 'undefined' || !window.db || !window.auth) {
        console.error('Firebase SDK not loaded or not initialized properly.');
        alert('Critical error: Firebase services not available.');
        return;
    }

    // 1. Get Course Title from localStorage
    const courseTitleFromStorage = localStorage.getItem('currentCourseTitle');

    if (!courseTitleFromStorage) {
        console.error('No currentCourseTitle found in localStorage.');
        document.getElementById('cp-container').innerHTML = 
            '<p style="text-align:center; color:red;">No course selected. Please navigate from the dashboard.</p>';
        return;
    }

    // 2. Get User Role and User Name from localStorage
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName'); // Make sure userName is available

    if (!userRole) {
        console.warn('User role not found. Defaulting to student view.');
    }
    if (!userName) {
        console.warn('User name not found in localStorage. Some features like test submissions might not work correctly.');
        // Potentially redirect to login or show a more prominent warning
    }

    // 3. Show/Hide Admin Controls based on role
    toggleAdminControls(userRole); // ui.js function

    // 4. Fetch Course Details by Title (which includes the ID)
    const courseData = await getCourseDetailsByTitle(courseTitleFromStorage); // api.js function

    if (courseData) {
        // Store courseData in localStorage for other parts of the UI if needed (e.g. ui.js for courseTitle)
        localStorage.setItem('currentCourseData', JSON.stringify(courseData)); 

        renderCourseDetails(courseData); // ui.js function

        // Render Course Status Summary (and check for completion)
        if (userName) { // Only proceed if userName is available
            renderCourseStatusAndCheckCompletion(courseData, userName); // New ui.js function
        }

        // 5. Fetch and Render Course Modules using the courseId from courseData
        const modulesData = getCourseModules(courseData); // api.js function - now synchronous
        renderCourseModules(modulesData, userRole, courseData.title, userName); 

        // 6. Initialize Admin Event Listeners (if admin)
        if (userRole === 'Admin') {
            initializeAdminPageEventListeners(courseData.id); 
        }

        // 7. Initialize general page event listeners
        // Pass courseData.title to initializePageEventListeners if it needs it,
        // and ensure attachTakeTestButtonListeners is called correctly within renderCourseModules or here.
        // For now, we assume attachTakeTestButtonListeners is correctly called from renderCourseModules,
        // but ensure courseData.title (the actual title from DB) is accessible there.
        // The previous edit to ui.js tries to get courseTitle from localStorage['currentCourseData'] or DOM.
        // It's better if renderCourseModules itself receives courseData.title or if attachTakeTestButtonListeners is called from here.

        // To be explicit and ensure correct courseTitle is used:
        // We'll rely on the modification in ui.js that passes courseData.title to attachTakeTestButtonListeners
        // from within renderCourseModules or its direct call.
        // The ui.js was modified to call attachTakeTestButtonListeners(courseData.title) at the end of renderCourseModules.
        // We need to ensure renderCourseModules gets courseData.title.
        // The current structure is:
        // app.js: renderCourseModules(modulesData, userRole);
        // ui.js: renderCourseModules(orderedModulesArray, userRole) { ... attachTakeTestButtonListeners(courseTitleFromSomewhere); }

        // Let's adjust renderCourseModules to accept courseTitle for clarity and reliability
        // This means changing renderCourseModules signature in ui.js and the call here.
        // However, to minimize changes and stick to the previous diff's approach where ui.js handles it:
        // The current edit in ui.js for attachTakeTestButtonListeners:
        // const courseDataLocal = JSON.parse(localStorage.getItem('currentCourseData'));
        // const courseTitle = courseDataLocal ? courseDataLocal.title : document.getElementById('cp-course-title').textContent;
        // This should work since we are now setting 'currentCourseData' in localStorage.
        
        initializePageEventListeners(courseData.id, courseData);


    } else {
        document.getElementById('cp-container').innerHTML = 
            `<p style="text-align:center; color:red;">Could not load course details for "${courseTitleFromStorage}". Please check the course or try again later.</p>`;
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

    // Since attachTakeTestButtonListeners is called at the end of renderCourseModules in ui.js,
    // and ui.js now correctly sources courseTitle (via localStorage['currentCourseData'] or DOM fallback),
    // no explicit call to attachTakeTestButtonListeners(courseData.title) is needed here in app.js,
    // provided that currentCourseData is reliably set in localStorage before renderCourseModules.
} 