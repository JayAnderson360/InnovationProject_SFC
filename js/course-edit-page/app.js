// js/course-edit-page/app.js - Main application logic for the course edit page
console.log("course-edit-page/app.js loaded");

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('courseId');

    // Make sure to use the instantiated classes from the window object
    const API = window.courseEditAPI;
    const UI = window.courseEditUI;

    if (!API || !UI) {
        console.error("Critical error: API or UI modules not loaded.");
        alert("Error initializing page components. Please try again or contact support.");
        return;
    }

    if (courseId) {
        console.log("Editing course with ID:", courseId);
        try {
            const courseData = await API.getCourseDetails(courseId);
            if (courseData) {
                UI.displayCourseData(courseData);
                // After displaying, setup event listeners for editing features
                UI.initializeEventListeners(courseId, API);
            } else {
                UI.showError(`Course with ID ${courseId} not found.`);
            }
        } catch (error) {
            console.error("Error fetching course details for editing:", error);
            UI.showError("Failed to load course details. Please check the console and try again.");
        }
    } else {
        console.error("No courseId found in URL. Cannot edit course.");
        const container = document.querySelector('.cp-container');
        if (container) {
            // Clear any existing content in cp-container before showing the error
            container.innerHTML = '<p class="error-message" style="color: red; text-align: center; padding: 20px;">Error: No course specified for editing. Please return to the admin dashboard and select a course to edit.</p>';
        }
    }
}); 