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

/**
 * Fetches a specific test from the 'tests' collection by its ID.
 * @param {string} testId The ID of the test to fetch.
 * @returns {Promise<Object|null>} Test data or null if not found.
 */
async function getTestDetailsById(testId) {
    if (!window.db) {
        console.error("Firestore not initialized. Cannot fetch test details.");
        return null;
    }
    try {
        const testRef = window.db.collection('tests').doc(testId);
        const doc = await testRef.get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        } else {
            console.warn(`Test with ID "${testId}" not found.`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching test details for ID "${testId}":`, error);
        return null;
    }
}

/**
 * Checks for an existing test submission by a user for a specific test.
 * @param {string} userName The name of the user.
 * @param {string} courseTitle The title of the course.
 * @param {string} moduleTitle The title of the module.
 * @param {string} testTitle The title of the test.
 * @returns {Promise<Object|null>} The submission data or null if not found.
 */
async function getUserTestSubmission(userName, courseTitle, moduleTitle, testTitle) {
    if (!window.db) {
        console.error("Firestore not initialized. Cannot fetch user test submission.");
        return null;
    }
    try {
        const submissionsRef = window.db.collection('submissions');
        const snapshot = await submissionsRef
            .where('userName', '==', userName)
            .where('courseTitle', '==', courseTitle)
            .where('moduleTitle', '==', moduleTitle)
            .where('testTitle', '==', testTitle)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null; // No submission found
    } catch (error) {
        console.error("Error fetching user test submission:", error);
        return null;
    }
}

/**
 * Submits a user's test answers to the 'submissions' collection.
 * @param {Object} submissionData The data for the new submission.
 * Required fields: userName, courseTitle, moduleTitle, testTitle, submittedAt,
 * status, score, totalPossibleScore, answers (array).
 * @returns {Promise<string|null>} The ID of the new submission document or null on error.
 */
async function submitTestAnswers(submissionData) {
    if (!window.db) {
        console.error("Firestore not initialized. Cannot submit test answers.");
        return null;
    }
    try {
        const submissionsRef = window.db.collection('submissions');
        // Add a new document with an auto-generated ID
        const docRef = await submissionsRef.add(submissionData);
        console.log("Test submission successfully saved with ID: ", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error submitting test answers:", error);
        return null;
    }
}

/**
 * Fetches the user's enrollment document for a specific course.
 * @param {string} userName The name of the user.
 * @param {string} courseTitle The title of the course.
 * @returns {Promise<Object|null>} The enrollment data including its ID, or null if not found.
 */
async function getUserEnrollmentForCourse(userName, courseTitle) {
    if (!window.db) {
        console.error("Firestore not initialized. Cannot fetch user enrollment.");
        return null;
    }
    try {
        const enrollmentsRef = window.db.collection('enrollments');
        const snapshot = await enrollmentsRef
            .where('userName', '==', userName)
            .where('courseTitle', '==', courseTitle)
            .limit(1) // Assuming one enrollment per user per course
            .get();

        if (snapshot.empty) {
            console.warn(`Enrollment not found for user "${userName}" in course "${courseTitle}".`);
            return null;
        }
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    } catch (error) {
        console.error(`Error fetching enrollment for user "${userName}" in course "${courseTitle}":`, error);
        return null;
    }
}

/**
 * Updates an enrollment document in Firestore.
 * @param {string} enrollmentId The ID of the enrollment document to update.
 * @param {Object} dataToUpdate An object containing the fields to update.
 * @returns {Promise<boolean>} True if update was successful, false otherwise.
 */
async function updateEnrollment(enrollmentId, dataToUpdate) {
    if (!window.db) {
        console.error("Firestore not initialized. Cannot update enrollment.");
        return false;
    }
    if (!enrollmentId || !dataToUpdate) {
        console.error("Missing enrollmentId or dataToUpdate for updating enrollment.");
        return false;
    }
    try {
        const enrollmentRef = window.db.collection('enrollments').doc(enrollmentId);
        await enrollmentRef.update(dataToUpdate);
        console.log(`Enrollment document ${enrollmentId} updated successfully.`);
        return true;
    } catch (error) {
        console.error(`Error updating enrollment document ${enrollmentId}:`, error);
        return false;
    }
}

// --- Admin specific API functions will be added below --- 

// Example (to be expanded):
// async function updateCourseTitle(courseId, newTitle) { ... }
// async function addCourseModule(courseId, moduleData) { ... }
// async function updateCourseModule(courseId, moduleId, moduleData) { ... }
// async function deleteCourseModule(courseId, moduleId) { ... } 