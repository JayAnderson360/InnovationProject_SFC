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
        const timeRangeButtons = document.querySelectorAll('.time-range-selector button');
        timeRangeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove active class from all buttons
                timeRangeButtons.forEach(btn => btn.classList.remove('active-range'));
                // Add active class to clicked button
                const clickedButton = e.target;
                clickedButton.classList.add('active-range');
                
                const range = clickedButton.dataset.range;
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

        // Hide all static .content-section elements first
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Get the container for dynamically loaded content
        const dynamicContentContainer = document.getElementById('content-container');

        // Show selected static section OR load dynamic content
        const staticSection = document.getElementById(page);
        if (staticSection && staticSection.classList.contains('content-section')) {
            staticSection.classList.add('active');
            // If we are activating a static section (like the main dashboard),
            // ensure the dynamic content container is cleared/hidden.
            if (dynamicContentContainer) {
                dynamicContentContainer.innerHTML = ''; // Clear content
                // Or, if it has its own visibility class: dynamicContentContainer.classList.remove('active');
            }
        } else if (dynamicContentContainer) { // If it's not a main static section, assume it's dynamic
            // Ensure static dashboard (if it exists and is not the target) is not active
            const dashboardSection = document.getElementById('dashboard');
            if (dashboardSection && page !== 'dashboard') {
                dashboardSection.classList.remove('active');
            }
            this.loadPageContent(page); // This already clears dynamicContentContainer
        } else {
            console.warn(`No static section or dynamic container found for page: ${page}`);
        }

        this.currentPage = page;
    }

    // Load dynamic page content
    async loadPageContent(page) {
        const container = document.getElementById('content-container');
        container.innerHTML = ''; // Clear previous content

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
            case 'licenses':
                await this.loadLicensesPage();
                break;
            default:
                console.warn(`Attempted to load unknown page: ${page}`);
                // Optionally display a "Page not found" message in the container
                // container.innerHTML = `<p>The page "${page}" could not be found.</p>`;
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
        let rangeText = 'All Time';
        let groupingIntervalMs = 0;
        let timeFormatOptions = { hour: '2-digit', minute: '2-digit' };
        let numberOfPoints = 0;

        switch (range) {
            case '1H': // Last Hour, data every 2 minutes
                startTime = new Date(now.getTime() - 3600000);
                rangeText = 'Last Hour';
                groupingIntervalMs = 2 * 60 * 1000; // 2 minutes
                numberOfPoints = 30;
                timeFormatOptions = { hour: '2-digit', minute: '2-digit' };
                break;
            case '1D': // Last Day, data every hour
                startTime = new Date(now.getTime() - 86400000);
                rangeText = 'Last Day';
                groupingIntervalMs = 60 * 60 * 1000; // 1 hour
                numberOfPoints = 24;
                timeFormatOptions = { hour: 'numeric', minute: 'numeric' }; // e.g., "14:00"
                break;
            case '1W': // Last Week, data every day
                startTime = new Date(now.getTime() - 7 * 86400000);
                rangeText = 'Last Week';
                groupingIntervalMs = 24 * 60 * 60 * 1000; // 1 day
                numberOfPoints = 7;
                timeFormatOptions = { weekday: 'short', day: 'numeric' }; // e.g., "Mon 15"
                break;
            case '1M': // Last Month, data every day
                startTime = new Date(now.getFullYear(), now.getMonth() -1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());                   
                // Calculate actual number of days in the last month for numberOfPoints
                const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() -1, 1);
                numberOfPoints = endOfLastMonth.getDate(); 
                // Ensure startTime is roughly 30-31 days ago from now, not just start of current hour on that day.
                startTime = new Date(now.getTime() - numberOfPoints * 24 * 60 * 60 * 1000);

                rangeText = 'Last Month';
                groupingIntervalMs = 24 * 60 * 60 * 1000; // 1 day
                timeFormatOptions = { month: 'short', day: 'numeric' }; // e.g., "Jan 15"
                break;
            case '1Y': // Last Year, data every month
                startTime = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
                rangeText = 'Last Year';
                // groupingIntervalMs for 1Y will be handled by month-by-month iteration
                numberOfPoints = 12;
                timeFormatOptions = { month: 'short', year: 'numeric' }; // e.g., "Jan 2023"
                break;
            default:
                startTime = new Date(0);
                rangeText = 'All Time';
                groupingIntervalMs = 24 * 60 * 60 * 1000; // Default to 1 day for safety
                numberOfPoints = 30; // Arbitrary default
                timeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
                break;
        }
        this.currentRange = range;

        function parseDateTimeString(str) {
            const [date, time] = str.split('_');
            const [year, month, day] = date.split('-');
            const [hour, minute, second] = time.split('-');
            return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
        }

        const allEntries = Object.entries(iotData)
            .map(([dateTimeString, data]) => ({
                time: parseDateTimeString(dateTimeString),
                temp: data.temperature,
                originalString: dateTimeString
            }))
            .filter(entry => entry.time >= startTime) // Initial filter to reduce processing
            .sort((a, b) => a.time - b.time);

        let aggregatedData = [];
        let currentSlotTime = startTime.getTime();

        if (range === '1Y') { // Special handling for yearly (month-by-month)
            for (let i = 0; i < numberOfPoints; i++) {
                const slotStartDate = new Date(startTime.getFullYear(), startTime.getMonth() + i, 1);
                let slotEndDate = new Date(startTime.getFullYear(), startTime.getMonth() + i + 1, 1);
                // Ensure slotEndDate does not exceed 'now' for the current month in progress
                if (slotStartDate.getFullYear() === now.getFullYear() && slotStartDate.getMonth() === now.getMonth()){
                    slotEndDate = new Date(Math.min(slotEndDate.getTime(), now.getTime()));
                }

                const pointsInSlot = allEntries.filter(entry => entry.time >= slotStartDate && entry.time < slotEndDate);
                if (pointsInSlot.length > 0) {
                    const avgTemp = pointsInSlot.reduce((sum, entry) => sum + entry.temp, 0) / pointsInSlot.length;
                    aggregatedData.push({ time: slotStartDate, temp: avgTemp });
                } else {
                    aggregatedData.push({ time: slotStartDate, temp: null }); // Gap in data
                }
            }
        } else if (groupingIntervalMs > 0) { // For 1H, 1D, 1W, 1M
            for (let i = 0; i < numberOfPoints; i++) {
                const slotStartTime = currentSlotTime + (i * groupingIntervalMs);
                const slotEndTime = slotStartTime + groupingIntervalMs;
                
                // Ensure the slot does not go beyond the current time
                if (slotStartTime > now.getTime()) break;

                const pointsInSlot = allEntries.filter(entry => entry.time.getTime() >= slotStartTime && entry.time.getTime() < slotEndTime);

                if (pointsInSlot.length > 0) {
                    const avgTemp = pointsInSlot.reduce((sum, entry) => sum + entry.temp, 0) / pointsInSlot.length;
                    aggregatedData.push({ time: new Date(slotStartTime), temp: avgTemp });
                } else {
                    aggregatedData.push({ time: new Date(slotStartTime), temp: null }); // Gap in data
                }
            }
        } else { // Fallback for "All Time" or unexpected cases
            aggregatedData = allEntries.map(entry => ({ time: entry.time, temp: entry.temp }));
        }

        this.iotChart.data.labels = aggregatedData.map(data => data.time.toLocaleTimeString([], timeFormatOptions));
        this.iotChart.data.datasets[0].data = aggregatedData.map(data => data.temp);
        this.iotChart.data.datasets[0].spanGaps = true; // Important for Chart.js to handle nulls correctly

        this.iotChart.options.plugins.title.text = `IoT Temperature - ${rangeText}`;
        this.iotChart.update();

        if (allEntries.length > 0) {
            const latestRawDataEntry = firebaseAPI.getIoTData()[allEntries[allEntries.length - 1].originalString];
            if (latestRawDataEntry) {
                this.updateSensorStatus(latestRawDataEntry);
            }
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

    // New function to display a configured form in the generic modal
    displayFormInModal(config) {
        const { title, fields, submitButtonText, onSubmitCallback, initialData = {} } = config;

        const modal = document.getElementById('admin-modal');
        const modalTitle = document.getElementById('admin-modal-title');
        const formFieldsContainer = document.getElementById('admin-modal-form-fields');
        const form = document.getElementById('admin-modal-form');
        const submitButton = document.getElementById('admin-modal-submit-btn');
        const errorMessageElement = document.getElementById('modal-error-message');
        const loadingMessageElement = document.getElementById('modal-loading-message');

        if (!modal || !modalTitle || !formFieldsContainer || !form || !submitButton || !errorMessageElement || !loadingMessageElement) {
            console.error('Admin modal elements not found! Ensure admin-dashboard.html is correct.');
            return;
        }

        // Reset previous state
        modalTitle.textContent = title;
        formFieldsContainer.innerHTML = ''; // Clear previous fields
        errorMessageElement.style.display = 'none';
        errorMessageElement.textContent = '';
        loadingMessageElement.style.display = 'none';
        submitButton.disabled = false;
        document.getElementById('admin-modal-cancel-btn').disabled = false;

        // Create and append form fields
        fields.forEach(field => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';

            const label = document.createElement('label');
            label.setAttribute('for', field.id);
            label.textContent = field.label;
            formGroup.appendChild(label);

            let inputElement;
            if (field.type === 'select') {
                inputElement = document.createElement('select');
                inputElement.className = 'form-control';
                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.label;
                    if (initialData[field.id] === opt.value) {
                        option.selected = true;
                    }
                    inputElement.appendChild(option);
                });
            } else if (field.type === 'textarea') {
                inputElement = document.createElement('textarea');
                inputElement.className = 'form-control';
            } else {
                inputElement = document.createElement('input');
                inputElement.type = field.type;
                inputElement.className = 'form-control';
            }

            inputElement.id = field.id;
            inputElement.name = field.id;
            if (field.required) {
                inputElement.required = true;
            }
            if (initialData[field.id] !== undefined) {
                inputElement.value = initialData[field.id];
            } else if (field.value !== undefined) { // Default value from field definition
                inputElement.value = field.value;
            }

            formGroup.appendChild(inputElement);
            formFieldsContainer.appendChild(formGroup);
        });

        submitButton.textContent = submitButtonText;

        // Remove old submit listener if any, and add the new one
        const newSubmitHandler = async (e) => {
            e.preventDefault();
            const formData = {};
            fields.forEach(field => {
                const element = form.elements[field.id];
                if (element) {
                    formData[field.id] = element.value;
                } else {
                     console.warn(`Form field with id '${field.id}' not found in form elements during submission.`);
                }
            });
            await onSubmitCallback(formData);
        };

        if (form._currentSubmitHandler) {
            form.removeEventListener('submit', form._currentSubmitHandler);
        }
        form.addEventListener('submit', newSubmitHandler);
        form._currentSubmitHandler = newSubmitHandler; // Store on the form element itself

        modal.style.display = 'block';
    }

    // Form Functions
    // createForm(fields, onSubmit) { // This function will be deprecated or removed
    // ... existing createForm code ...
    // }

    // Table Functions
    createTable(headers, data, actions) {
        const table = document.createElement('table');
        table.className = 'data-table';

        const thead = document.createElement('thead');
        const hasActions = data.some(row => {
            const rowSpecificActions = typeof actions === 'function' ? actions(row) : actions;
            return rowSpecificActions && Array.isArray(rowSpecificActions) && rowSpecificActions.length > 0;
        });

        thead.innerHTML = `
            <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
                ${hasActions ? '<th>Actions</th>' : ''} 
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        tbody.innerHTML = data.map(row => {
            const rowActions = typeof actions === 'function' ? actions(row) : actions;
            const actionsHtml = (rowActions && Array.isArray(rowActions)) ? rowActions.map(action => {
                // Construct the onClick call. If action.params are defined, use them.
                let onClickCall = `${action.onClick}('${row._id}')`; // Default call with row._id
                if (action.onClickParams && Array.isArray(action.onClickParams)) {
                    const paramsString = action.onClickParams.map(param => typeof param === 'string' ? `'${param}'` : param).join(', ');
                    onClickCall = `${action.onClick}('${row._id}', ${paramsString})`;
                }
            return `
                            <button class="btn btn-${action.type}" 
                        onclick="${onClickCall}">
                                ${action.label}
                            </button>
            `}).join('') : '';

            return `
            <tr>
                ${headers.map(header => `<td>${row[this.headerKey(header)] ?? '-'}</td>`).join('')}
                ${hasActions ? `<td>${actionsHtml}</td>` : ''}
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
        container.innerHTML = ''; // Clear previous users content before adding new

        const users = JSON.parse(localStorage.getItem('users') || '{}');

        const header = document.createElement('div');
        header.className = 'page-header';
        header.innerHTML = `
            <h1>Users</h1>
            <button class="btn btn-primary" onclick="ui.showAddUserModal()">Add User</button>
        `;
        container.appendChild(header);

        const table = this.createTable(
            ['Name', 'Email', 'Role', 'IC Number', 'Phone Number', 'Status'],
            Object.entries(users).map(([id, user]) => ({
                name: user.name,
                email: user.email,
                role: user.role,
                icNumber: user.icNumber || '-',
                phoneNumber: user.phoneNumber || '-',
                status: user.status || 'active',
                _id: id 
            })),
            (row) => {
                const actions = [
                {
                    label: 'Edit',
                    type: 'primary',
                    onClick: 'ui.showEditUserModal'
                }
                ];
                const isDisabled = row.status === 'disabled'; 
                const newStatus = isDisabled ? 'active' : 'disabled';
                actions.push({
                    label: isDisabled ? 'Enable' : 'Disable',
                    type: isDisabled ? 'success' : 'danger',
                    onClick: 'ui.showSetUserStatusConfirmationModal',
                    onClickParams: [newStatus]
                });
                return actions;
            }
        );
        container.appendChild(table);
    }

    async loadParksPage() {
        const container = document.getElementById('content-container');
        container.innerHTML = ''; // Clear previous parks content before adding new

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
            (row) => {
                const actions = [
                {
                    label: 'Edit',
                    type: 'primary',
                    onClick: 'ui.showEditParkModal'
                },
                {
                    label: 'Remove',
                    type: 'danger',
                    onClick: 'ui.showDeleteParkConfirmationModal'
                }
                ];
                return actions;
            }
        );
        container.appendChild(table);
    }

    async loadCoursesPage() {
        const container = document.getElementById('content-container');
        container.innerHTML = ''; // Clear previous content

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
        grid.className = 'courses-grid'; // Use a generic grid class, can be styled further if needed
        
        if (Object.keys(courses).length === 0) {
            grid.innerHTML = '<p>No courses found. Click "Add Course" to create one.</p>';
        } else {
            grid.innerHTML = Object.entries(courses).map(([id, course]) => `
                <div class="course-card"> 
                    <h3>${course.title}</h3>
                    <p class="course-description">${course.description ? (course.description.length > 100 ? course.description.substring(0, 97) + '...' : course.description) : 'No description available.'} </p>
                    <div class="course-meta">
                        <span class="course-type-badge ${course.courseType ? course.courseType.toLowerCase().replace(/\s+/g, '-') : 'default'}">${course.courseType || 'General'}</span>
                        <span class="status-badge ${course.published ? 'status-approved' : 'status-draft'}">
                            ${course.published ? 'Published' : 'Draft'}
                        </span>
                    </div>
                    <div class="course-actions" style="margin-top: 15px;">
                         <button class="btn btn-primary" onclick="window.location.href = '../course-edit-page.html?courseId=${id}'">Edit Course</button>
                    </div>
                </div>
            `).join('');
        }
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
             // Pass the actions array directly if it's determined per row, or the static array
            (row) => row.actions // This was correct, as actions are conditional per row
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
                    const test = Object.values(tests).find(t => t.title === submission.testTitle);
                    return test && test.questions && Object.values(test.questions).length > 0 
                        ? Object.values(test.questions)[0].type 
                        : '-';
                })(),
                answer: submission.answers && submission.answers[0] ? submission.answers[0].userAnswer : '-',
                isCorrect: submission.answers && submission.answers[0] ? (submission.answers[0].isCorrect ? 'Yes' : 'No') : '-',
                score: submission.score !== undefined && submission.totalPossibleScore !== undefined ? `${submission.score}/${submission.totalPossibleScore}` : '-',
                _id: id 
            }))
            // No actions for this table
        );
        container.appendChild(table);
    }

    async loadCertificationPage() {
        const container = document.getElementById('content-container');
        container.innerHTML = ''; // Clear previous content

        const certificates = JSON.parse(localStorage.getItem('certificates') || '{}');

        const header = document.createElement('div');
        header.className = 'page-header';
        header.innerHTML = '<h1>Certifications</h1>';
        container.appendChild(header);

        const table = this.createTable(
            ['Name', 'Certificate Name', 'Status', 'Issued At', 'Expires At'],
            Object.entries(certificates).map(([id, cert]) => ({
                name: cert.userName,
                certificateName: cert.certificateName,
                status: cert.status,
                issuedAt: firestoreTimestampToDate(cert.issuedAt)?.toLocaleDateString() || '-',
                expiresAt: firestoreTimestampToDate(cert.expiresAt)?.toLocaleDateString() || '-',
                _id: id
            })),
            (row) => {
                const actions = [];
                if (row.status && row.status.toLowerCase() === 'pending') {
                    actions.push({
                        label: 'Approve',
                        type: 'success',
                        onClick: 'ui.approveCertificate'
                    });
                    actions.push({
                        label: 'Reject',
                        type: 'danger',
                        onClick: 'ui.rejectCertificate'
                    });
                }
                return actions;
            }
        );
        container.appendChild(table);
    }

    async loadVisitorFeedbackPage() {
        const container = document.getElementById('content-container');
        container.innerHTML = ''; // Clear previous content

        const feedback = JSON.parse(localStorage.getItem('visitor_feedback') || '{}');

        const header = document.createElement('div');
        header.className = 'page-header';
        header.innerHTML = '<h1>Visitor Feedback</h1>';
        container.appendChild(header);

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
                    return dateObj?.toLocaleDateString() || '-';
                })(),
                _id: id
            }))
            // No actions for this table
        );
        container.appendChild(table);
    }

    async loadLicensesPage() {
        const container = document.getElementById('content-container');
        container.innerHTML = ''; // Clear previous content

        const licenses = JSON.parse(localStorage.getItem('licenses') || '{}');

        const header = document.createElement('div');
        header.className = 'page-header';
        header.innerHTML = '<h1>Licenses</h1>';
        container.appendChild(header);

        const table = this.createTable(
            ['Name', 'License Number', 'Status', 'Issued At', 'Expires At'],
            Object.entries(licenses).map(([id, license]) => ({
                name: license.userName,
                licenseNumber: license.licenseNumber,
                status: license.status,
                issuedAt: firestoreTimestampToDate(license.issuedAt)?.toLocaleDateString() || '-',
                expiresAt: firestoreTimestampToDate(license.expiresAt)?.toLocaleDateString() || '-',
                _id: id
            })),
            (row) => {
                const actions = [];
                if (row.status && row.status.toLowerCase() === 'pending') {
                    actions.push({
                        label: 'Approve',
                        type: 'success',
                        onClick: 'ui.approveLicense'
                    });
                    actions.push({
                        label: 'Reject',
                        type: 'danger',
                        onClick: 'ui.rejectLicense'
                    });
                }
                return actions;
            }
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
        const formFields = [
            { id: 'name', label: 'Park Name', type: 'text', required: true },
            { id: 'location', label: 'Location', type: 'text', required: true },
            {
                id: 'type',
                label: 'Type',
                type: 'select',
                required: true,
                options: [
                    { value: 'National Park', label: 'National Park' },
                    { value: 'Wildlife Sanctuary', label: 'Wildlife Sanctuary' },
                    { value: 'Nature Reserve', label: 'Nature Reserve' }
                ]
            },
            { id: 'landArea', label: 'Land Area (sq km)', type: 'number', required: true, value: '0' },
            { id: 'marineArea', label: 'Marine Area (sq km)', type: 'number', required: true, value: '0' },
            { id: 'dateOfGazettement', label: 'Date of Gazettement', type: 'date', required: true }
        ];

        const onSubmitCallback = async (formData) => {
            try {
                this.showLoading('Adding park...', 'admin-modal');
                
                const landAreaValue = parseFloat(formData.landArea);
                const marineAreaValue = parseFloat(formData.marineArea);

                const dataToAdd = {
                    name: formData.name,
                    location: formData.location,
                    type: formData.type,
                    landArea: isNaN(landAreaValue) ? 0 : landAreaValue,
                    marineArea: isNaN(marineAreaValue) ? 0 : marineAreaValue,
                    dateOfGazettement: formData.dateOfGazettement // Will be YYYY-MM-DD string
                };

                await firebaseAPI.addPark(dataToAdd);
                this.closeModal('admin-modal');
                this.showInfoModal('Success', 'Park added successfully!', true);
                // Assuming showInfoModal is modal and user clicks OK, then we load.
                // If showInfoModal is a toast, this can be called immediately.
                await this.loadParksPage(); 
            } catch (error) {
                console.error('Error adding park:', error);
                // Error is now shown within the admin-modal itself by showError
                this.showError(`Failed to add park: ${error.message || 'Please try again.'}`, 'admin-modal');
                // Do not close modal on error, so user can see the message and correct data if needed.
            }
        };

        this.displayFormInModal({
            title: 'Add New Park',
            fields: formFields,
            submitButtonText: 'Add Park',
            onSubmitCallback
        });
    }

    showEditParkModal(parkId) {
        const parks = JSON.parse(localStorage.getItem('parks') || '{}');
        const park = parks[parkId];

        if (!park) {
            this.showError('Park details not found. Please refresh and try again.', 'admin-modal'); // Show error in a general way
            return;
        }

        // Convert Firestore Timestamp to YYYY-MM-DD for date input
        let dateOfGazettementValue = '';
        if (park.dateOfGazettement && park.dateOfGazettement.seconds) {
            const date = new Date(park.dateOfGazettement.seconds * 1000);
            dateOfGazettementValue = date.toISOString().split('T')[0];
        } else if (typeof park.dateOfGazettement === 'string') { 
            // Check if it's already in YYYY-MM-DD format (e.g., from a previous failed edit attempt or direct input)
            if (/^\d{4}-\d{2}-\d{2}$/.test(park.dateOfGazettement)) {
                dateOfGazettementValue = park.dateOfGazettement;
            } else {
                 // If it's some other string format, attempt to parse or default
                const parsedDate = new Date(park.dateOfGazettement);
                if (!isNaN(parsedDate)) {
                    dateOfGazettementValue = parsedDate.toISOString().split('T')[0];
                } else {
                    console.warn('Could not parse dateOfGazettement string for edit:', park.dateOfGazettement);
                    // Keep it empty or set a sensible default if parsing fails, 
                    // rather than letting the form error out immediately.
                }
            }
        }

        const formFields = [
            { id: 'name', label: 'Park Name', type: 'text', required: true },
            { id: 'location', label: 'Location', type: 'text', required: true },
            {
                id: 'type',
                label: 'Type',
                type: 'select',
                required: true,
                options: [
                    { value: 'National Park', label: 'National Park' },
                    { value: 'Nature Reserve', label: 'Nature Reserve' },
                    { value: 'Wildlife Sanctuary', label: 'Wildlife Sanctuary' },
                    { value: 'Protected Landscape', label: 'Protected Landscape' }
                ]
            },
            { id: 'landArea', label: 'Land Area (sq km)', type: 'number', required: true },
            { id: 'marineArea', label: 'Marine Area (sq km)', type: 'number', required: true },
            { id: 'dateOfGazettement', label: 'Date of Gazettement', type: 'date', required: true }
        ];

        const initialData = {
            ...park,
            dateOfGazettement: dateOfGazettementValue // Ensure YYYY-MM-DD format for date input
        };
        
        const onSubmitCallback = async (formData) => {
            try {
                this.showLoading('Updating park...', 'admin-modal');
                
                const landAreaValue = parseFloat(formData.landArea);
                const marineAreaValue = parseFloat(formData.marineArea);

                const dataToUpdate = {
                    name: formData.name,
                    location: formData.location,
                    type: formData.type,
                    landArea: isNaN(landAreaValue) ? 0 : landAreaValue,
                    marineArea: isNaN(marineAreaValue) ? 0 : marineAreaValue,
                    dateOfGazettement: formData.dateOfGazettement // Will be YYYY-MM-DD string
                };

                await firebaseAPI.updatePark(parkId, dataToUpdate);
                this.closeModal('admin-modal');
                this.showInfoModal('Success', 'Park updated successfully!', true);
                await this.loadParksPage(); 
            } catch (error) {
                console.error('Error updating park:', error);
                this.showError(`Failed to update park: ${error.message || 'Please try again.'}`, 'admin-modal');
            }
        };

        this.displayFormInModal({
            title: 'Edit Park',
            fields: formFields,
            submitButtonText: 'Save Changes',
            onSubmitCallback,
            initialData
        });
    }

    // New helper function to create and show a modal with a specific ID
    createAndShowModal(modalId, contentHtml, maxWidth = '450px') {
        // Close if already exists to prevent duplicates
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal'; // Basic modal styling
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: ${maxWidth};">
                <span class="modal-close" onclick="ui.closeModal('${modalId}')">&times;</span>
                ${contentHtml}
            </div>
        `;

        document.body.appendChild(modal);

        // Clicking backdrop closes this specific modal
        modal.onclick = (event) => {
            if (event.target === modal) {
                this.closeModal(modalId);
            }
        };
        return modal; // Return the created modal element
    }

    showDeleteParkConfirmationModal(parkId) {
        const parks = JSON.parse(localStorage.getItem('parks') || '{}');
        const park = parks[parkId];
        const parkName = park ? park.name : 'this park';
        const confirmationModalId = `delete-confirm-modal-${parkId || Date.now()}`;

        const modalContentHtml = `
            <h2>Confirm Delete Park</h2>
            <p>Are you sure you want to delete <strong>${parkName}</strong> (ID: ${parkId})?</p>
            <p>This action cannot be undone.</p>
            <div class="modal-actions" style="margin-top: 20px; text-align: right;">
                <button class="btn btn-danger" id="confirm-delete-park-btn-${parkId}">Delete Park</button>
                <button class="btn btn-secondary" onclick="ui.closeModal('${confirmationModalId}')">Cancel</button>
            </div>
        `;
        
        const confirmationModalElement = this.createAndShowModal(confirmationModalId, modalContentHtml);

        const confirmBtn = confirmationModalElement.querySelector(`#confirm-delete-park-btn-${parkId}`);
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                try {
                    // No separate loading message for this simple confirmation, straight to action.
                    await firebaseAPI.deletePark(parkId);
                    this.closeModal(confirmationModalId); // Close this specific confirmation modal
                    this.showInfoModal('Success', 'Park deleted successfully!', true); // This shows a separate info modal
                    await this.loadParksPage(); 
                } catch (error) {
                    console.error('Error deleting park:', error);
                    this.closeModal(confirmationModalId); // Make sure to close on error too
                    this.showInfoModal('Error', `Failed to delete park: ${error.message || 'Please try again.'}`, false);
                }
            };
        }
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
            this.showLoading('Approving enrollment...');
            await firebaseAPI.updateEnrollment(enrollmentId, { status: 'active' });
            this.closeModal();
            this.showSuccess('Enrollment approved successfully.');
            await this.loadEnrollmentPage(); // Reload the table
            this.updateDashboardStats(); // Refresh dashboard stats
        } catch (error) {
            console.error('Error approving enrollment:', error);
            this.closeModal();
            this.showError('Failed to approve enrollment. Please try again.');
        }
    }

    async rejectEnrollment(enrollmentId) {
        try {
            // Update status to 'Rejected' (uppercase R) to match the display condition
            await firebaseAPI.updateEnrollment(enrollmentId, { status: 'Rejected' }); 
            this.showSuccess('Enrollment rejected successfully.');
            await this.loadEnrollmentPage(); // Reload the table
            this.updateDashboardStats(); // Refresh dashboard stats
        } catch (error) {
            console.error('Error rejecting enrollment:', error);
            this.closeModal();
            this.showError('Failed to reject enrollment. Please try again.');
        }
    }

    // Certificate Action Handlers
    async approveCertificate(certificateId) {
        try {
            this.showLoading('Approving certificate...');
            await firebaseAPI.updateCertificateStatus(certificateId, 'active');
            this.closeModal(); // Close any open generic modal, or specify ID if one is used for loading
            this.showSuccess('Certificate approved successfully.');
            await this.loadCertificationPage(); // Refresh the certifications table
            this.updateDashboardStats(); // Refresh dashboard stats
        } catch (error) {
            console.error('Error approving certificate:', error);
            this.closeModal();
            this.showError('Failed to approve certificate. Please try again.');
        }
    }

    async rejectCertificate(certificateId) {
        try {
            this.showLoading('Rejecting certificate...');
            await firebaseAPI.updateCertificateStatus(certificateId, 'rejected');
            this.closeModal();
            this.showSuccess('Certificate rejected successfully.');
            await this.loadCertificationPage(); // Refresh the certifications table
            this.updateDashboardStats(); // Refresh dashboard stats
        } catch (error) {
            console.error('Error rejecting certificate:', error);
            this.closeModal();
            this.showError('Failed to reject certificate. Please try again.');
        }
    }

    // License Action Handlers
    async approveLicense(licenseId) {
        try {
            this.showLoading('Approving license...');
            await firebaseAPI.updateLicenseStatus(licenseId, 'active');
            this.closeModal();
            this.showSuccess('License approved successfully.');
            await this.loadLicensesPage(); // Refresh the licenses table
            this.updateDashboardStats(); // Refresh dashboard stats
        } catch (error) {
            console.error('Error approving license:', error);
            this.closeModal();
            this.showError('Failed to approve license. Please try again.');
        }
    }

    async rejectLicense(licenseId) {
        try {
            this.showLoading('Rejecting license...');
            await firebaseAPI.updateLicenseStatus(licenseId, 'rejected');
            this.closeModal();
            this.showSuccess('License rejected successfully.');
            await this.loadLicensesPage(); // Refresh the licenses table
            this.updateDashboardStats(); // Refresh dashboard stats
        } catch (error) {
            console.error('Error rejecting license:', error);
            this.closeModal();
            this.showError('Failed to reject license. Please try again.');
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
            filteredSubmissions,
            (row) => row.actions
        );

        const container = document.getElementById('content-container');
        const existingTable = container.querySelector('.data-table');
        if (existingTable) {
            existingTable.replaceWith(table);
        } else {
            container.appendChild(table);
        }
    }

    showSetUserStatusConfirmationModal(userId, newStatus) {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const user = users[userId];
        const userName = user ? user.name : 'This user';
        const actionText = newStatus === 'disabled' ? 'disable' : 'enable';
        const capitalizedActionText = actionText.charAt(0).toUpperCase() + actionText.slice(1);

        const modalContent = `
            <h2>Confirm User Status Change</h2>
            <p>Are you sure you want to ${actionText} <strong>${userName}</strong> (ID: ${userId})?</p>
            <p>If disabled, the user will not be able to log in or access the system.</p>
            <div class="modal-actions">
                <button class="btn btn-${newStatus === 'disabled' ? 'danger' : 'success'}" id="confirm-set-status-btn">${capitalizedActionText} User</button>
                <button class="btn btn-secondary" onclick="ui.closeModal()">Cancel</button>
            </div>
        `;

        this.showModal(modalContent);

        const confirmBtn = document.getElementById('confirm-set-status-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                try {
                    this.showLoading(`${capitalizedActionText}ing user...`);
                    await firebaseAPI.setUserStatus(userId, newStatus);
                    this.closeModal();
                    this.showSuccess(`User ${actionText}d successfully.`);
                    await this.loadUsersPage(); // Reload the users table
                } catch (error) {
                    console.error(`Error ${actionText}ing user:`, error);
                    this.closeModal();
                    this.showError(`Failed to ${actionText} user: ${error.message || 'Please try again.'}`);
                }
            });
        }
    }

    closeModal(modalId = 'admin-modal') {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            
            // Clear form fields if it's the admin-modal with a form
            if (modalId === 'admin-modal') {
                const formFieldsContainer = modal.querySelector('#admin-modal-form-fields');
                if (formFieldsContainer) {
                    formFieldsContainer.innerHTML = '';
                }
                const form = modal.querySelector('#admin-modal-form');
                if (form) {
                    if (form._currentSubmitHandler) { // Check if handler exists on the form
                       form.removeEventListener('submit', form._currentSubmitHandler);
                       delete form._currentSubmitHandler; // Clean up the stored handler property
                    }
                    // form.reset(); // Reset native form elements if any were not dynamically cleared
                }
            }

            // Reset and hide loading/error messages
            const loadingMsg = modal.querySelector('#modal-loading-message');
            if (loadingMsg) {
                loadingMsg.textContent = 'Loading...';
                loadingMsg.style.display = 'none';
            }
            const errorMsg = modal.querySelector('#modal-error-message');
            if (errorMsg) {
                errorMsg.textContent = '';
                errorMsg.style.display = 'none';
            }

            // Re-enable buttons if they were part of this modal
            const submitButton = modal.querySelector('#admin-modal-submit-btn');
            const cancelButton = modal.querySelector('#admin-modal-cancel-btn');
            if (submitButton) submitButton.disabled = false;
            if (cancelButton) cancelButton.disabled = false;
        }
    }

    showError(message, modalId = 'admin-modal') {
        const modal = document.getElementById(modalId);
        if (modal) {
            const errorElement = modal.querySelector('#modal-error-message');
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }
            const loadingMsg = modal.querySelector('#modal-loading-message');
            if (loadingMsg) {
                loadingMsg.style.display = 'none';
            }
            // Ensure buttons are enabled
            const submitButton = modal.querySelector('#admin-modal-submit-btn');
            const cancelButton = modal.querySelector('#admin-modal-cancel-btn');
            if (submitButton) submitButton.disabled = false;
            if (cancelButton) cancelButton.disabled = false;
        } else {
            // Fallback for modals not using the fixed structure, or if modalId is different
            alert(`Error: ${message}`);
        }
    }

    showSuccess(message) {
        // Simple alert, or a styled notification
        // alert(message); 
        this.showInfoModal('Success', message, true);
    }
    
    showLoading(message, modalId = 'admin-modal') {
        const modal = document.getElementById(modalId);
        if (modal) {
            const loadingMsg = modal.querySelector('#modal-loading-message');
            if (loadingMsg) {
                loadingMsg.textContent = message;
                loadingMsg.style.display = 'block';
            }
            const errorMsg = modal.querySelector('#modal-error-message');
            if (errorMsg) {
                errorMsg.style.display = 'none';
            }
            // Disable buttons
            const submitButton = modal.querySelector('#admin-modal-submit-btn');
            const cancelButton = modal.querySelector('#admin-modal-cancel-btn');
            if (submitButton) submitButton.disabled = true;
            if (cancelButton) cancelButton.disabled = true;
        } else {
             console.log(message); // Placeholder for non-standard modals
        }
    }

    showInfoModal(title, message, isSuccess = true) {
        const modalId = 'info-modal';
        this.closeModal(modalId); // Close if already open

        const modalContent = `
            <div class="modal-content" style="max-width: 400px;">
                <span class="modal-close" onclick="ui.closeModal('${modalId}')">&times;</span>
                <h2 style="color: ${isSuccess ? 'var(--success-color)' : 'var(--danger-color)'};">${title}</h2>
                <p>${message}</p>
                <div class="modal-actions" style="margin-top: 20px; text-align: right;">
                    <button class="btn btn-primary" onclick="ui.closeModal('${modalId}')">OK</button>
                </div>
            </div>
        `;
        
        // Use a modified showModal or create a new one for info
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal'; // Use existing modal class for backdrop and centering
        modal.style.display = 'block';
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);

        // Ensure clicking backdrop also closes this specific modal
        modal.onclick = (event) => {
            if (event.target === modal) {
                this.closeModal(modalId);
            }
        };
    }
}

// Export the UI instance
const ui = new UI();
