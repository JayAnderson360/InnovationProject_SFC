// js/course-page/api.js
// Handles all Firestore interactions for the course page.

/**
 * Fetches detailed information for a specific course from Firestore using its title.
 * Assumes course titles are unique.
 * @param {string} courseTitle The title of the course to fetch.
 * @returns {Promise<Object|null>} A promise that resolves to the course data object (including its ID) or null if not found.
 */
async function getCourseDetailsByTitle(courseTitle) {
    if (!window.db) {
        console.error("Firestore not initialized. Cannot fetch course details by title.");
        return null;
    }
    try {
        const coursesRef = window.db.collection('courses');
        const snapshot = await coursesRef.where('title', '==', courseTitle).limit(1).get();
        
        if (snapshot.empty) {
            console.warn(`Course with title "${courseTitle}" not found.`);
            return null;
        }
        // Assuming title is unique, so we take the first doc.
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    } catch (error) {
        console.error(`Error fetching course details for title "${courseTitle}":`, error);
        return null;
    }
}

/**
 * Processes modules from the course data object.
 * Modules are expected to be a map in `courseData.modules`,
 * with order defined by `courseData.moduleOrder` array.
 * @param {Object} courseData The main course data object from Firestore.
 * @returns {Array} An array of module objects, ordered according to `moduleOrder`.
 */
function getCourseModules(courseData) {
    if (!courseData || !courseData.modules || !courseData.moduleOrder) {
        console.warn("Course data is missing 'modules' map or 'moduleOrder' array.");
        return [];
    }

    const orderedModules = [];
    for (const moduleId of courseData.moduleOrder) {
        if (courseData.modules[moduleId]) {
            orderedModules.push({ 
                id: moduleId, 
                ...courseData.modules[moduleId] 
            });
        } else {
            console.warn(`Module with ID "${moduleId}" found in moduleOrder but not in modules map.`);
        }
    }
    return orderedModules;
}

// --- Admin specific API functions will be added below --- 

// Example (to be expanded):
// async function updateCourseTitle(courseId, newTitle) { ... }
// async function addCourseModule(courseId, moduleData) { ... }
// async function updateCourseModule(courseId, moduleId, moduleData) { ... }
// async function deleteCourseModule(courseId, moduleId) { ... } 