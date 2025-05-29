document.addEventListener('DOMContentLoaded', async () => {
    // Ensure Firebase is initialized before trying to use it
    if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
        console.error('Firebase not initialized. Make sure firebase-config.js is loaded and initialized before feedback.js');
        alert('Error initializing page. Please try again later.');
        return;
    }
    const db = firebase.firestore();

    const locationSelect = document.getElementById('locationName');
    const guideSelect = document.getElementById('guideName');
    const feedbackForm = document.getElementById('visitorFeedbackForm');
    const clearFormButton = document.getElementById('clearFormButton');

    // --- Populate Park Locations Dropdown ---
    async function populateLocations() {
        if (!locationSelect) return;
        try {
            const parksSnapshot = await db.collection('parks').get();
            locationSelect.innerHTML = '<option value="" disabled selected>Select a location</option>'; // Reset
            parksSnapshot.forEach(doc => {
                const park = doc.data();
                const option = document.createElement('option');
                option.value = park.name; // Store park name as value
                option.textContent = park.name;
                locationSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching park locations:', error);
            locationSelect.innerHTML = '<option value="" disabled selected>Error loading locations</option>';
        }
    }

    // --- Populate Guides Dropdown ---
    async function populateGuides() {
        if (!guideSelect) return;
        try {
            const usersSnapshot = await db.collection('users').where('role', '==', 'Park Guide').get();
            guideSelect.innerHTML = '<option value="" disabled selected>Select a guide</option>'; // Reset
            guideSelect.add(new Option('Unknown Guide / No Guide', 'Unknown Guide'));
            usersSnapshot.forEach(doc => {
                const user = doc.data();
                const option = document.createElement('option');
                option.value = user.name; // Store guide name as value
                option.textContent = user.name;
                guideSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching guides:', error);
            guideSelect.innerHTML = '<option value="" disabled selected>Error loading guides</option>';
        }
    }

    // --- Star Rating Functionality ---
    document.querySelectorAll('.ash_star-rating_4 i').forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            const parentRatingContainer = this.parentElement;
            const ratingFor = parentRatingContainer.getAttribute('data-rating-for');
            const hiddenInput = document.getElementById(ratingFor + '-rating');
            
            // Reset all stars in this specific rating group
            parentRatingContainer.querySelectorAll('i').forEach(s => {
                s.className = 'far fa-star'; // Regular (empty) star
            });
            
            // Fill stars up to selected rating in this specific rating group
            for (let i = 1; i <= rating; i++) {
                const starToFill = parentRatingContainer.querySelector(`i[data-rating="${i}"]`);
                if(starToFill) starToFill.className = 'fas fa-star'; // Solid (filled) star
            }
            
            if (hiddenInput) {
                hiddenInput.value = rating;
            }
        });
    });

    // --- Handle Form Submission ---
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(feedbackForm);
            const feedbackData = {};

            formData.forEach((value, key) => {
                feedbackData[key] = value;
            });

            // Convert date to ISO string (Timestamp like format)
            if (feedbackData.feedback_date) {
                feedbackData.feedback_date = new Date(feedbackData.feedback_date).toISOString();
            }

            // Convert ratings to numbers
            ['GeneralKnowledge', 'CommunicationSkills', 'Engagement', 'KnowledgeOfThePark'].forEach(key => {
                if (feedbackData[key]) {
                    feedbackData[key] = parseInt(feedbackData[key], 10);
                } else {
                    feedbackData[key] = 0; // Default to 0 if not rated
                }
            });
            
            // Ensure guideName is present, default if not selected but field exists
            if (!feedbackData.guideName) {
                 feedbackData.guideName = 'Unknown Guide / No Guide';
            }


            try {
                await db.collection('visitor_feedback').add(feedbackData);
                alert('Feedback submitted successfully! Thank you.');
                feedbackForm.reset();
                // Reset star ratings visually and their hidden inputs
                document.querySelectorAll('.ash_star-rating_4').forEach(container => {
                    container.querySelectorAll('i').forEach(s => s.className = 'far fa-star');
                    const ratingFor = container.getAttribute('data-rating-for');
                    const hiddenInput = document.getElementById(ratingFor + '-rating');
                    if(hiddenInput) hiddenInput.value = '0';
                });
            } catch (error) {
                console.error('Error submitting feedback:', error);
                alert('Error submitting feedback. Please try again.');
            }
        });
    }

    // --- Handle Clear Form Button ---
    if (clearFormButton) {
        clearFormButton.addEventListener('click', () => {
            if(feedbackForm) feedbackForm.reset();
             // Reset star ratings visually and their hidden inputs
            document.querySelectorAll('.ash_star-rating_4').forEach(container => {
                container.querySelectorAll('i').forEach(s => s.className = 'far fa-star');
                const ratingFor = container.getAttribute('data-rating-for');
                const hiddenInput = document.getElementById(ratingFor + '-rating');
                if(hiddenInput) hiddenInput.value = '0';
            });
        });
    }
    
    // --- Initialize Dropdowns ---
    populateLocations();
    populateGuides();

    // --- Re-implement FAQ and Nav Toggle from original inline script if needed ---
    // FAQ Accordion
    document.querySelectorAll('.ash_faq-question_3').forEach(question => {
        question.addEventListener('click', function() {
            const parent = this.parentElement;
            const currentlyActive = parent.classList.contains('active');
            
            // Close all other FAQs first
            document.querySelectorAll('.ash_faq-item_3.active').forEach(item => {
                item.classList.remove('active');
            });
            
            // If it wasn't active, activate it
            if (!currentlyActive) {
                parent.classList.add('active');
            }
            // If it was active, clicking again closes it (handled by the remove active on all others)
        });
    });
    
    // Navigation toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
}); 