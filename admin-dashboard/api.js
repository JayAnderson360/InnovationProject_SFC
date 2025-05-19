// api.js - Handles Firestore interactions

const api = {
    /**
     * Fetches all documents from a specified collection.
     * @param {string} collectionName - The name of the collection.
     * @returns {Promise<Array>} A promise that resolves to an array of documents.
     */
    async getCollectionData(collectionName) {
        try {
            const normalizedCollectionName = collectionName.toLowerCase();
            const snapshot = await db.collection(normalizedCollectionName).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(`Error fetching collection ${collectionName}:`, error);
            alert(`Error fetching data for ${collectionName}. Check console.`);
            return [];
        }
    },

    /**
     * Fetches the fields of a collection by inspecting the first document.
     * @param {string} collectionName - The name of the collection.
     * @returns {Promise<Array>} A promise that resolves to an array of field names.
     */
    async getCollectionFields(collectionName) {
        try {
            const normalizedCollectionName = collectionName.toLowerCase();
            const snapshot = await db.collection(normalizedCollectionName).limit(1).get();
            if (snapshot.empty) return [];
            const doc = snapshot.docs[0];
            return Object.keys(doc.data());
        } catch (error) {
            console.error(`Error fetching fields for ${collectionName}:`, error);
            alert(`Error fetching fields for ${collectionName}. Check console.`);
            return [];
        }
    },

        /**
     * Fetches a single document from a specified collection by document ID.
     * @param {string} collectionName - The name of the collection.
     * @param {string} docId - The document ID.
     * @returns {Promise<Object|null>} The document data with ID or null if not found.
     */
    async getDocument(collectionName, docId) {
        try {
        const normalizedCollectionName = collectionName.toLowerCase();
        const docRef = db.collection(normalizedCollectionName).doc(docId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return null;
        }
        return { id: docSnap.id, ...docSnap.data() };
        } catch (error) {
        console.error(`Error fetching document ${docId} from ${collectionName}:`, error);
        alert(`Error fetching document. Check console.`);
        return null;
        }
    },

    /**
     * Adds a new document to a specified collection.
     * @param {string} collectionName - The name of the collection.
     * @param {object} data - The data for the new document.
     * @returns {Promise<string|null>} A promise that resolves to the new document's ID, or null on error.
     */
    async addDocument(collectionName, data) {
        try {
            const normalizedCollectionName = collectionName.toLowerCase();
    
            if (normalizedCollectionName === 'user') {
                // Debug logs for email and password (DO NOT keep in production)
                console.log("Creating user with email:", data.email);
                console.log("Password entered:", data.password);
    
                // Create user with Firebase Auth
                const userCredential = await auth.createUserWithEmailAndPassword(data.email, data.password);
                const uid = userCredential.user.uid;
    
                // Prepare user data (exclude password)
                const userData = {
                    name: data.name,
                    email: data.email,
                    role: data.role
                };
    
                if (data.role === 'Park Guide') {
                    userData.phoneNumber = data.phoneNumber || null;
                }
    
                // Store additional data in Firestore under user's UID
                await db.collection('user').doc(uid).set(userData);
                return uid;
            } else if (normalizedCollectionName === 'parks') {
                // Store parks with auto-generated ID
                const parkData = {
                    name: data.name,
                    location: data.location,
                    type: data.type,
                    landArea: data.landArea,
                    marineArea: data.marineArea,
                    dateOfGazettement: data.dateOfGazettement
                };

                const docRef = await db.collection('parks').add(parkData);
                return docRef.id;
            } else {
                // Default for other collections
                const docRef = await db.collection(normalizedCollectionName).add(data);
                return docRef.id;
            }
        } catch (error) {
            console.error(`Error adding document to ${collectionName}:`, error);
            alert(`Error adding document to ${collectionName}. Check console.`);
            return null;
        }
    },

    /**
     * Updates an existing document in a specified collection.
     * @param {string} collectionName - The name of the collection.
     * @param {string} docId - The ID of the document to update.
     * @param {object} data - The data to update.
     * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
     */
    async updateDocument(collectionName, docId, data) {
        try {
            const normalizedCollectionName = collectionName.toLowerCase();
            await db.collection(normalizedCollectionName).doc(docId).update(data);
            return true;
        } catch (error) {
            console.error(`Error updating document ${docId} in ${collectionName}:`, error);
            alert(`Error updating document. Check console.`);
            return false;
        }
    },

    /**
     * Deletes a document from a specified collection.
     * @param {string} collectionName - The name of the collection.
     * @param {string} docId - The ID of the document to delete.
     * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
     */
    async deleteDocument(collectionName, docId) {
        try {
            const normalizedCollectionName = collectionName.toLowerCase();
            await db.collection(normalizedCollectionName).doc(docId).delete();
            return true;
        } catch (error) {
            console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
            alert(`Error deleting document. Check console.`);
            return false;
        }
    }
};

window.api = api;


