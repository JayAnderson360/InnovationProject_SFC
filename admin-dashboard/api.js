// api.js - Handles Firestore interactions

// Firebase API Functions
class FirebaseAPI {
    constructor() {
        // Use the global Firebase instances from firebase-config.js
        this.db = window.db;
        this.rtdb = window.rtdb;
        this.auth = window.auth;
    }

    // Initialize data on page load
    async initializeData() {
        try {
            const collections = ['users', 'parks', 'courses', 'enrollments', 'submissions', 
                               'certificates', 'licenses', 'visitor_feedback', 'transactions', 'tests'];
            
            for (const collection of collections) {
                const snapshot = await this.db.collection(collection).get();
                const data = {};
                snapshot.forEach(doc => {
                    data[doc.id] = doc.data();
                });
                localStorage.setItem(collection, JSON.stringify(data));
            }

            // Initialize IoT data
            this.initializeIoTData();
        } catch (error) {
            console.error('Error initializing data:', error);
            throw error;
        }
    }

    // IoT Data Functions
    initializeIoTData() {
        // Use the fixed user ID for IoT data
        const iotRef = this.rtdb.ref(`/UsersData/txwfEucxvpgrcA1JEymBn2SSVDG2`);
        iotRef.on('value', (snapshot) => {
            const userRecords = snapshot.val() || {};
            // Flatten: {dateTimeString: data, ...}
            const flatData = {};
            Object.entries(userRecords).forEach(([dateTime, data]) => {
                flatData[dateTime] = data;
            });
            localStorage.setItem('iotData', JSON.stringify(flatData));
        });
    }

    // User Management
    async addUser(userData) {
        try {
            // Create user in Firebase Auth
            const userCredential = await this.auth.createUserWithEmailAndPassword(
                userData.email,
                userData.password
            );

            // Add user data to Firestore
            const userDoc = {
                email: userData.email,
                name: userData.name,
                role: userData.role,
                imgUrl: userData.imgUrl || 'Resources/Images/ProfilePicture/defaultProfile_user.jpeg'
            };

            if (userData.role === 'Park Guide') {
                userDoc.phoneNumber = userData.phoneNumber;
                userDoc.icNumber = userData.icNumber;
            }

            await this.db.collection('users').doc(userCredential.user.uid).set(userDoc);

            // Update local storage
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            users[userCredential.user.uid] = userDoc;
            localStorage.setItem('users', JSON.stringify(users));

            return userCredential.user.uid;
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    }

    async updateUser(userId, userData) {
        try {
            const updateData = { ...userData };
            // Prevent email change from this generic update form if it's an auth credential
            // as it might require re-authentication or specific SDK methods.
            if (updateData.email && users[userId] && updateData.email !== users[userId].email) {
                 console.warn("Attempting to change email directly via updateUser. This might have implications for Firebase Auth user email. Ensure this is intended or handle email updates separately.");
                 // For safety, you might disallow email changes here or require a separate flow for it.
                 // delete updateData.email; 
            }

            await this.db.collection('users').doc(userId).update(updateData);
            
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            users[userId] = { ...users[userId], ...updateData };
            localStorage.setItem('users', JSON.stringify(users));
        } catch (error) {
            console.error('Error updating user in Firestore:', error);
            throw error;
        }
    }

    async setUserStatus(userId, status) {
        try {
            // 1. Update user status in Firestore
            await this.db.collection('users').doc(userId).update({ status: status });
            console.log(`User ${userId} status set to '${status}' in Firestore.`);

            // Firebase Authentication record is NOT deleted or disabled here directly from client.
            // Login logic elsewhere must check the Firestore 'status' field.

            // 2. Update local storage
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if (users[userId]) {
                users[userId].status = status;
                localStorage.setItem('users', JSON.stringify(users));
                console.log(`User ${userId} status updated to '${status}' in local storage.`);
            } else {
                console.warn(`User ${userId} not found in local storage during status update.`);
            }

        } catch (error) {
            console.error(`Error setting user ${userId} status to '${status}':`, error);
            throw error; // Re-throw the error to be caught by the UI layer
        }
    }

    // Park Management
    async addPark(parkData) {
        try {
            const docRef = await this.db.collection('parks').add(parkData);
            
            // Update local storage
            const parks = JSON.parse(localStorage.getItem('parks') || '{}');
            parks[docRef.id] = parkData;
            localStorage.setItem('parks', JSON.stringify(parks));

            return docRef.id;
        } catch (error) {
            console.error('Error adding park:', error);
            throw error;
        }
    }

    async updatePark(parkId, parkData) {
        try {
            await this.db.collection('parks').doc(parkId).update(parkData);
            
            // Update local storage
            const parks = JSON.parse(localStorage.getItem('parks') || '{}');
            parks[parkId] = { ...parks[parkId], ...parkData };
            localStorage.setItem('parks', JSON.stringify(parks));
        } catch (error) {
            console.error('Error updating park:', error);
            throw error;
        }
    }

    // Course Management
    async addCourse(courseData) {
        try {
            const docRef = await this.db.collection('courses').add(courseData);
            
            // Update local storage
            const courses = JSON.parse(localStorage.getItem('courses') || '{}');
            courses[docRef.id] = courseData;
            localStorage.setItem('courses', JSON.stringify(courses));

            return docRef.id;
        } catch (error) {
            console.error('Error adding course:', error);
            throw error;
        }
    }

    async updateCourse(courseId, courseData) {
        try {
            await this.db.collection('courses').doc(courseId).update(courseData);
            
            // Update local storage
            const courses = JSON.parse(localStorage.getItem('courses') || '{}');
            courses[courseId] = { ...courses[courseId], ...courseData };
            localStorage.setItem('courses', JSON.stringify(courses));
        } catch (error) {
            console.error('Error updating course:', error);
            throw error;
        }
    }

    // Enrollment Management
    async addEnrollment(enrollmentData) {
        try {
            const docRef = await this.db.collection('enrollments').add(enrollmentData);
            
            // Update local storage
            const enrollments = JSON.parse(localStorage.getItem('enrollments') || '{}');
            enrollments[docRef.id] = enrollmentData;
            localStorage.setItem('enrollments', JSON.stringify(enrollments));

            return docRef.id;
        } catch (error) {
            console.error('Error adding enrollment:', error);
            throw error;
        }
    }

    async updateEnrollment(enrollmentId, enrollmentData) {
        try {
            await this.db.collection('enrollments').doc(enrollmentId).update(enrollmentData);
            
            // Update local storage
            const enrollments = JSON.parse(localStorage.getItem('enrollments') || '{}');
            enrollments[enrollmentId] = { ...enrollments[enrollmentId], ...enrollmentData };
            localStorage.setItem('enrollments', JSON.stringify(enrollments));
        } catch (error) {
            console.error('Error updating enrollment:', error);
            throw error;
        }
    }

    // Transaction Management
    async updateTransaction(transactionId, transactionData) {
        try {
            await this.db.collection('transactions').doc(transactionId).update(transactionData);
            
            // Update local storage
            const transactions = JSON.parse(localStorage.getItem('transactions') || '{}');
            transactions[transactionId] = { ...transactions[transactionId], ...transactionData };
            localStorage.setItem('transactions', JSON.stringify(transactions));
        } catch (error) {
            console.error('Error updating transaction:', error);
            throw error;
        }
    }

    // Get Dashboard Statistics
    getDashboardStats() {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const enrollments = JSON.parse(localStorage.getItem('enrollments') || '{}');
        const certificates = JSON.parse(localStorage.getItem('certificates') || '{}');
        const licenses = JSON.parse(localStorage.getItem('licenses') || '{}');

        return {
            totalUsers: Object.keys(users).length,
            pendingEnrollments: Object.values(enrollments).filter(e => e.status === 'pending').length,
            pendingCertificates: Object.values(certificates).filter(c => c.status === 'pending').length,
            pendingLicenses: Object.values(licenses).filter(l => l.status === 'pending').length
        };
    }

    // Get IoT Data
    getIoTData() {
        return JSON.parse(localStorage.getItem('iotData') || '{}');
    }
}

// Export the API instance
const firebaseAPI = new FirebaseAPI();
