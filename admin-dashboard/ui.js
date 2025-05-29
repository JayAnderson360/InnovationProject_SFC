// ui.js - Handles DOM manipulation and UI updates

// Helper to convert Firestore timestamp to JS Date
function firestoreTimestampToDate(ts) {
    if (!ts || typeof ts !== 'object' || typeof ts.seconds !== 'number') return null;
    return new Date(ts.seconds * 1000);
}

// UI Functions
class UI {
    constructor() {
        this.currentPage = 'dashboard';
        this.iotChart = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-links li').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateToPage(page);
            });
        });

        // Time range selector
        document.querySelectorAll('.time-range-selector button').forEach(button => {
            button.addEventListener('click', (e) => {
                const range = e.target.dataset.range;
                this.updateIoTChart(range);
            });
        });
    }

    // Navigation
    navigateToPage(page) {
        // Update active state
        document.querySelectorAll('.nav-links li').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const section = document.getElementById(page);
        if (section) {
            section.classList.add('active');
        } else {
            // Load dynamic content
            this.loadPageContent(page);
        }

        this.currentPage = page;
    }

    // Load dynamic page content
    async loadPageContent(page) {
        const container = document.getElementById('content-container');
        container.innerHTML = '';

        switch (page) {
            case 'users':
                await this.loadUsersPage();
                break;
            case 'parks':
                await this.loadParksPage();
                break;
            case 'courses':
                await this.loadCoursesPage();
                break;
            case 'enrollment':
                await this.loadEnrollmentPage();
                break;
            case 'submissions':
                await this.loadSubmissionsPage();
                break;
            case 'certification':
                await this.loadCertificationPage();
                break;
            case 'visitor-feedback':
                await this.loadVisitorFeedbackPage();
                break;
            case 'transactions':
                await this.loadTransactionsPage();
                break;
            case 'licenses':
                await this.loadLicensesPage();
                break;
        }
    }

    // Dashboard Functions
    updateDashboardStats() {
        const stats = firebaseAPI.getDashboardStats();
        document.getElementById('total-users').textContent = stats.totalUsers;
        document.getElementById('pending-enrollments').textContent = stats.pendingEnrollments;
        document.getElementById('pending-certificates').textContent = stats.pendingCertificates;
        document.getElementById('pending-licenses').textContent = stats.pendingLicenses;
    }

    initializeIoTChart() {
        const ctx = document.getElementById('iotChart').getContext('2d');
        this.iotChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Temperature (°C)',
                    data: [],
                    borderColor: '#4CAF50',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'IoT Temperature Over Time'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                }
            }
        });
    }

    updateIoTChart(range) {
        const iotData = firebaseAPI.getIoTData();
        const now = new Date();
        let startTime;

        // Calculate startTime based on range
        switch (range) {
            case '1M': startTime = new Date(now.getTime() - 60000); break;
            case '1H': startTime = new Date(now.getTime() - 3600000); break;
            case '1D': startTime = new Date(now.getTime() - 86400000); break;
            case '1W': startTime = new Date(now.getTime() - 604800000); break;
            case '1Y': startTime = new Date(now.getTime() - 31536000000); break;
            default: startTime = new Date(0); // Show all if unknown
        }

        // Helper to parse your dateTimeString
        function parseDateTimeString(str) {
            // Format: YYYY-MM-DD_HH-mm-ss
            const [date, time] = str.split('_');
            const [year, month, day] = date.split('-');
            const [hour, minute, second] = time.split('-');
            return new Date(
                Number(year), Number(month) - 1, Number(day),
                Number(hour), Number(minute), Number(second)
            );
        }

        // Filter and sort data
        const filteredData = Object.entries(iotData)
            .filter(([dateTimeString]) => parseDateTimeString(dateTimeString) >= startTime)
            .sort(([a], [b]) => parseDateTimeString(a) - parseDateTimeString(b));

        this.iotChart.data.labels = filteredData.map(([dateTimeString]) =>
            parseDateTimeString(dateTimeString).toLocaleTimeString()
        );
        this.iotChart.data.datasets[0].data = filteredData.map(([, data]) => data.temperature);
        this.iotChart.update();

        // Update sensor status
        if (filteredData.length > 0) {
            const latestData = filteredData[filteredData.length - 1][1];
            this.updateSensorStatus(latestData);
        } else {
            this.updateSensorStatus({});
        }
    }

    updateSensorStatus(data) {
        document.getElementById('overall-status').textContent = this.getStatusText(data.status);
        document.getElementById('right-sensor').textContent = this.getMovementText(data.rightSensor);
        document.getElementById('middle-sensor').textContent = this.getMovementText(data.middleSensor);
        document.getElementById('left-sensor').textContent = this.getMovementText(data.leftSensor);
    }

    getStatusText(status) {
        switch (status) {
            case 'safe': return 'Safe';
            case 'warning': return 'Warning';
            case 'alert': return 'Alert';
            default: return 'Unknown';
        }
    }

    getMovementText(movement) {
        switch (movement) {
            case 'approaching': return 'Approaching';
            case 'moving_away': return 'Moving Away';
            case 'stationary': return 'Stationary';
            default: return 'Unknown';
        }
    }

    // Modal Functions
    showModal(content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                ${content}
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

        modal.querySelector('.modal-close').onclick = () => {
            modal.remove();
        };

        window.onclick = (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        };
    }

    // Form Functions
    createForm(fields, onSubmit) {
        const form = document.createElement('form');
        form.innerHTML = fields.map(field => `
            <div class="form-group">
                <label for="${field.id}">${field.label}</label>
                <input type="${field.type}" 
                       id="${field.id}" 
                       name="${field.id}" 
                       class="form-control"
                       ${field.required ? 'required' : ''}>
            </div>
        `).join('');

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'btn btn-primary';
        submitButton.textContent = 'Submit';
        form.appendChild(submitButton);

        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = {};
            fields.forEach(field => {
                formData[field.id] = form[field.id].value;
            });
            onSubmit(formData);
        };

        return form;
    }

    // Table Functions
    createTable(headers, data) {
        const table = document.createElement('table');
        table.className = 'data-table';

        // Create header
        const thead = document.createElement('thead');
        // Check if any row has actions to decide if the Actions header is needed
        const hasActions = data.some(row => row.actions && Array.isArray(row.actions) && row.actions.length > 0);

        thead.innerHTML = `
            <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
                ${hasActions ? '<th>Actions</th>' : ''} 
            </tr>
        `;
        table.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');
        tbody.innerHTML = data.map(row => {
             // Use the actions array from the row if it exists
            const rowActions = row.actions && Array.isArray(row.actions) ? row.actions : [];

            return `
            <tr>
                ${headers.map(header => `<td>${row[this.headerKey(header)] ?? '-'}</td>`).join('')}
                ${hasActions ? `
                    <td>
                        ${rowActions.map(action => `
                            <button class="btn btn-${action.type}" 
                                    onclick="${action.onClick}('${row._id}')">
                                ${action.label}
                            </button>
                        `).join('')}
                    </td>
                ` : ''}
            </tr>
            `;
        }).join('');
        table.appendChild(tbody);

        return table;
    }

    // Helper to map header to object key
    headerKey(header) {
        if (header === 'IC Number') return 'icNumber';
        if (header === 'Phone Number') return 'phoneNumber';
        if (header === 'Date of Gazettement') return 'dateOfGazettement';
        return header
            .replace(/ /g, '')
            .replace(/#/g, 'Number')
            .replace(/-/g, '')
            .replace(/\(.*\)/, '')
            .replace(/\W/g, '')
            .replace(/^./, c => c.toLowerCase());
    }

    // Page-specific loading functions
    async loadUsersPage() {
        const container = document.getElementById('content-container');
        const users = JSON.parse(localStorage.getItem('users') || '{}');

        // Create header with add button
        const header = document.createElement('div');
        header.className = 'page-header';
        header.innerHTML = `
            <h1>Users</h1>
            <button class="btn btn-primary" onclick="ui.showAddUserModal()">Add User</button>
        `;
        container.appendChild(header);

        // Create users table
        const table = this.createTable(
            ['Name', 'Email', 'Role', 'IC Number', 'Phone Number'],
            Object.entries(users).map(([id, user]) => ({
                name: user.name,
                email: user.email,
                role: user.role,
                icNumber: user.icNumber || '-',
                phoneNumber: user.phoneNumber || '-',
                _id: id // Store ID separately for actions
            })),
            [
                {
                    label: 'Edit',
                    type: 'primary',
                    onClick: 'ui.showEditUserModal'
                }
            ]
        );
        container.appendChild(table);
    }

    async loadParksPage() {
        const container = document.getElementById('content-container');
        const parks = JSON.parse(localStorage.getItem('parks') || '{}');

        // Create header with add button
        const header = document.createElement('div');
        header.className = 'page-header';
        header.innerHTML = `
            <h1>Parks</h1>
            <button class="btn btn-primary" onclick="ui.showAddParkModal()">Add Park</button>
        `;
        container.appendChild(header);

        // Create parks table
        const table = this.createTable(
            ['Name', 'Location', 'Type', 'Land Area', 'Marine Area', 'Date of Gazettement'],
            Object.entries(parks).map(([id, park]) => ({
                name: park.name,
                location: park.location,
                type: park.type,
                landArea: park.landArea,
                marineArea: park.marineArea,
                dateOfGazettement: (() => {
                    const dateTs = park.dateOfGazettement;
                    const dateObj = firestoreTimestampToDate(dateTs);
                    return dateObj?.toLocaleDateString() || '-';
                })(),
                _id: id // Store ID separately for actions
            })),
            [
                {
                    label: 'Edit',
                    type: 'primary',
                    onClick: 'ui.showEditParkModal'
                }
            ]
        );
        container.appendChild(table);
    }

    async loadCoursesPage() {
        const container = document.getElementById('content-container');
        const courses = JSON.parse(localStorage.getItem('courses') || '{}');

        // Create header with add button
        const header = document.createElement('div');
        header.className = 'page-header';
        header.innerHTML = `
            <h1>Courses</h1>
            <button class="btn btn-primary" onclick="ui.showAddCourseModal()">Add Course</button>
        `;
        container.appendChild(header);

        // Create courses grid
        const grid = document.createElement('div');
        grid.className = 'courses-grid';
        grid.innerHTML = Object.entries(courses).map(([id, course]) => `
            <div class="course-card" onclick="ui.showCourseDetails('${id}')">
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <div class="course-meta">
                    <span class="course-type">${course.courseType}</span>
                    <span class="course-status ${course.published ? 'published' : 'draft'}">
                        ${course.published ? 'Published' : 'Draft'}
                    </span>
                </div>
            </div>
        `).join('');
        container.appendChild(grid);
    }

    async loadEnrollmentPage() {
        const container = document.getElementById('content-container');
        const enrollments = JSON.parse(localStorage.getItem('enrollments') || '{}');

        // Create header with add button
        const header = document.createElement('div');
        header.className = 'page-header';
        header.innerHTML = `
            <h1>Enrollments</h1>
            <button class="btn btn-primary" onclick="ui.showAddEnrollmentModal()">Add Enrollment</button>
        `;
        container.appendChild(header);

        // Define the default actions
        const defaultActions = [
            {
                label: 'Approve',
                type: 'success',
                onClick: 'ui.approveEnrollment'
            },
            {
                label: 'Reject',
                type: 'danger',
                onClick: 'ui.rejectEnrollment'
            }
        ];

        // Create enrollments table
        const table = this.createTable(
            ['Name', 'Course', 'Status', 'Date Enrolled'],
            Object.entries(enrollments).map(([id, enrollment]) => ({
                name: enrollment.userName,
                course: enrollment.courseTitle,
                status: enrollment.status,
                dateEnrolled: firestoreTimestampToDate(enrollment.enrolledDate)?.toLocaleDateString() || '-',
                _id: id, // Store ID separately for actions
                // Conditionally include actions based on status
                actions: (enrollment.status === 'Rejected' || enrollment.status === 'completed') ? [] : defaultActions
            })),
             // Pass the actions array based on the row data
            (row) => row.actions
        );
        container.appendChild(table);
    }

    async loadSubmissionsPage() {
        const container = document.getElementById('content-container');
        const submissions = JSON.parse(localStorage.getItem('submissions') || '{}');
        const courses = JSON.parse(localStorage.getItem('courses') || '{}');

        // Create filters
        const filters = document.createElement('div');
        filters.className = 'submission-filters';
        filters.innerHTML = `
            <select id="course-filter" onchange="ui.filterSubmissions()">
                <option value="">Select Course</option>
                ${Object.entries(courses).map(([id, course]) => 
                    `<option value="${id}">${course.title}</option>`
                ).join('')}
            </select>
            <select id="module-filter" onchange="ui.filterSubmissions()">
                <option value="">Select Module</option>
            </select>
            <select id="guide-filter" onchange="ui.filterSubmissions()">
                <option value="">Select Guide</option>
            </select>
        `;
        container.appendChild(filters);

        // Create submissions table
        const table = this.createTable(
            ['Test Title', 'Question Type', 'Answer', 'Is Correct', 'Score'],
            Object.entries(submissions).map(([id, submission]) => ({
                testTitle: submission.testTitle,
                questionType: (() => {
                    const tests = JSON.parse(localStorage.getItem('tests') || '{}');
                    // Find the test by title - assumes unique test titles
                    const test = Object.values(tests).find(t => t.title === submission.testTitle);
                    // Assuming each test object has a 'questions' object and we need the type of the first question
                    return test && test.questions && Object.values(test.questions).length > 0 
                        ? Object.values(test.questions)[0].type 
                        : '-';
                })(),
                answer: submission.answers && submission.answers[0] ? submission.answers[0].userAnswer : '-',
                isCorrect: submission.answers && submission.answers[0] ? (submission.answers[0].isCorrect ? 'Yes' : 'No') : '-',
                score: submission.score !== undefined && submission.totalPossibleScore !== undefined ? `${submission.score}/${submission.totalPossibleScore}` : '-',
                _id: id // Store ID separately for actions
            }))
        );
        container.appendChild(table);
    }

    async loadCertificationPage() {
        const container = document.getElementById('content-container');
        const certificates = JSON.parse(localStorage.getItem('certificates') || '{}');

        // Create header
        const header = document.createElement('div');
        header.className = 'page-header';
        header.innerHTML = '<h1>Certifications</h1>';
        container.appendChild(header);

        // Create certificates table
        const table = this.createTable(
            ['Name', 'Certificate Name', 'Status', 'Issued At', 'Expires At'],
            Object.entries(certificates).map(([id, cert]) => ({
                name: cert.userName,
                certificateName: cert.certificateName,
                status: cert.status,
                issuedAt: firestoreTimestampToDate(cert.issuedAt)?.toLocaleDateString() || '-',
                expiresAt: firestoreTimestampToDate(cert.expiresAt)?.toLocaleDateString() || '-',
                _id: id // Store ID separately for actions
            }))
        );
        container.appendChild(table);
    }

    async loadVisitorFeedbackPage() {
        const container = document.getElementById('content-container');
        const feedback = JSON.parse(localStorage.getItem('visitor_feedback') || '{}');

        // Create header
        const header = document.createElement('div');
        header.className = 'page-header';
        header.innerHTML = '<h1>Visitor Feedback</h1>';
        container.appendChild(header);

        // Create feedback table
        const table = this.createTable(
            ['Visitor Name', 'Guide Name', 'Rating', 'Comments', 'Date'],
            Object.entries(feedback).map(([id, fb]) => ({
                visitorName: fb.visitor_name,
                guideName: fb.guideName,
                rating: this.calculateAverageRating(fb),
                comments: fb.Comments,
                date: (() => {
                    const rawDate = fb.feedback_date;
                    const dateObj = firestoreTimestampToDate(rawDate);
                    console.log('Visitor Feedback Date Debug:', { raw: rawDate, converted: dateObj });
                    return dateObj?.toLocaleDateString() || '-';
                })(),
                _id: id // Store ID separately for actions
            }))
        );
        container.appendChild(table);
    }

    async loadTransactionsPage() {
        const container = document.getElementById('content-container');
        const transactions = JSON.parse(localStorage.getItem('transactions') || '{}');

        // Create header
        const header = document.createElement('div');
        header.className = 'page-header';
        header.innerHTML = '<h1>Transactions</h1>';
        container.appendChild(header);

        // Create transactions table
        const table = this.createTable(
            ['Name', 'Amount', 'Image', 'Submitted At', 'Status', 'Verified At', 'Verified By', 'Notes'],
            Object.entries(transactions).map(([id, trans]) => ({
                name: trans.userName,
                amount: `RM ${trans.totalAmountPaid}`,
                image: `<button onclick="ui.showPaymentProof('${trans.paymentProofImageUrl}')">View proof</button>`,
                submittedAt: firestoreTimestampToDate(trans.submittedAt)?.toLocaleDateString() || '-',
                status: trans.status,
                verifiedAt: trans.verifiedAt ? firestoreTimestampToDate(trans.verifiedAt)?.toLocaleDateString() : '-',
                verifiedBy: trans.verifiedBy || '-',
                notes: trans.notes || '-',
                _id: id // Store ID separately for actions
            })),
            [
                {
                    label: 'Verify',
                    type: 'success',
                    onClick: 'ui.verifyTransaction'
                },
                {
                    label: 'Reject',
                    type: 'danger',
                    onClick: 'ui.rejectTransaction'
                }
            ]
        );
        container.appendChild(table);
    }

    async loadLicensesPage() {
        const container = document.getElementById('content-container');
        const licenses = JSON.parse(localStorage.getItem('licenses') || '{}');

        // Create header
        const header = document.createElement('div');
        header.className = 'page-header';
        header.innerHTML = '<h1>Licenses</h1>';
        container.appendChild(header);

        // Create licenses table
        const table = this.createTable(
            ['Name', 'License Number', 'Status', 'Issued At', 'Expires At'],
            Object.entries(licenses).map(([id, license]) => ({
                name: license.userName,
                licenseNumber: license.licenseNumber,
                status: license.status,
                issuedAt: firestoreTimestampToDate(license.issuedAt)?.toLocaleDateString() || '-',
                expiresAt: firestoreTimestampToDate(license.expiresAt)?.toLocaleDateString() || '-',
                _id: id // Store ID separately for actions
            }))
        );
        container.appendChild(table);
    }

    // Helper functions
    calculateAverageRating(feedback) {
        const ratings = [
            feedback.CommunicationSkills,
            feedback.Engagement,
            feedback.GeneralKnowledge,
            feedback.KnowledgeOfThePark
        ];
        return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
    }

    showPaymentProof(imageUrl) {
        this.showModal(`
            <div class="payment-proof">
                <img src="${imageUrl}" alt="Payment Proof" style="max-width: 100%;">
            </div>
        `);
    }

    // Modal and Form Functions
    showAddUserModal() {
        const form = this.createForm([
            { id: 'name', label: 'Name', type: 'text', required: true },
            { id: 'email', label: 'Email', type: 'email', required: true },
            { id: 'password', label: 'Password', type: 'password', required: true },
            { id: 'role', label: 'Role', type: 'select', required: true },
            { id: 'icNumber', label: 'IC Number', type: 'text' },
            { id: 'phoneNumber', label: 'Phone Number', type: 'tel' }
        ], async (formData) => {
            try {
                await firebaseAPI.addUser(formData);
                this.navigateToPage('users');
            } catch (error) {
                console.error('Error adding user:', error);
                this.showError('Failed to add user. Please try again.');
            }
        });

        this.showModal(`
            <h2>Add New User</h2>
            ${form.outerHTML}
        `);
    }

    showEditUserModal(userId) {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const user = users[userId];

        const form = this.createForm([
            { id: 'name', label: 'Name', type: 'text', required: true },
            { id: 'email', label: 'Email', type: 'email', required: true },
            { id: 'role', label: 'Role', type: 'select', required: true },
            { id: 'icNumber', label: 'IC Number', type: 'text' },
            { id: 'phoneNumber', label: 'Phone Number', type: 'tel' }
        ], async (formData) => {
            try {
                await firebaseAPI.updateUser(userId, formData);
                this.navigateToPage('users');
            } catch (error) {
                console.error('Error updating user:', error);
                this.showError('Failed to update user. Please try again.');
            }
        });

        // Pre-fill form data
        Object.entries(user).forEach(([key, value]) => {
            const input = form.querySelector(`#${key}`);
            if (input) input.value = value;
        });

        this.showModal(`
            <h2>Edit User</h2>
            ${form.outerHTML}
        `);
    }

    showAddParkModal() {
        const form = this.createForm([
            { id: 'name', label: 'Name', type: 'text', required: true },
            { id: 'location', label: 'Location', type: 'text', required: true },
            { id: 'type', label: 'Type', type: 'select', required: true },
            { id: 'landArea', label: 'Land Area', type: 'number', required: true },
            { id: 'marineArea', label: 'Marine Area', type: 'number', required: true },
            { id: 'dateOfGazettement', label: 'Date of Gazettement', type: 'date', required: true }
        ], async (formData) => {
            try {
                await firebaseAPI.addPark(formData);
                this.navigateToPage('parks');
            } catch (error) {
                console.error('Error adding park:', error);
                this.showError('Failed to add park. Please try again.');
            }
        });

        this.showModal(`
            <h2>Add New Park</h2>
            ${form.outerHTML}
        `);
    }

    showEditParkModal(parkId) {
        const parks = JSON.parse(localStorage.getItem('parks') || '{}');
        const park = parks[parkId];

        const form = this.createForm([
            { id: 'name', label: 'Name', type: 'text', required: true },
            { id: 'location', label: 'Location', type: 'text', required: true },
            { id: 'type', label: 'Type', type: 'select', required: true },
            { id: 'landArea', label: 'Land Area', type: 'number', required: true },
            { id: 'marineArea', label: 'Marine Area', type: 'number', required: true },
            { id: 'dateOfGazettement', label: 'Date of Gazettement', type: 'date', required: true }
        ], async (formData) => {
            try {
                await firebaseAPI.updatePark(parkId, formData);
                this.navigateToPage('parks');
            } catch (error) {
                console.error('Error updating park:', error);
                this.showError('Failed to update park. Please try again.');
            }
        });

        // Pre-fill form data
        Object.entries(park).forEach(([key, value]) => {
            const input = form.querySelector(`#${key}`);
            if (input) input.value = value;
        });

        this.showModal(`
            <h2>Edit Park</h2>
            ${form.outerHTML}
        `);
    }

    showAddCourseModal() {
        const form = this.createForm([
            { id: 'title', label: 'Title', type: 'text', required: true },
            { id: 'description', label: 'Description', type: 'textarea', required: true },
            { id: 'courseType', label: 'Course Type', type: 'select', required: true },
            { id: 'certificateName', label: 'Certificate Name', type: 'text' },
            { id: 'duration', label: 'Duration (Days)', type: 'number', required: true },
            { id: 'price', label: 'Price (RM)', type: 'number', required: true }
        ], async (formData) => {
            try {
                await firebaseAPI.addCourse(formData);
                this.navigateToPage('courses');
            } catch (error) {
                console.error('Error adding course:', error);
                this.showError('Failed to add course. Please try again.');
            }
        });

        this.showModal(`
            <h2>Add New Course</h2>
            ${form.outerHTML}
        `);
    }

    showCourseDetails(courseId) {
        const courses = JSON.parse(localStorage.getItem('courses') || '{}');
        const course = courses[courseId];

        const content = `
            <h2>${course.title}</h2>
            <p>${course.description}</p>
            <div class="course-details">
                <h3>Modules</h3>
                ${course.moduleOrder.map(moduleId => {
                    const module = course.modules[moduleId];
                    return `
                        <div class="module">
                            <h4>${module.title}</h4>
                            <p>${module.content}</p>
                            ${module.documentLink ? `<p>Document Material: <a href="${module.documentLink}" target="_blank">${module.documentLink}</a></p>` : ''}
                            ${module.videoLink ? `<p>Video Material: <a href="${module.videoLink}" target="_blank">${module.videoLink}</a></p>` : ''}
                            ${module.testIds ? `
                                <div class="tests">
                                    ${module.testIds.map(testId => `
                                        <button onclick="ui.showTestDetails('${testId}')">View Test</button>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        this.showModal(content);
    }

    showTestDetails(testId) {
        const tests = JSON.parse(localStorage.getItem('tests') || '{}');
        const test = tests[testId];

        const content = `
            <h2>${test.title}</h2>
            <div class="test-details">
                ${Object.entries(test.questions).map(([questionId, question]) => `
                    <div class="question">
                        <h4>${question.text}</h4>
                        <p>Type: ${question.type}</p>
                        <p>Correct Answer: ${question.correctAnswer}</p>
                    </div>
                `).join('')}
            </div>
        `;

        this.showModal(content);
    }

    showAddEnrollmentModal() {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const courses = JSON.parse(localStorage.getItem('courses') || '{}');

        const form = this.createForm([
            { 
                id: 'userName', 
                label: 'Park Guide', 
                type: 'select', 
                required: true,
                options: Object.entries(users)
                    .filter(([, user]) => user.role === 'Park Guide')
                    .map(([id, user]) => ({
                        value: user.name,
                        label: user.name
                    }))
            },
            { 
                id: 'courseTitle', 
                label: 'Course', 
                type: 'select', 
                required: true,
                options: Object.entries(courses)
                    .filter(([, course]) => course.published)
                    .map(([id, course]) => ({
                        value: course.title,
                        label: course.title
                    }))
            }
        ], async (formData) => {
            try {
                const enrollmentData = {
                    ...formData,
                    status: 'Not Paid',
                    enrolledDate: new Date().toISOString()
                };
                await firebaseAPI.addEnrollment(enrollmentData);
                this.navigateToPage('enrollment');
            } catch (error) {
                console.error('Error adding enrollment:', error);
                this.showError('Failed to add enrollment. Please try again.');
            }
        });

        this.showModal(`
            <h2>Add New Enrollment</h2>
            ${form.outerHTML}
        `);
    }

    async approveEnrollment(enrollmentId) {
        try {
            await firebaseAPI.updateEnrollment(enrollmentId, { status: 'active' });
            this.navigateToPage('enrollment');
        } catch (error) {
            console.error('Error approving enrollment:', error);
            this.showError('Failed to approve enrollment. Please try again.');
        }
    }

    async rejectEnrollment(enrollmentId) {
        try {
            // Update status to 'Rejected' (uppercase R) to match the display condition
            await firebaseAPI.updateEnrollment(enrollmentId, { status: 'Rejected' }); 
            this.navigateToPage('enrollment');
        } catch (error) {
            console.error('Error rejecting enrollment:', error);
            this.showError('Failed to reject enrollment. Please try again.');
        }
    }

    async verifyTransaction(transactionId) {
        try {
            const currentUser = window.auth.currentUser;
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const adminName = users[currentUser.uid].name;

            await firebaseAPI.updateTransaction(transactionId, {
                status: 'verified',
                verifiedAt: new Date().toISOString(),
                verifiedBy: adminName
            });
            this.navigateToPage('transactions');
        } catch (error) {
            console.error('Error verifying transaction:', error);
            this.showError('Failed to verify transaction. Please try again.');
        }
    }

    async rejectTransaction(transactionId) {
        try {
            await firebaseAPI.updateTransaction(transactionId, {
                status: 'rejected',
                rejectionReason: 'Rejected by admin'
            });
            this.navigateToPage('transactions');
        } catch (error) {
            console.error('Error rejecting transaction:', error);
            this.showError('Failed to reject transaction. Please try again.');
        }
    }

    filterSubmissions() {
        const courseId = document.getElementById('course-filter').value;
        let moduleId = document.getElementById('module-filter').value; // Use let as we might update it
        const guideId = document.getElementById('guide-filter').value;

        console.log('Filtering Submissions - Selected Course ID:', courseId); // Debug log

        const courses = JSON.parse(localStorage.getItem('courses') || '{}');
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const submissions = JSON.parse(localStorage.getItem('submissions') || '{}');

        // Create mappings from ID to Title/Name
        const courseIdToTitle = Object.entries(courses).reduce((map, [id, course]) => { map[id] = course.title; return map; }, {});
        const userIdToName = Object.entries(users).reduce((map, [id, user]) => { map[id] = user.name; return map; }, {});
        const courseIdToModuleIdToTitle = Object.entries(courses).reduce((courseMap, [courseId, course]) => {
            courseMap[courseId] = Object.entries(course.modules || {}).reduce((moduleMap, [moduleId, module]) => {
                moduleMap[moduleId] = module.title;
                return moduleMap;
            }, {});
            return courseMap;
        }, {});

        // Update module filter options based on selected course
        const moduleFilter = document.getElementById('module-filter');
        const currentModuleValue = moduleFilter.value;
        moduleFilter.innerHTML = `
            <option value="">Select Module</option>
            ${courseId && courses[courseId] && courses[courseId].moduleOrder ? courses[courseId].moduleOrder.map(modId => {
                const module = courses[courseId].modules ? courses[courseId].modules[modId] : null;
                return module ? `<option value="${modId}">${module.title}</option>` : '';
            }).join('') : ''}
        `;
         // Restore the previously selected module value if it still exists in the new options
         if (currentModuleValue && moduleFilter.querySelector(`option[value="${currentModuleValue}"]`)) {
            moduleFilter.value = currentModuleValue;
            // If we successfully restored a module, use its ID for filtering, otherwise reset moduleId
            moduleId = currentModuleValue; // Use the restored ID for filtering
         } else {
             moduleId = ''; // Reset moduleId if no valid module is selected
         }

        // Update guide filter options
        const guideFilter = document.getElementById('guide-filter');
        const currentGuideValue = guideFilter.value;
        const guides = Object.entries(users)
            .filter(([, user]) => user.role === 'Park Guide')
            .map(([id, user]) => ({
                id,
                name: user.name
            }));

        guideFilter.innerHTML = `
            <option value="">Select Guide</option>
            ${guides.map(guide => `
                <option value="${guide.id}">${guide.name}</option>
            `).join('')}
        `;
        // Restore the previously selected guide value if it still exists in the new options
        if (currentGuideValue && guideFilter.querySelector(`option[value="${currentGuideValue}"]`)) {
            guideFilter.value = currentGuideValue;
        }

        console.log('Filtering Submissions - Course Data:', courses[courseId]); // Debug log (moved after getting courses)

        // Filter and update submissions table
        const filteredSubmissions = Object.entries(submissions)
            .filter(([id, submission]) => {
                // Get selected titles/names from IDs
                const selectedCourseTitle = courseId ? courseIdToTitle[courseId] : null;
                const selectedModuleTitle = (courseId && moduleId) ? courseIdToModuleIdToTitle[courseId]?.[moduleId] : null;
                const selectedGuideName = guideId ? userIdToName[guideId] : null;

                // Check for matches based on titles/names
                const courseMatch = !courseId || (submission.courseTitle === selectedCourseTitle);
                const moduleMatch = !moduleId || (submission.moduleTitle === selectedModuleTitle);
                const guideMatch = !guideId || (submission.userName === selectedGuideName);

                // Debugging submission filter criteria
                // console.log('Checking submission:', submission.testTitle, '- Course Match:', courseMatch, '- Module Match:', moduleMatch, '- Guide Match:', guideMatch);

                return courseMatch && moduleMatch && guideMatch;
            })
            .map(([id, submission]) => ({
                // Map submission data for table display (ensure robustness)
                id,
                testTitle: submission.testTitle || '-',
                questionType: (() => {
                    const tests = JSON.parse(localStorage.getItem('tests') || '{}');
                    // Find the test by title - assumes unique test titles
                    const test = Object.values(tests).find(t => t.title === submission.testTitle);
                    // Assuming each test object has a 'questions' object and we need the type of the first question
                    return test && test.questions && Object.values(test.questions).length > 0 
                        ? Object.values(test.questions)[0].type 
                        : '-';
                })(),
                answer: submission.answers && submission.answers[0] ? submission.answers[0].userAnswer : '-',
                isCorrect: submission.answers && submission.answers[0] ? (submission.answers[0].isCorrect ? 'Yes' : 'No') : '-',
                score: submission.score !== undefined && submission.totalPossibleScore !== undefined ? `${submission.score}/${submission.totalPossibleScore}` : '-',
                _id: id // Store ID separately for actions
            }));

        console.log('Filtered Submissions for Table:', filteredSubmissions); // Debug log

        const table = this.createTable(
            ['Test Title', 'Question Type', 'Answer', 'Is Correct', 'Score'],
            filteredSubmissions
        );

        const container = document.getElementById('content-container');
        const existingTable = container.querySelector('.data-table');
        if (existingTable) {
            existingTable.replaceWith(table);
        } else {
            container.appendChild(table);
        }
    }
}

// Export the UI instance
const ui = new UI();
