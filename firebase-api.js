const firebaseConfig = {
    apiKey: "AIzaSyBS4W6MddWuU3lxotE9peb7RsI_QJzIzaI",
    authDomain: "sarawak-forestry-database.firebaseapp.com",
    databaseURL: "https://sarawak-forestry-database-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sarawak-forestry-database",
    storageBucket: "sarawak-forestry-database.firebasestorage.app",
    messagingSenderId: "979838017340",
    appId: "1:979838017340:web:a31113d00fafcb0bcb4839",
    measurementId: "G-KXNY4PT4VY"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Generic function to get all documents from a collection
async function getCollectionData(collectionName) {
    try {
        const snapshot = await db.collection(collectionName).get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error(`Error getting ${collectionName} data:`, error);
        throw error;
    }
}

// Generic function to add a document to a collection
async function addDocument(collectionName, data) {
    try {
        const docRef = await db.collection(collectionName).add(data);
        return docRef.id;
    } catch (error) {
        console.error(`Error adding document to ${collectionName}:`, error);
        throw error;
    }
}

// Generic function to update a document
async function updateDocument(collectionName, docId, data) {
    try {
        await db.collection(collectionName).doc(docId).update(data);
    } catch (error) {
        console.error(`Error updating document in ${collectionName}:`, error);
        throw error;
    }
}

// Generic function to delete a document
async function deleteDocument(collectionName, docId) {
    try {
        await db.collection(collectionName).doc(docId).delete();
    } catch (error) {
        console.error(`Error deleting document from ${collectionName}:`, error);
        throw error;
    }
}

// Parks specific functions
async function getParks() {
    return getCollectionData('parks');
}

async function addPark(parkData) {
    return addDocument('parks', parkData);
}

async function updatePark(parkId, parkData) {
    return updateDocument('parks', parkId, parkData);
}

async function deletePark(parkId) {
    return deleteDocument('parks', parkId);
}

// Users specific functions
async function getUsers() {
    return getCollectionData('users');
}

async function addUser(userData) {
    return addDocument('users', userData);
}

async function updateUser(userId, userData) {
    return updateDocument('users', userId, userData);
}

async function deleteUser(userId) {
    return deleteDocument('users', userId);
}

// Park Guides specific functions
async function getParkGuides() {
    return getCollectionData('parkGuides');
}

async function addParkGuide(guideData) {
    return addDocument('parkGuides', guideData);
}

async function updateParkGuide(guideId, guideData) {
    return updateDocument('parkGuides', guideId, guideData);
}

async function deleteParkGuide(guideId) {
    return deleteDocument('parkGuides', guideId);
}

// Training Courses specific functions
async function getTrainingCourses() {
    return getCollectionData('trainingCourses');
}

async function addTrainingCourse(courseData) {
    return addDocument('trainingCourses', courseData);
}

async function updateTrainingCourse(courseId, courseData) {
    return updateDocument('trainingCourses', courseId, courseData);
}

async function deleteTrainingCourse(courseId) {
    return deleteDocument('trainingCourses', courseId);
}

// Feedback specific functions
async function getFeedback() {
    return getCollectionData('feedback');
}

async function addFeedback(feedbackData) {
    return addDocument('feedback', feedbackData);
}

async function updateFeedback(feedbackId, feedbackData) {
    return updateDocument('feedback', feedbackId, feedbackData);
}

async function deleteFeedback(feedbackId) {
    return deleteDocument('feedback', feedbackId);
}

