// app.js - Main application logic for the user profile

document.addEventListener('DOMContentLoaded', async () => {
    // Ensure Firebase is initialized
    if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
        console.error('Firebase SDK not loaded or not initialized.');
        alert('Error: Firebase services are not available. Please try again later.');
        return;
    }

    const userName = localStorage.getItem('userName');
    if (!userName) {
        console.error('User name not found in localStorage.');
        // Potentially redirect to login or show an error message
        // For now, we'll just stop execution for the profile page
        return;
    }

    try {
        const userData = await getUserData(userName);
        if (userData) {
            localStorage.setItem('userData', JSON.stringify(userData)); // Store full user data
            renderUserProfile(userData);

            // Get the certificates section element
            const certificatesSection = document.getElementById('certificates-section'); // Assuming this ID for the certificates container

            if (userData.role === 'General User') {
                if (certificatesSection) {
                    certificatesSection.style.display = 'none';
                }
                // Also, no need to display the license info if it's also role-specific
                const licenseInfoSection = document.getElementById('license-info-section'); // Assuming this ID
                if (licenseInfoSection) {
                    licenseInfoSection.style.display = 'none';
                }
            } else if (userData.role === 'Park Guide') {
                // Ensure sections are visible for Park Guide
                if (certificatesSection) {
                    certificatesSection.style.display = ''; // Or 'block', 'flex', etc., depending on its default
                }
                const licenseInfoSection = document.getElementById('license-info-section');
                if (licenseInfoSection) {
                    licenseInfoSection.style.display = ''; // Or 'block', 'flex', etc.
                }

                const licenseData = await getLicenseData(userData.name); // Use full name as per previous logic
                if (licenseData) {
                    localStorage.setItem('licenseData', JSON.stringify(licenseData));
                    renderLicense(licenseData);
                } else {
                    console.log('No license data found for this user.');
                    // Optionally hide or show a message in the license section
                }

                const certificatesData = await getCertificatesData(userData.name); // Use full name
                if (certificatesData && certificatesData.length > 0) {
                    localStorage.setItem('certificatesData', JSON.stringify(certificatesData));
                    renderCertificates(certificatesData, userData); // Pass userData for name
                } else {
                    console.log('No certificates found for this user.');
                    if (certificatesSection) {
                         // Optionally display a message like "No certificates to show."
                        const certificatesTableBody = document.querySelector('#certificates-table tbody');
                        if (certificatesTableBody) {
                            certificatesTableBody.innerHTML = '<tr><td colspan="5">No certificates to display.</td></tr>';
                        }
                    }
                }
            }
            // Add any other role-specific logic here
        } else {
            console.error('User data not found.');
            // Handle UI: show error, redirect, etc.
        }
    } catch (error) {
        console.error('Error loading user profile data:', error);
        // Handle UI: show error message
    }
}); 