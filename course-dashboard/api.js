// course-dashboard/api.js - Handles Firestore interactions for the course dashboard

async function getAllPublishedCourses() {
    if (!window.db) {
        console.error("Firestore not initialized");
        return [];
    }
    const coursesRef = window.db.collection('courses');
    try {
        const snapshot = await coursesRef.where('published', '==', true).get();
        const courses = [];
        snapshot.forEach(doc => {
            courses.push({ id: doc.id, ...doc.data() });
        });
        localStorage.setItem('coursesData', JSON.stringify(courses));
        return courses;
    } catch (error) {
        console.error("Error fetching published courses: ", error);
        return [];
    }
}

async function getUserEnrollments(userName) {
    if (!window.db) {
        console.error("Firestore not initialized");
        return [];
    }
    if (!userName) return []; // No user, no enrollments
    const enrollmentsRef = window.db.collection('enrollments');
    try {
        const snapshot = await enrollmentsRef.where('userName', '==', userName).get();
        const enrollments = [];
        snapshot.forEach(doc => {
            enrollments.push({ id: doc.id, ...doc.data() });
        });
        localStorage.setItem('userEnrollments', JSON.stringify(enrollments));
        return enrollments;
    } catch (error) {
        console.error("Error fetching user enrollments: ", error);
        return [];
    }
}

async function getUserDataForDashboard(userName) {
    if (!window.db) {
        console.error("Firestore not initialized");
        return null;
    }
    const usersRef = window.db.collection('users');
    try {
        const snapshot = await usersRef.where('name', '==', userName).limit(1).get();
        if (snapshot.empty) {
            console.log('No matching user found for dashboard.');
            return null;
        }
        let userData = null;
        snapshot.forEach(doc => {
            userData = { id: doc.id, ...doc.data() }; 
        });
        return userData;
    } catch (error) {
        console.error("Error fetching user data for dashboard: ", error);
        return null;
    }
}

// Uploads payment proof using a PHP script
async function uploadPaymentProofViaPHP(file, fileName) {
    const formData = new FormData();
    formData.append('paymentProof', file);
    formData.append('fileName', fileName); // Send the client-generated filename

    try {
        // Adjust the path to your PHP script if necessary
        const response = await fetch('../php/upload_payment.php', { 
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            // Try to get more specific error from PHP if possible
            let errorMsg = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
            } catch (e) { /* Ignore if response is not JSON */ }
            throw new Error(errorMsg);
        }

        const result = await response.json();

        if (result.success && result.paymentUrl) {
            console.log('PHP Upload successful:', result.message);
            return result.paymentUrl; // This should be the path like ../Resources/Images/PaymentProof/filename.ext
        } else {
            throw new Error(result.message || 'PHP script reported an error during upload.');
        }
    } catch (error) {
        console.error("Error uploading payment proof via PHP: ", error);
        throw error;
    }
}

async function createEnrollmentRecord(enrollmentData) {
    if (!window.db) {
        console.error("Firestore not initialized.");
        throw new Error("Firestore service not available.");
    }
    const enrollmentsRef = window.db.collection('enrollments');
    try {
        const docRef = await enrollmentsRef.add(enrollmentData);
        console.log("Enrollment record created with ID: ", docRef.id);
        return { id: docRef.id, ...enrollmentData };
    } catch (error) {
        console.error("Error creating enrollment record: ", error);
        throw error;
    }
}
