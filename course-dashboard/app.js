// course-dashboard/app.js - Main application logic for the course dashboard

document.addEventListener('DOMContentLoaded', async () => {
    // Basic check for Firebase, assuming firebase-config.js handles initialization
    if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
        console.error('Firebase SDK not loaded or not initialized. Ensure firebase-config.js runs first.');
        alert('Critical error: Firebase not available. Please contact support.');
        return;
    }

    const loggedInUserName = localStorage.getItem('userName'); 
    if (!loggedInUserName) {
        console.warn('User name not found in localStorage. Displaying generic content or consider redirecting to login.');
        updateUserDisplay(null); 
    }

    let userData = null;
    if (loggedInUserName) {
        userData = await getUserDataForDashboard(loggedInUserName);
        localStorage.setItem('userData', JSON.stringify(userData)); // Store userData globally for ui.js to access for user ID
    }
    
    updateUserDisplay(userData);

    const allCourses = await getAllPublishedCourses(); 
    const enrollments = await getUserEnrollments(loggedInUserName);

    populateCourseTypeFilter(allCourses); 

    const searchInput = document.getElementById('cd-search-input');
    const courseTypeFilter = document.getElementById('cd-course-type-filter');
    const myCoursesStatusFilterElement = document.getElementById('my-courses-filter-select');

    const generalFiltersElement = document.getElementById('cd-general-filters');
    const myCoursesFilterContainer = document.getElementById('cd-my-courses-status-filter');

    const navDashboard = document.getElementById('nav-dashboard');
    const navMyCourses = document.getElementById('nav-my-courses');

    window.currentViewMode = 'dashboard'; // Expose to window for ui.js access

    function updateFilterVisibility() {
        if (window.currentViewMode === 'dashboard') {
            generalFiltersElement.style.display = 'flex';
            myCoursesFilterContainer.style.display = 'none';
        } else { // mycourses
            generalFiltersElement.style.display = 'none';
            myCoursesFilterContainer.style.display = 'flex';
        }
    }

    function applyFilters() {
        const searchTerm = searchInput ? searchInput.value : '';
        const selectedCourseType = courseTypeFilter ? courseTypeFilter.value : 'all';
        const selectedMyCoursesStatus = myCoursesStatusFilterElement ? myCoursesStatusFilterElement.value : 'all_my';
        
        displayCourses(allCourses, enrollments, searchTerm, selectedCourseType, window.currentViewMode, selectedMyCoursesStatus);
    }

    if (navDashboard) {
        navDashboard.addEventListener('click', (e) => {
            e.preventDefault();
            window.currentViewMode = 'dashboard';
            updateFilterVisibility();
            applyFilters();
            navDashboard.classList.add('active');
            if (navMyCourses) navMyCourses.classList.remove('active');
        });
    }

    if (navMyCourses) {
        navMyCourses.addEventListener('click', (e) => {
            e.preventDefault();
            window.currentViewMode = 'mycourses';
            updateFilterVisibility();
            applyFilters();
            navMyCourses.classList.add('active');
            if (navDashboard) navDashboard.classList.remove('active');
        });
    }
    
    // Initial setup
    if (navDashboard) navDashboard.classList.add('active'); 
    updateFilterVisibility();
    displayCourses(allCourses, enrollments, '', 'all', window.currentViewMode, 'all_my');

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    if (courseTypeFilter) {
        courseTypeFilter.addEventListener('change', applyFilters);
    }
    if (myCoursesStatusFilterElement) {
        myCoursesStatusFilterElement.addEventListener('change', applyFilters);
    }

    const gridViewBtn = document.getElementById('cd-grid-view-btn');
    const listViewBtn = document.getElementById('cd-list-view-btn');
    const courseGridElement = document.getElementById('cd-course-grid');

    if (gridViewBtn && listViewBtn && courseGridElement) {
        gridViewBtn.addEventListener('click', () => {
            courseGridElement.classList.remove('cd-list-view');
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        });

        listViewBtn.addEventListener('click', () => {
            courseGridElement.classList.add('cd-list-view');
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
        });
    }
});
