// api.js - Handles Firestore interactions

// Get user data from Firestore (users collection) by userName (matches 'name' field)
async function getUserData(userName) {
    const usersRef = window.db.collection('users');
    const snapshot = await usersRef.where('name', '==', userName).get();
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const userData = doc.data();
        userData.userId = doc.id; // Save the document ID for later use
        localStorage.setItem('userData', JSON.stringify(userData));
        return userData;
    }
    return null;
}

// Get license data from Firestore (licenses collection) by userName
async function getLicenseData(userName) {
    const licensesRef = window.db.collection('licenses');
    const snapshot = await licensesRef.where('userName', '==', userName).get();
    if (!snapshot.empty) {
        const licenseData = snapshot.docs[0].data();
        localStorage.setItem('licenseData', JSON.stringify(licenseData));
        return licenseData;
    }
    return null;
}

// Get certificates data from Firestore (certificates collection) by userName
async function getCertificatesData(userName) {
    const certsRef = window.db.collection('certificates');
    const snapshot = await certsRef.where('userName', '==', userName).get();
    const certificates = [];
    snapshot.forEach(doc => {
        const certData = doc.data();
        certData.id = doc.id; // Add the document ID to the certificate data
        certificates.push(certData);
    });
    localStorage.setItem('certificatesData', JSON.stringify(certificates));
    return certificates;
} 