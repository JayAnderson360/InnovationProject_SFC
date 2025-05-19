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
            if (snapshot.empty) {
                return []; // No documents, so no fields can be determined
            }
            const doc = snapshot.docs[0];
            // Get all keys from the document, excluding the 'id' if we added it manually
            const fields = Object.keys(doc.data());
            return fields;
        } catch (error) {
            console.error(`Error fetching fields for ${collectionName}:`, error);
            alert(`Error fetching fields for ${collectionName}. Check console.`);
            return [];
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
            let docRef;
            const normalizedCollectionName = collectionName.toLowerCase();
            
            // Special handling for specific collections
            if (normalizedCollectionName === 'user') {
                // Generate a 6-digit random number
                const randomId = Math.floor(100000 + Math.random() * 900000).toString();
                
                // Determine prefix based on role
                let prefix;
                switch(data.role) {
                    case 'General Users':
                        prefix = 'GU';
                        break;
                    case 'Admin':
                        prefix = 'AU';
                        break;
                    case 'Park Guide':
                        prefix = 'PG';
                        break;
                    default:
                        prefix = 'GU'; // Default to General Users if role is not recognized
                }
                
                // Create the document with the specific fields
                const userData = {
                    name: data.name,
                    email: data.email,
                    password: data.password, // Note: In a production environment, this should be hashed
                    role: data.role
                };

                // Add phone number and license number for Park Guides
                if (data.role === 'Park Guide') {
                    userData.phoneNumber = data.phoneNumber || null;
                }
                
                // Combine prefix and random number for the document ID
                const userId = `${prefix}${randomId}`;
                docRef = await db.collection(normalizedCollectionName).doc(userId).set(userData);
                return userId;
            } else if (normalizedCollectionName === 'parks') {
                // Generate a 6-digit random number for park ID
                const randomId = Math.floor(100000 + Math.random() * 900000).toString();
                const parkId = `PID${randomId}`;
                
                // Create the document with the specific fields
                const parkData = {
                    name: data.name,
                    location: data.location,
                    type: data.type,
                    landArea: data.landArea,
                    marineArea: data.marineArea,
                    dateOfGazettement: data.dateOfGazettement
                };
                
                docRef = await db.collection(normalizedCollectionName).doc(parkId).set(parkData);
                return parkId;
            } else {
                // Default behavior for other collections
                docRef = await db.collection(normalizedCollectionName).add(data);
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
