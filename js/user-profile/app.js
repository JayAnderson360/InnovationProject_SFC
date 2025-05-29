// app.js - Main application logic for the user profile

document.addEventListener('DOMContentLoaded', async () => {
    const userName = localStorage.getItem('userName');
    if (!userName) return;
    // Fetch user data
    const userData = await getUserData(userName);
    if (!userData) return;
    // If Park Guide, fetch license and certificates by userName
    if (userData.role === 'Park Guide') {
        await getLicenseData(userName);
        await getCertificatesData(userName);
    } else {
        localStorage.removeItem('licenseData');
        localStorage.removeItem('certificatesData');
    }
    // Render UI
    renderUserProfile();
    if (userData.role === 'Park Guide') {
        renderLicense();
    }
    renderCertificates();
}); 