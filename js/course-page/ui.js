// js/course-page/ui.js
// Handles DOM manipulation and UI updates for the course page.

const courseTitleElement = document.getElementById('cp-course-title');
const courseDescriptionElement = document.getElementById('cp-course-description');
const modulesListElement = document.getElementById('cp-modules-list');

// Admin buttons (will be shown/hidden based on role)
const adminEditCourseTitleBtn = document.getElementById('cp-admin-edit-course-title-btn');
const adminEditDescriptionBtn = document.getElementById('cp-admin-edit-description-btn');
const adminAddModuleBtn = document.getElementById('cp-admin-add-module-btn');

/**
 * Renders the main course details (title, description).
 * @param {Object} courseData The course data object.
 */
function renderCourseDetails(courseData) {
    if (!courseData) return;
    if (courseTitleElement) courseTitleElement.textContent = courseData.title || 'Course Title Not Found';
    if (courseDescriptionElement) courseDescriptionElement.textContent = courseData.description || 'No description available.';
    // Potentially update the 'Begin Course' button or other general elements here
}

/**
 * Renders the list of course modules as an accordion.
 * @param {Array<Object>} orderedModulesArray An array of module objects, already ordered.
 * @param {string} userRole The role of the current user ('Admin', 'Park Guide', etc.).
 * @param {string} courseTitle The title of the current course.
 * @param {string} userName The name of the current user.
 */
function renderCourseModules(orderedModulesArray, userRole, courseTitle, userName) {
    if (!modulesListElement) return;
    modulesListElement.innerHTML = ''; // Clear existing modules

    if (!orderedModulesArray || orderedModulesArray.length === 0) {
        modulesListElement.innerHTML = '<p>No modules available for this course yet.</p>';
        return;
    }

    orderedModulesArray.forEach(module => { // Iterate over the array of module objects
        if (!module || !module.id) { // Check if module object and module.id exist
            console.warn(`Encountered a module object without an ID or the object is undefined.`);
            return; // Skip this module if data is malformed
        }
        const moduleId = module.id; // Get moduleId from the module object

        const moduleDiv = document.createElement('div');
        moduleDiv.className = 'cp-module';
        moduleDiv.dataset.moduleId = moduleId; 

        // Module Header (clickable for accordion)
        let moduleHtml = `
            <div class="cp-module-header">
                <h3>${module.title || 'Untitled Module'}</h3>
                <div class="cp-module-header-actions">
        `;

        // Only add status icon if the module has tests
        if (module.testIds && module.testIds.length > 0) {
            moduleHtml += `                    <i id="module-status-icon-${moduleId}" class="far fa-square cp-module-status-icon" title="Pending Test"></i>`;
        } else {
            // Optional: could add a different placeholder or leave it empty
            // moduleHtml += `                    <span class="cp-module-status-placeholder"></span>`; 
        }

        // Admin buttons for the module
        if (userRole === 'Admin') {
            moduleHtml += `
                <button class="cp-btn cp-btn-admin cp-btn-edit-module" data-module-id="${moduleId}" title="Edit Module"><i class="fas fa-edit"></i></button>
                <button class="cp-btn cp-btn-admin cp-btn-delete-module" data-module-id="${moduleId}" title="Delete Module"><i class="fas fa-trash"></i></button>
            `;
        }
        moduleHtml += `
                    <i class="fas fa-chevron-down cp-module-toggle-icon"></i>
                </div>
            </div>
        `;

        // Module Content (collapsible)
        moduleHtml += `<div class="cp-module-content" style="display: none;">`; // Initially hidden

        // Module content/description from Firestore
        if (module.content) {
            moduleHtml += `<p class="cp-module-main-content">${module.content}</p>`;
        } else {
            moduleHtml += `<p class="cp-module-main-content">No detailed content for this module.</p>`;
        }
        
        // Module Resources
        moduleHtml += `<div class="cp-module-resources">`;
        let hasResources = false;
        if (module.documentLink) {
            moduleHtml += `<a href="${module.documentLink}" target="_blank" class="cp-resource-link pdf"><i class="fas fa-file-pdf"></i> View Document</a>`;
            hasResources = true;
        }
        if (module.videoLink) {
            moduleHtml += `<a href="${module.videoLink}" target="_blank" class="cp-resource-link video"><i class="fas fa-video"></i> Watch Video</a>`;
            hasResources = true;
        }
        // if (!hasResources) {
        //     moduleHtml += `<p>No resources for this module.</p>`; // Optional: message if no resources
        // }
        moduleHtml += `</div>`; // End cp-module-resources

        // Test Button
        const hasTests = module.testIds && module.testIds.length > 0;
        if (hasTests) {
            // Assuming we use the first testId for the "Take Test" button
            const testId = module.testIds[0]; 
            moduleHtml += `<button class="cp-btn cp-btn-take-test" data-module-id="${moduleId}" data-module-title="${module.title || 'Untitled Module'}" data-testid="${testId}"><i class="fas fa-tasks"></i> Take Test</button>`;
        } else {
            moduleHtml += `<p class="cp-no-test-message">No test available for this module.</p>`;
        }
        
        moduleHtml += `</div>`; // End cp-module-content

        moduleDiv.innerHTML = moduleHtml;
        modulesListElement.appendChild(moduleDiv);
    });

    attachModuleAccordionListeners(); // For expanding/collapsing modules
    if (userRole === 'Admin') {
        attachAdminModuleButtonListeners();
    }
    // Pass courseTitle to the listener attachment function
    const courseDataForListeners = JSON.parse(localStorage.getItem('currentCourseData')); 
    const actualCourseTitle = courseDataForListeners ? courseDataForListeners.title : document.getElementById('cp-course-title').textContent;
    attachTakeTestButtonListeners(actualCourseTitle); 

    // Update module status icons based on test completions
    if (userName && courseTitle) { // Only if we have the necessary info
        updateModuleTestStatusIcons(orderedModulesArray, courseTitle, userName);
    }
}

/**
 * Attaches event listeners to module headers for accordion functionality.
 */
function attachModuleAccordionListeners() {
    document.querySelectorAll('.cp-module-header').forEach(header => {
        header.addEventListener('click', (e) => {
            // Prevent toggling if an admin button within the header was clicked
            if (e.target.closest('.cp-btn-admin')) {
                return;
            }
            const content = header.nextElementSibling;
            const icon = header.querySelector('.cp-module-toggle-icon');
            if (content && content.classList.contains('cp-module-content')) {
                if (content.style.display === 'none' || content.style.display === '') {
                    content.style.display = 'block';
                    if (icon) icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
                } else {
                    content.style.display = 'none';
                    if (icon) icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
                }
            }
        });
    });
}

/**
 * Shows or hides admin-specific UI elements based on user role.
 * @param {string} userRole The role of the current user.
 */
function toggleAdminControls(userRole) {
    const isAdmin = userRole === 'Admin';
    const displayStyle = isAdmin ? 'inline-block' : 'none'; // Or 'block' depending on button type

    if (adminEditCourseTitleBtn) adminEditCourseTitleBtn.style.display = displayStyle;
    if (adminEditDescriptionBtn) adminEditDescriptionBtn.style.display = displayStyle;
    if (adminAddModuleBtn) adminAddModuleBtn.style.display = isAdmin ? 'block' : 'none'; // Add module might be a block button

    // Module-specific admin buttons are handled during module rendering (renderCourseModules)
}

function attachAdminModuleButtonListeners() {
    document.querySelectorAll('.cp-btn-edit-module').forEach(button => {
        button.addEventListener('click', (e) => {
            const moduleId = e.currentTarget.dataset.moduleId; // Use currentTarget for consistency
            console.log(`Admin wants to EDIT module: ${moduleId}`);
            alert(`Admin: Edit module ${moduleId} - To be implemented`);
        });
    });
    document.querySelectorAll('.cp-btn-delete-module').forEach(button => {
        button.addEventListener('click', (e) => {
            const moduleId = e.currentTarget.dataset.moduleId;
            console.log(`Admin wants to DELETE module: ${moduleId}`);
            alert(`Admin: Delete module ${moduleId} - To be implemented`);
        });
    });
}

function attachTakeTestButtonListeners(courseTitle) { // Added courseTitle parameter
    document.querySelectorAll('.cp-btn-take-test').forEach(button => {
        button.addEventListener('click', async (e) => { // Make async to await API calls
            const moduleId = e.currentTarget.dataset.moduleId;
            const moduleTitle = e.currentTarget.dataset.moduleTitle;
            const testId = e.currentTarget.dataset.testid;
            const userName = localStorage.getItem('userName'); // Assuming userName is stored

            if (!userName) {
                console.error("User name not found in localStorage. Cannot proceed with test.");
                alert("Error: User information not found. Please log in again.");
                return;
            }

            if (!courseTitle || !moduleTitle || !testId) {
                console.error("Missing data for test:", { courseTitle, moduleTitle, testId });
                alert("Error: Could not retrieve necessary information to start the test.");
                return;
            }

            console.log(`User wants to TAKE TEST for module: ${moduleId} (Test ID: ${testId})`);
            console.log(`Details: Course: ${courseTitle}, Module: ${moduleTitle}, User: ${userName}`);

            // 1. Fetch Test Details (to get the official testTitle)
            const testData = await getTestDetailsById(testId); // api.js function (to be created)
            if (!testData) {
                alert("Error: Could not load test details. The test may not be available.");
                return;
            }
            const officialTestTitle = testData.title;

            // 2. Check for existing submission
            const existingSubmission = await getUserTestSubmission(userName, courseTitle, moduleTitle, officialTestTitle); // api.js function (to be created)

            if (existingSubmission) {
                console.log("Existing submission found:", existingSubmission);
                displayTestSubmissionResult(existingSubmission, testData); // ui.js function (to be created)
            } else {
                console.log("No existing submission. Displaying test questions.");
                displayTestQuestions(testData, courseTitle, moduleTitle, userName, testId); // ui.js function (to be created)
            }
        });
    });
}

// Test Modal Elements
const testModal = document.getElementById('cp-test-modal');
const testModalTitle = document.getElementById('cp-test-modal-title');
const testModalBody = document.getElementById('cp-test-modal-body');
const testModalSubmitBtn = document.getElementById('cp-test-modal-submit-btn');
const testModalCloseFooterBtn = document.getElementById('cp-test-modal-close-footer-btn');
const testModalCloseXBtn = testModal ? testModal.querySelector('.cp-modal-close-btn') : null;

/**
 * Opens the test modal with specified content.
 * @param {string} title The title for the modal.
 * @param {string | HTMLElement} bodyContent HTML string or an HTMLElement to append to the modal body.
 * @param {boolean} showSubmitButton Whether to show the main submit button in the footer.
 */
function openTestModal(title, bodyContent, showSubmitButton = false) {
    if (!testModal || !testModalTitle || !testModalBody || !testModalSubmitBtn) {
        console.error("Test modal elements not found in the DOM.");
        return;
    }
    testModalTitle.textContent = title;
    if (typeof bodyContent === 'string') {
        testModalBody.innerHTML = bodyContent;
    } else if (bodyContent instanceof HTMLElement) {
        testModalBody.innerHTML = ''; // Clear previous content
        testModalBody.appendChild(bodyContent);
    }

    testModalSubmitBtn.style.display = showSubmitButton ? 'inline-block' : 'none';
    testModal.style.display = 'block';
}

/**
 * Closes the test modal.
 */
function closeTestModal() {
    if (testModal) {
        testModal.style.display = 'none';
        testModalBody.innerHTML = ''; // Clear body for next use
        testModalTitle.textContent = 'Test Title'; // Reset title
        testModalSubmitBtn.style.display = 'none'; // Hide submit button
    }
}

// Attach listeners for closing the modal
if (testModalCloseXBtn) {
    testModalCloseXBtn.onclick = closeTestModal;
}
if (testModalCloseFooterBtn) {
    testModalCloseFooterBtn.onclick = closeTestModal;
}
// Optional: Close modal if user clicks outside of it
window.addEventListener('click', (event) => {
    if (event.target === testModal) {
        closeTestModal();
    }
});

/**
 * Displays the results of a previously submitted test.
 * @param {Object} submissionData The user's submission data from Firestore.
 * @param {Object} testData The original test data (including questions for review).
 */
function displayTestSubmissionResult(submissionData, testData) {
    console.log("UI: Displaying test submission result", submissionData, testData);
    
    let resultHtml = `<div class="cp-test-results">`;
    resultHtml += `<h3>${testData.title || 'Test Results'}</h3>`;
    resultHtml += `<p><strong>Status:</strong> ${submissionData.status || 'N/A'}</p>`;
    resultHtml += `<p><strong>Score:</strong> ${submissionData.score} / ${submissionData.totalPossibleScore}</p>`;
    resultHtml += `<p><strong>Submitted:</strong> ${submissionData.submittedAt ? new Date(submissionData.submittedAt).toLocaleString() : 'N/A'}</p>`;
    
    resultHtml += `<h4>Your Answers:</h4>`;
    if (submissionData.answers && submissionData.answers.length > 0 && testData.questions) {
        resultHtml += `<ul class="cp-test-answers-review">`;
        submissionData.answers.forEach((answer, index) => {
            const question = testData.questions[answer.questionId];
            if (question) {
                resultHtml += `<li>`;
                resultHtml += `<p><strong>Q${index + 1}: ${question.text}</strong></p>`;
                resultHtml += `<p>Your answer: ${answer.userAnswer}`;
                if (answer.isCorrect) {
                    resultHtml += ` <span class="cp-correct-answer">(Correct)</span></p>`;
                } else {
                    resultHtml += ` <span class="cp-incorrect-answer">(Incorrect)</span></p>`;
                    resultHtml += `<p>Correct answer: ${question.correctAnswer}</p>`;
                }
                // Display options if multiple choice for context
                if (question.type === 'multiple_choice' && question.options) {
                    resultHtml += `<div class="cp-question-options-review">Options:<ul>`;
                    question.options.forEach(opt => {
                        resultHtml += `<li>${opt}</li>`;
                    });
                    resultHtml += `</ul></div>`;
                }
                resultHtml += `</li>`;
            } else {
                 resultHtml += `<li><p><strong>Q${index + 1}:</strong> Question details not found.</p></li>`;
            }
        });
        resultHtml += `</ul>`;
    } else {
        resultHtml += `<p>No detailed answer breakdown available.</p>`;
    }
    resultHtml += `</div>`;

    openTestModal(`Results: ${testData.title}`, resultHtml, false);
}

/**
 * Displays the test questions for the user to take.
 * @param {Object} testData The test data object from Firestore (contains questions, title, etc.).
 * @param {string} courseTitle Current course title.
 * @param {string} moduleTitle Current module title.
 * @param {string} userName Current user's name.
 * @param {string} testId Current test ID (can be used if needed, testData.id should also be available).
 */
function displayTestQuestions(testData, courseTitle, moduleTitle, userName, testId) {
    console.log("UI: Displaying test questions for:", testData.title);

    if (!testData || !testData.questions || Object.keys(testData.questions).length === 0) {
        openTestModal("Test Error", "<p>No questions found for this test or test data is invalid.</p>");
        return;
    }

    const formContainer = document.createElement('form');
    formContainer.id = 'cp-test-form';
    formContainer.className = 'cp-test-form-container';

    let questionIndex = 0;
    for (const questionId in testData.questions) {
        if (Object.hasOwnProperty.call(testData.questions, questionId)) {
            const question = testData.questions[questionId];
            questionIndex++;

            const questionDiv = document.createElement('div');
            questionDiv.className = 'cp-test-question';
            questionDiv.dataset.questionId = questionId;
            questionDiv.dataset.questionType = question.type;
            questionDiv.dataset.correctAnswer = question.correctAnswer; // Store correct answer for evaluation

            const questionText = document.createElement('p');
            questionText.innerHTML = `<strong>Q${questionIndex}:</strong> ${question.text}`;
            questionDiv.appendChild(questionText);

            if (question.type === 'multiple_choice' && question.options) {
                const optionsDiv = document.createElement('div');
                optionsDiv.className = 'cp-test-options';
                question.options.forEach((option, optIndex) => {
                    const label = document.createElement('label');
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `question_${questionId}`;
                    radio.value = option; // Use the actual option text as value
                    radio.id = `q_${questionId}_opt_${optIndex}`;
                    
                    label.appendChild(radio);
                    label.appendChild(document.createTextNode(` ${option}`));
                    optionsDiv.appendChild(label);
                    optionsDiv.appendChild(document.createElement('br'));
                });
                questionDiv.appendChild(optionsDiv);
            } else if (question.type === 'true_false') {
                // Similar structure for true/false if needed
                const options = ['True', 'False'];
                const optionsDiv = document.createElement('div');
                optionsDiv.className = 'cp-test-options';
                options.forEach((option, optIndex) => {
                    const label = document.createElement('label');
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `question_${questionId}`;
                    radio.value = option;
                    radio.id = `q_${questionId}_opt_${optIndex}`;
                    label.appendChild(radio);
                    label.appendChild(document.createTextNode(` ${option}`));
                    optionsDiv.appendChild(label);
                    optionsDiv.appendChild(document.createElement('br'));
                });
                questionDiv.appendChild(optionsDiv);
            } else {
                // Placeholder for other question types (e.g., short answer)
                const para = document.createElement('p');
                para.textContent = 'Question type not yet supported for display.';
                questionDiv.appendChild(para);
            }
            formContainer.appendChild(questionDiv);
        }
    }

    openTestModal(`Test: ${testData.title}`, formContainer, true); // Show submit button

    // Get the submit button currently in the DOM to replace it and ensure listeners are fresh
    const buttonInDOM = document.getElementById('cp-test-modal-submit-btn');
    let effectiveSubmitButton;

    if (buttonInDOM && buttonInDOM.parentNode) {
        const newClonedButton = buttonInDOM.cloneNode(true); // Clone the live button
        buttonInDOM.parentNode.replaceChild(newClonedButton, buttonInDOM); // Replace the live button with its clone
        effectiveSubmitButton = newClonedButton; // The new clone is the one we'll attach the handler to
    } else {
        console.error("Test modal submit button or its parent not found in DOM. Attempting to use existing reference or re-fetch.");
        // Fallback: try to use the button we found by ID, or the global reference if that failed.
        // This path indicates a potential issue with the DOM state if buttonInDOM.parentNode is null.
        effectiveSubmitButton = buttonInDOM || testModalSubmitBtn; 
    }

    if (effectiveSubmitButton) {
        effectiveSubmitButton.onclick = async (event) => {
            event.preventDefault();
            console.log("Submitting test answers...");

            const userAnswers = [];
            let score = 0;
            const questionsInTest = Object.keys(testData.questions).length;

            document.querySelectorAll('#cp-test-form .cp-test-question').forEach(qDiv => {
                const qId = qDiv.dataset.questionId;
                const qType = qDiv.dataset.questionType;
                const correctAnswer = qDiv.dataset.correctAnswer;
                let userAnswer = null;
                let isCorrect = false;

                if (qType === 'multiple_choice' || qType === 'true_false') {
                    const selectedRadio = qDiv.querySelector(`input[name="question_${qId}"]:checked`);
                    if (selectedRadio) {
                        userAnswer = selectedRadio.value;
                        if (userAnswer === correctAnswer) {
                            isCorrect = true;
                            score++;
                        }
                    }
                } // Closing brace for if(selectedRadio) added here
                
                userAnswers.push({
                    questionId: qId,
                    userAnswer: userAnswer,
                    isCorrect: isCorrect
                });
            });

            const submissionData = {
                userName: userName,
                courseTitle: courseTitle,
                moduleTitle: moduleTitle,
                testTitle: testData.title, // Official test title from testData
                testId: testData.id, // Store testId for reference
                submittedAt: new Date().toISOString(),
                status: 'graded', // Or 'pending_review' if manual grading needed
                score: score,
                totalPossibleScore: questionsInTest,
                answers: userAnswers
            };

            console.log("Submission Data:", submissionData);

            const submissionId = await submitTestAnswers(submissionData); // api.js function

            if (submissionId) {
                alert(`Test submitted successfully! Your score: ${score}/${questionsInTest}`);
                closeTestModal();
                // Optionally, re-fetch and display results immediately
                // displayTestSubmissionResult({ ...submissionData, id: submissionId }, testData);
                // Or update module status icon (needs more logic)
            } else {
                alert("Error submitting test. Please try again.");
                // Keep modal open for user to retry or copy answers
            }
        };
    }
}

/**
 * Asynchronously updates the status icons for each module based on test completion.
 * @param {Array<Object>} orderedModulesArray Array of module objects.
 * @param {string} courseTitle The title of the current course.
 * @param {string} userName The name of the current user.
 */
async function updateModuleTestStatusIcons(orderedModulesArray, courseTitle, userName) {
    if (!orderedModulesArray || !userName || !courseTitle) return;

    for (const module of orderedModulesArray) {
        if (module.testIds && module.testIds.length > 0) {
            let allTestsCompleted = true;
            for (const testId of module.testIds) {
                const testData = await getTestDetailsById(testId);
                if (!testData || !testData.title) {
                    console.warn(`Could not get details for test ID: ${testId} in module ${module.title}`);
                    allTestsCompleted = false; // If a test can't be verified, assume not completed for safety
                    break;
                }
                const submission = await getUserTestSubmission(userName, courseTitle, module.title, testData.title);
                if (!submission || submission.status !== 'graded') { // Or check score if a passing score is required
                    allTestsCompleted = false;
                    break;
                }
            }

            if (allTestsCompleted) {
                const statusIcon = document.getElementById(`module-status-icon-${module.id}`);
                if (statusIcon) {
                    statusIcon.classList.remove('far', 'fa-square');
                    statusIcon.classList.add('fas', 'fa-check-square');
                    statusIcon.title = 'Module Completed (Test Passed)';
                    statusIcon.classList.add('completed'); // For specific styling if needed
                }
            }
        }
    }
}

/**
 * Calculates and renders the overall course status, checks for completion,
 * and updates enrollment if all tests are passed.
 * @param {Object} courseData The complete course data object, including modules and their testIds.
 * @param {string} userName The name of the current user.
 */
async function renderCourseStatusAndCheckCompletion(courseData, userName) {
    const summarySection = document.getElementById('cp-course-status-summary');
    const summaryDetails = document.getElementById('cp-course-summary-details');

    if (!summarySection || !summaryDetails) {
        console.error("Course status summary elements not found in DOM.");
        return;
    }
    summarySection.style.display = 'block'; // Make it visible

    // First, check if the user is even enrolled and if the course is already completed.
    const enrollment = await getUserEnrollmentForCourse(userName, courseData.title);
    if (enrollment && enrollment.status === 'completed') {
        summaryDetails.innerHTML = `
            <p style="color: green; font-weight: bold;">Course Completed!</p>
            <p>Congratulations! You completed this course on ${new Date(enrollment.completedDate).toLocaleDateString()}.</p>
            <p>Overall Score: Calculating...</p> <!-- We can still calculate and show final score -->
        `;
        // Fall through to calculate and display score even if completed.
    } else if (!enrollment || !['active', 'pending_approval', 'payment_rejected', 'did_not_finish'].includes(enrollment.status) ) {
        // If no active enrollment or enrollment in a state that doesn't allow progression (e.g. awaiting_payment)
        // We could hide the progress or show a message like "Enrollment not active"
        // For now, if not active or completed, we'll just show basic progress.
        // If enrollment.status is 'pending_approval', 'payment_rejected', etc. they shouldn't be able to take tests ideally,
        // but this function focuses on summarizing available data.
         if (!enrollment) {
            summaryDetails.innerHTML = `
                <p>You are not currently enrolled in this course, or your enrollment is not active.</p>
                <p>Please check your <a href="course-dashboard/course-dashboard.html">dashboard</a>.</p>
            `;
            // Potentially hide module test buttons if not actively enrolled
            return; // Stop further processing for non-enrolled or non-active users
        }
    }


    let totalUserScore = 0;
    let totalPossibleCourseScore = 0;
    let allRequiredTestsGraded = true;
    let totalTestsInCourse = 0;
    let gradedTestsCount = 0;

    const modules = getCourseModules(courseData); // Reuse existing function to get ordered modules

    if (!modules || modules.length === 0) {
        summaryDetails.innerHTML = "<p>No modules found for this course to calculate progress.</p>";
        return;
    }

    for (const module of modules) {
        if (module.testIds && module.testIds.length > 0) {
            for (const testId of module.testIds) {
                totalTestsInCourse++;
                const testData = await getTestDetailsById(testId);
                if (!testData || !testData.title) {
                    console.warn(`Cannot get details for test ID: ${testId} in module ${module.title} for course summary.`);
                    allRequiredTestsGraded = false; // Cannot confirm completion if a test is missing
                    continue; // Skip this test
                }

                const submission = await getUserTestSubmission(userName, courseData.title, module.title, testData.title);
                if (submission && submission.status === 'graded') {
                    totalUserScore += (submission.score || 0);
                    totalPossibleCourseScore += (submission.totalPossibleScore || 0);
                    gradedTestsCount++;
                } else {
                    // If any test linked to the course modules isn't graded, the course isn't fully complete.
                    allRequiredTestsGraded = false; 
                }
            }
        }
    }
    
    let percentage = 0;
    if (totalPossibleCourseScore > 0) {
        percentage = (totalUserScore / totalPossibleCourseScore) * 100;
    } else if (totalTestsInCourse === 0) {
        // No tests in the course, consider it 100% for progress display if all modules are 'viewed' (future feature)
        // For now, if no tests, and we reach here, it means it's not 'completed' via enrollment status.
        // We could say "No tests required" or handle as 100% if other criteria are met.
        // Let's assume 0 tests means progress can't be calculated this way.
        percentage = 0; // Or 100 if no tests means automatic completion - depends on course policy
    }


    // Update Summary Display
    let summaryHtml = `
        <p><strong>Overall Course Score:</strong> ${totalUserScore} / ${totalPossibleCourseScore} (${percentage.toFixed(2)}%)</p>
        <p><strong>Tests Completed:</strong> ${gradedTestsCount} / ${totalTestsInCourse}</p>
    `;

    if (enrollment && enrollment.status === 'completed') {
        summaryDetails.innerHTML = `
            <p style="color: green; font-weight: bold;">COURSE COMPLETED!</p>
            <p>Completion Date: ${new Date(enrollment.completedDate).toLocaleDateString()}</p>
            ${summaryHtml} 
        `; // Append score details
    } else if (allRequiredTestsGraded && totalTestsInCourse > 0 && enrollment && enrollment.status === 'active') {
        // All tests are graded, and the enrollment is active, attempt to mark as complete
        const success = await updateEnrollment(enrollment.id, {
            status: 'completed',
            completedDate: new Date().toISOString()
        });
        if (success) {
            summaryHtml += `
                <p style="color: green; font-weight: bold; margin-top: 15px;">Congratulations! You have successfully completed all tests for this course!</p>
                <p>Your enrollment status has been updated to 'Completed'. You will be redirected to the dashboard.</p>
            `;
            summaryDetails.innerHTML = summaryHtml; // Update summary one last time before alert
            alert("Congratulations! You have completed the course! You will be redirected to your dashboard shortly.");
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = 'course-dashboard/course-dashboard.html';
            }, 3000); // 3-second delay

            return; // Important to prevent further rendering or actions
        } else {
            summaryHtml += `
                <p style="color: orange; margin-top: 15px;">All tests completed, but there was an issue updating your enrollment. Please contact support.</p>
            `;
        }
    } else if (totalTestsInCourse === 0 && enrollment && enrollment.status === 'active') {
        // Course has no tests and is active, consider auto-completion?
        // This depends on business logic. For now, let's assume such courses need manual completion or other criteria.
        // Or, if no tests means immediate completion:
        /*
        const success = await updateEnrollment(enrollment.id, {
            status: 'completed',
            completedDate: new Date().toISOString()
        });
        if (success) {
            summaryHtml = `<p style="color: green; font-weight: bold;">This course has no tests and is now marked as completed!</p>`;
            alert("Course completed!");
            renderCourseStatusAndCheckCompletion(courseData, userName); // Re-run
            return;
        }
        */
       summaryHtml += `<p style="margin-top: 10px;">This course has no tests. Completion might be based on other criteria.</p>`;
    } else if (totalTestsInCourse > 0 && !allRequiredTestsGraded) {
        summaryHtml += `<p style="margin-top: 10px;">Keep going! Complete all tests to finish the course.</p>`;
    }

    summaryDetails.innerHTML = summaryHtml;
}

// Add other UI functions as needed (e.g., for modals) 