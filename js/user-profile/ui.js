// ui.js - Handles DOM manipulation and UI updates

function formatDate(ts) {
    if (!ts) return '';
    if (typeof ts === 'string') return ts;
    if (ts.toDate) return ts.toDate().toLocaleDateString('en-GB');
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('en-GB');
    return '';
}

function renderUserProfile() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) return;
    document.getElementById('user-name').textContent = userData.name || '';
    document.getElementById('user-email').textContent = userData.email || '';
    const imgUrl = userData.imgUrl || 'Resources/Images/ProfilePicture/defaultProfile.jpeg';
    document.getElementById('user-img').src = imgUrl;

    if (userData.role === 'Park Guide') {
        document.getElementById('park-guide-extra').style.display = '';
        document.getElementById('user-ic').textContent = userData.icNumber || '';
        document.getElementById('user-phone').textContent = userData.phoneNumber || '';
        document.getElementById('license-section').style.display = '';
    } else {
        document.getElementById('park-guide-extra').style.display = 'none';
        document.getElementById('license-section').style.display = 'none';
    }
}

function renderLicense() {
    const licenseData = JSON.parse(localStorage.getItem('licenseData'));
    if (!licenseData) return;
    document.getElementById('license-number').textContent = licenseData.licenseNumber || '';
    document.getElementById('license-status').textContent = licenseData.status || '';
    document.getElementById('license-status').className = licenseData.status ? licenseData.status.toLowerCase() : '';
    document.getElementById('license-expiry').textContent = formatDate(licenseData.expiresAt);
    document.getElementById('license-holder').textContent = licenseData.userName || '';
}

const modal = document.getElementById('certificateModal');
const modalCertUserName = document.getElementById('modalCertUserName');
const modalCertName = document.getElementById('modalCertName');
const modalCertOrgName = document.getElementById('modalCertOrgName');
const modalCertIssueDate = document.getElementById('modalCertIssueDate');
const modalCertId = document.getElementById('modalCertId');
const closeButton = document.querySelector('.modal .close-button');
const downloadPdfButton = document.getElementById('downloadPdfButton');
const downloadPngButton = document.getElementById('downloadPngButton');
const certificateDisplayElement = document.getElementById('certificateDisplay');

function showCertificateModal(certificateId) {
    const certificate = JSON.parse(localStorage.getItem('certificatesData')).find(c => c.id === certificateId);
    const userData = JSON.parse(localStorage.getItem('userData'));

    if (certificate && userData) {
        // Populate modal with certificate details
        if (modalCertUserName) modalCertUserName.textContent = userData.name || 'N/A'; // User's full name
        if (modalCertName) modalCertName.textContent = certificate.certificateName || 'N/A';
        if (modalCertIssueDate) modalCertIssueDate.textContent = certificate.issuedAt ? formatDate(certificate.issuedAt) : 'N/A';
        // The line below will be removed to keep the issuer fixed
        // if (modalCertOrgName) modalCertOrgName.textContent = certificate.grantedByCertificateCourseTitle || 'Sarawak Forestry Corporation'; // Keep SFC as fallback if needed, or remove entirely
        if (modalCertId) modalCertId.textContent = certificate.id ? `#${certificate.id.substring(0, 10)}...` : 'N/A'; // Show a snippet of the ID

        // Set up download buttons with the current certificate ID
        if (downloadPdfButton) downloadPdfButton.dataset.certificateId = certificateId;
        if (downloadPngButton) downloadPngButton.dataset.certificateId = certificateId;

        if (certificateModal) certificateModal.style.display = 'block';
    } else {
        console.error('Certificate or user data not found for modal display.');
        alert('Could not display certificate details.');
    }
}

function closeCertificateModal() {
    modal.style.display = 'none';
}

if (closeButton) {
    closeButton.onclick = closeCertificateModal;
}
window.onclick = function(event) {
    if (event.target == modal) {
        closeCertificateModal();
    }
}

if (downloadPdfButton) {
    downloadPdfButton.onclick = function() {
        const certName = modal.dataset.currentCertName || 'certificate';
        if (certificateDisplayElement && window.html2canvas && window.jspdf) {
            html2canvas(certificateDisplayElement, { scale: 2, useCORS: true }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const { jsPDF } = window.jspdf;
                // Calculate dimensions: A4 is 210mm x 297mm. Give some margin.
                // Maintain aspect ratio of the certificate image.
                const pdfWidth = 190; // mm (A4 width 210mm - 20mm margin)
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const aspectRatio = canvasHeight / canvasWidth;
                const pdfHeight = pdfWidth * aspectRatio;

                const pdf = new jsPDF({
                    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                // Center the image if it's smaller than the page
                const xOffset = (pdf.internal.pageSize.getWidth() - pdfWidth) / 2;
                const yOffset = (pdf.internal.pageSize.getHeight() - pdfHeight) / 2;

                pdf.addImage(imgData, 'PNG', xOffset, yOffset, pdfWidth, pdfHeight);
                pdf.save(certName + '.pdf');
            }).catch(err => {
                console.error("Error generating PDF: ", err);
                alert("Could not generate PDF. See console for details.");
            });
        } else {
            alert('PDF generation library not loaded or certificate element not found.');
        }
    };
}

if (downloadPngButton) {
    downloadPngButton.onclick = function() {
        const certName = modal.dataset.currentCertName || 'certificate';
        if (certificateDisplayElement && window.html2canvas) {
            html2canvas(certificateDisplayElement, { scale: 2, useCORS: true  }).then(canvas => {
                const imageURL = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = imageURL;
                downloadLink.download = certName + '.png';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }).catch(err => {
                console.error("Error generating PNG: ", err);
                alert("Could not generate PNG. See console for details.");
            });
        } else {
            alert('PNG generation library not loaded or certificate element not found.');
        }
    };
}

function renderCertificates() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const certificatesSection = document.getElementById('certificates-section');

    if (userData && userData.role === 'General User') {
        if (certificatesSection) {
            certificatesSection.style.display = 'none';
        }
        return; // Do not render certificates for General User
    }

    // Ensure the section is visible if the role is not General User (or if it was previously hidden)
    // This is important if the user role could change dynamically or if there are other conditions
    if (certificatesSection) {
        certificatesSection.style.display = ''; // Or 'block', 'flex', etc., depending on its default display type
    }

    const certificates = JSON.parse(localStorage.getItem('certificatesData')) || [];
    const tbody = document.getElementById('certificates-table-body');
    tbody.innerHTML = '';
    certificates.forEach(cert => {
        const tr = document.createElement('tr');
        // Certificate Name
        const tdName = document.createElement('td');
        tdName.textContent = cert.certificateName || '';
        tr.appendChild(tdName);
        // Issued At
        const tdIssued = document.createElement('td');
        tdIssued.textContent = formatDate(cert.issuedAt);
        tr.appendChild(tdIssued);
        // Expires At
        const tdExpires = document.createElement('td');
        tdExpires.textContent = formatDate(cert.expiresAt);
        tr.appendChild(tdExpires);
        // Status
        const tdStatus = document.createElement('td');
        const statusSpan = document.createElement('span');
        statusSpan.className = 'status-badge';
        if (cert.status === 'Active') {
            statusSpan.textContent = 'Active';
        } else if (cert.status === 'Expired') {
            statusSpan.textContent = 'Expired';
            statusSpan.classList.add('expired');
        } else { 
            statusSpan.textContent = cert.status || '';
        }
        tdStatus.appendChild(statusSpan);
        tr.appendChild(tdStatus);
        // Action
        const tdAction = document.createElement('td');
        const btn = document.createElement('button');
        btn.className = 'certificate-action-btn';
        if (cert.status === 'Expired') {
            btn.textContent = 'Renew Certificate';
            // Potentially add event listener for renewal if needed
        } else {
            btn.textContent = 'Show Certificate';
            btn.onclick = function() { showCertificateModal(cert.id); };
        }
        tdAction.appendChild(btn);
        tr.appendChild(tdAction);
        tbody.appendChild(tr);
    });
} 