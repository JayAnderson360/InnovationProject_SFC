// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBS4W6MddWuU3lxotE9peb7RsI_QJzIzaI",
    authDomain: "sarawak-forestry-database.firebaseapp.com",
    projectId: "sarawak-forestry-database",
    storageBucket: "sarawak-forestry-database.appspot.com",
    messagingSenderId: "979838017340",
    appId: "1:979838017340:web:a31113d00fafcb0bcb4839",
    measurementId: "G-KXNY4PT4VY"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
    const feedbackForm = document.querySelector('.ash_feedback-form_4');
    
    if (feedbackForm) {
        // Handle form submission
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form field values
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const visitDate = document.getElementById('visit-date').value;
            const location = document.getElementById('location').value;
            const cleanlinessRating = document.getElementById('cleanliness-rating').value;
            const staffRating = document.getElementById('staff-rating').value;
            const facilitiesRating = document.getElementById('facilities-rating').value;
            const overallRating = document.getElementById('overall-rating').value;
            const feedbackType = document.querySelector('input[name="feedback-type"]:checked').value;
            const feedbackText = document.getElementById('feedback').value.trim();
            const improvementSuggestions = document.getElementById('improvements').value.trim();
            const contactPermission = document.getElementById('contact-permission').checked;
            
            try {
                // Save feedback to Firestore
                await db.collection('visitor_feedback').add({
                    name,
                    email,
                    visitDate,
                    location,
                    ratings: {
                        cleanliness: parseInt(cleanlinessRating) || 0,
                        staff: parseInt(staffRating) || 0,
                        facilities: parseInt(facilitiesRating) || 0,
                        overall: parseInt(overallRating) || 0
                    },
                    feedbackType,
                    feedbackText,
                    improvementSuggestions,
                    contactPermission,
                    submittedAt: new Date(),
                    status: 'new'
                });
                
                // Show success message
                alert('Thank you for your feedback! We appreciate your input.');
                
                // Reset form
                feedbackForm.reset();
                
                // Reset star ratings
                document.querySelectorAll('.ash_star-rating_4 i').forEach(star => {
                    star.className = 'far fa-star';
                });
                
                // Reset hidden rating inputs
                document.getElementById('cleanliness-rating').value = '0';
                document.getElementById('staff-rating').value = '0';
                document.getElementById('facilities-rating').value = '0';
                document.getElementById('overall-rating').value = '0';
                
            } catch (error) {
                console.error('Error submitting feedback:', error);
                alert('There was an error submitting your feedback. Please try again later.');
            }
        });
    }
});
