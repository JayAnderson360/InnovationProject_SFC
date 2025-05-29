// course-dashboard/ui.js - Handles DOM manipulation and UI updates for the course dashboard

const courseGrid = document.getElementById('cd-course-grid');
const welcomeMessageElement = document.getElementById('cd-welcome-message');
const usernameDisplayElement = document.getElementById('cd-username-display');
const userAvatarImgElement = document.getElementById('cd-user-avatar-img'); // Get avatar img element
const courseTypeFilterElement = document.getElementById('cd-course-type-filter');

// Payment Modal Elements
const paymentModal = document.getElementById('paymentModal');
const paymentModalCourseTitle = document.getElementById('paymentModalCourseTitle');
const paymentModalCourseFee = document.getElementById('paymentModalCourseFee');
const paymentProofInput = document.getElementById('paymentProofInput');
const paymentProofPreview = document.getElementById('paymentProofPreview');
const submitPaymentBtn = document.getElementById('submitPaymentBtn');
const paymentModalCloseBtn = document.querySelector('#paymentModal .cd-modal-close-btn');
const paymentModalMessage = document.getElementById('paymentModalMessage');

let currentCourseForPayment = null; // To store course details for payment submission

function populateCourseTypeFilter(courses) {
    if (!courseTypeFilterElement || !courses) return;

    const courseTypes = [...new Set(courses.map(course => course.courseType).filter(type => type))]; // Get unique, non-empty types
    
    // Clear existing options except the first "All Types"
    while (courseTypeFilterElement.options.length > 1) {
        courseTypeFilterElement.remove(1);
    }

    courseTypes.sort().forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        courseTypeFilterElement.appendChild(option);
    });
}

// Modified to accept viewMode and myCoursesStatus
function displayCourses(allCourses, enrollments, searchTerm = '', courseType = 'all', viewMode = 'dashboard', myCoursesStatus = 'all_my') {
    if (!courseGrid) return;
    courseGrid.innerHTML = ''; 

    let coursesToDisplay = [];

    if (viewMode === 'dashboard') {
        coursesToDisplay = allCourses.filter(course => course.published); // Start with all published courses

        // Filter by search term (only in dashboard mode for now)
        if (searchTerm) {
            searchTerm = searchTerm.toLowerCase();
            coursesToDisplay = coursesToDisplay.filter(course => 
                course.title.toLowerCase().includes(searchTerm) || 
                (course.description && course.description.toLowerCase().includes(searchTerm))
            );
        }

        // Filter by course type (only in dashboard mode for now)
        if (courseType !== 'all') {
            coursesToDisplay = coursesToDisplay.filter(course => course.courseType === courseType);
        }
    } else { // 'mycourses' view
        const enrolledCourseTitles = new Set(enrollments.map(e => e.courseTitle));
        coursesToDisplay = allCourses.filter(course => enrolledCourseTitles.has(course.title));

        if (myCoursesStatus !== 'all_my') {
            coursesToDisplay = coursesToDisplay.filter(course => {
                const enrollment = enrollments.find(e => e.courseTitle === course.title);
                return enrollment && enrollment.status === myCoursesStatus;
            });
        }
        // In 'mycourses' view, we only show courses that are 'active' or 'completed' based on enrollment status filter
        // The initial filter to `enrolledCourseTitles` already narrows it down to courses the user has an enrollment for.
        // Then `myCoursesStatus` further filters by 'active' or 'completed'. 'all_my' shows both.
        if (myCoursesStatus === 'all_my') {
             coursesToDisplay = coursesToDisplay.filter(course => {
                const enrollment = enrollments.find(e => e.courseTitle === course.title);
                return enrollment && (enrollment.status === 'active' || enrollment.status === 'completed');
            });
        }
    }

    if (!coursesToDisplay || coursesToDisplay.length === 0) {
        if (viewMode === 'mycourses') {
            courseGrid.innerHTML = '<p>You have no courses matching this filter.</p>';
        } else {
            courseGrid.innerHTML = '<p>No courses match your criteria.</p>';
        }
        return;
    }

    coursesToDisplay.forEach(course => {
        const userEnrollment = enrollments.find(e => e.courseTitle === course.title);
        const card = document.createElement('div');
        card.className = 'cd-course-card';

        let imagePlaceholderClass = 'type-default';
        if (course.title.toLowerCase().includes('wildlife')) imagePlaceholderClass = 'type-wildlife';
        else if (course.title.toLowerCase().includes('first aid') || course.title.toLowerCase().includes('safety')) imagePlaceholderClass = 'type-safety';
        else if (course.title.toLowerCase().includes('ecosystem') || course.title.toLowerCase().includes('environmental')) imagePlaceholderClass = 'type-environmental';
        else if (course.title.toLowerCase().includes('communication') || course.title.toLowerCase().includes('public speaking')) imagePlaceholderClass = 'type-communication';
        else if (course.title.toLowerCase().includes('navigation')) imagePlaceholderClass = 'type-navigation';
        
        let badgeClass = 'default';
        const courseTypeLower = course.courseType ? course.courseType.toLowerCase() : '';
        if (courseTypeLower.includes('wildlife')) badgeClass = 'wildlife';
        else if (courseTypeLower.includes('safety') || courseTypeLower.includes('first aid')) badgeClass = 'safety';
        else if (courseTypeLower.includes('environmental') || courseTypeLower.includes('conservation')) badgeClass = 'environmental';
        else if (courseTypeLower.includes('communication')) badgeClass = 'communication';
        else if (courseTypeLower.includes('navigation')) badgeClass = 'navigation';

        let actionButtonHTML = '';

        if (userEnrollment) {
            switch (userEnrollment.status) {
                case 'active':
                    actionButtonHTML = `<button class="cd-btn-continue" data-course-title="${course.title}">Continue</button>`;
                    break;
                case 'completed':
                    actionButtonHTML = '<span class="cd-status-text cd-status-completed">Completed</span>';
                    break;
                case 'pending':
                    actionButtonHTML = '<span class="cd-status-text cd-status-pending">Awaiting Approval</span>';
                    break;
                case 'awaiting': 
                    actionButtonHTML = `<button class="cd-btn-enroll" data-course-id="${course.id}" data-course-title="${course.title}" data-course-fee="${course.courseFee}">Begin</button>`;
                    break;
                case 'rejected':
                case 'did not finish':
                    actionButtonHTML = `<button class="cd-btn-enroll" data-course-id="${course.id}" data-course-title="${course.title}" data-course-fee="${course.courseFee}">Enroll Now</button>`;
                    break;
                default:
                    actionButtonHTML = `<button class="cd-btn-enroll" data-course-id="${course.id}" data-course-title="${course.title}" data-course-fee="${course.courseFee}">Enroll Now</button>`;
            }
        } else { 
            actionButtonHTML = `<button class="cd-btn-enroll" data-course-id="${course.id}" data-course-title="${course.title}" data-course-fee="${course.courseFee}">Enroll Now</button>`;
        }

        card.innerHTML = `
            <div class="cd-course-image-placeholder ${imagePlaceholderClass}">Course Image</div>
            <div class="cd-course-card-content">
                <span class="cd-course-type-badge ${badgeClass}">${course.courseType || 'General'}</span>
                <h3>${course.title}</h3>
                <p class="cd-course-description">${course.description || 'No description available.'}</p>
                <div class="cd-course-details">
                    <span class="cd-course-duration"><i class="far fa-clock"></i> ${course.durationMonths || 'N/A'} Months</span>
                    <span class="cd-course-price">RM${course.courseFee || 'N/A'}</span>
                </div>
            </div>
            <div class="cd-course-action">
                ${actionButtonHTML}
            </div>
        `;
        courseGrid.appendChild(card);
    });

    // Add event listeners to newly created "Enroll Now" / "Begin" buttons
    document.querySelectorAll('.cd-btn-enroll').forEach(button => {
        button.addEventListener('click', (event) => {
            const courseId = event.target.dataset.courseId;
            const courseTitle = event.target.dataset.courseTitle;
            const courseFee = event.target.dataset.courseFee;
            openPaymentModal(courseTitle, courseFee, courseId);
        });
    });

    document.querySelectorAll('.cd-btn-continue').forEach(button => {
        button.addEventListener('click', (event) => {
            const courseTitle = event.target.dataset.courseTitle;
            localStorage.setItem('currentCourseTitle', courseTitle);
            window.location.href = '../course-page.html'; // Redirect to course page
        });
    });
}

function openPaymentModal(title, fee, courseId) {
    currentCourseForPayment = { id: courseId, title: title, fee: parseFloat(fee) || 0 };
    if (paymentModalCourseTitle) paymentModalCourseTitle.textContent = title;
    if (paymentModalCourseFee) paymentModalCourseFee.textContent = (parseFloat(fee) || 0).toFixed(2);
    if (paymentProofInput) paymentProofInput.value = ''; // Clear previous selection
    if (paymentProofPreview) {
        paymentProofPreview.style.display = 'none';
        paymentProofPreview.src = '#';
    }
    if (paymentModalMessage) paymentModalMessage.textContent = '';
    if (submitPaymentBtn) submitPaymentBtn.disabled = false;
    if (paymentModal) paymentModal.style.display = 'block';
}

function closePaymentModal() {
    if (paymentModal) paymentModal.style.display = 'none';
    currentCourseForPayment = null;
}

async function handleSubmitPayment() {
    if (!currentCourseForPayment || !paymentProofInput.files || paymentProofInput.files.length === 0) {
        paymentModalMessage.textContent = 'Please select a payment proof image.';
        paymentModalMessage.className = 'cd-modal-message error';
        return;
    }

    const file = paymentProofInput.files[0];
    const loggedInUserName = localStorage.getItem('userName');
    const userDataString = localStorage.getItem('userData');
    const userData = userDataString ? JSON.parse(userDataString) : {};
    const userId = userData.id || 'unknownUser'; 

    if (!loggedInUserName) {
        paymentModalMessage.textContent = 'User not logged in. Cannot proceed.';
        paymentModalMessage.className = 'cd-modal-message error';
        return;
    }

    submitPaymentBtn.disabled = true;
    paymentModalMessage.textContent = 'Processing...';
    paymentModalMessage.className = 'cd-modal-message';

    try {
        const now = new Date();
        const dateString = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        const timeString = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
        const fileExtension = file.name.split('.').pop();
        const courseIdPart = currentCourseForPayment.id || currentCourseForPayment.title.replace(/\s+/g, '_');
        const fileName = `${userId}_${courseIdPart}_${dateString}_${timeString}.${fileExtension}`;

        // Call the PHP upload script via the api.js function
        const paymentUrl = await uploadPaymentProofViaPHP(file, fileName);

        const enrollmentData = {
            userName: loggedInUserName,
            courseTitle: currentCourseForPayment.title,
            enrolledDate: firebase.firestore.FieldValue.serverTimestamp(),
            paymentUrl: paymentUrl, // This will be the path returned by the PHP script
            amountPaid: currentCourseForPayment.fee,
            status: 'pending' 
        };

        await createEnrollmentRecord(enrollmentData);

        paymentModalMessage.textContent = 'Payment submitted successfully! Awaiting approval.';
        paymentModalMessage.className = 'cd-modal-message success';
        
        const updatedEnrollments = await getUserEnrollments(loggedInUserName);
        const allCourses = JSON.parse(localStorage.getItem('coursesData')) || [];
        
        const searchInputVal = document.getElementById('cd-search-input')?.value || '';
        const courseTypeFilterVal = document.getElementById('cd-course-type-filter')?.value || 'all';
        const currentViewModeVal = window.currentViewMode || 'dashboard'; 
        const myCoursesStatusFilterVal = document.getElementById('my-courses-filter-select')?.value || 'all_my';
        
        displayCourses(allCourses, updatedEnrollments, searchInputVal, courseTypeFilterVal, currentViewModeVal, myCoursesStatusFilterVal);

        setTimeout(closePaymentModal, 3000);

    } catch (error) {
        console.error('Payment submission failed:', error);
        paymentModalMessage.textContent = `Error: ${error.message || 'Could not submit payment.'}`;
        paymentModalMessage.className = 'cd-modal-message error';
        submitPaymentBtn.disabled = false;
    }
}

// Event Listeners for Payment Modal
if (paymentModalCloseBtn) paymentModalCloseBtn.addEventListener('click', closePaymentModal);
if (paymentProofInput) {
    paymentProofInput.addEventListener('change', function(event) {
        if (event.target.files && event.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                if (paymentProofPreview) {
                    paymentProofPreview.src = e.target.result;
                    paymentProofPreview.style.display = 'block';
                }
            }
            reader.readAsDataURL(event.target.files[0]);
        } else {
            if (paymentProofPreview) paymentProofPreview.style.display = 'none';
        }
    });
}
if (submitPaymentBtn) submitPaymentBtn.addEventListener('click', handleSubmitPayment);
window.addEventListener('click', function(event) { // Close modal if clicked outside
    if (event.target === paymentModal) {
        closePaymentModal();
    }
});

// Renamed to updateUserDisplay to reflect it updates more than just the message
function updateUserDisplay(userData) {
    const defaultAvatar = '../Resources/Images/ProfilePicture/defaultProfile.jpeg'; // Path relative to course-dashboard.html

    if (userData && userData.name) {
        if (welcomeMessageElement) {
            welcomeMessageElement.textContent = `Welcome back, ${userData.name.split(' ')[0]}!`;
        }
        if (usernameDisplayElement) {
            usernameDisplayElement.textContent = userData.name;
        }
        if (userAvatarImgElement) {
            userAvatarImgElement.src = "../" + userData.imgUrl || defaultAvatar;
            userAvatarImgElement.alt = userData.name + "'s avatar";
        }
    } else {
        // Handle guest or unknown user
        if (welcomeMessageElement) {
            welcomeMessageElement.textContent = 'Welcome, Guest!';
        }
        if (usernameDisplayElement) {
            usernameDisplayElement.textContent = 'Guest';
        }
        if (userAvatarImgElement) {
            userAvatarImgElement.src = defaultAvatar;
            userAvatarImgElement.alt = 'Default avatar';
        }
    }
}
