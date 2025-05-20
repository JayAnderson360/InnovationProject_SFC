document.addEventListener('DOMContentLoaded', function() {
    const commentForm = document.getElementById('comment-form');
    const commentInput = document.getElementById('comment');
    const analyzeBtn = document.getElementById('analyze-btn');
    const btnText = analyzeBtn.querySelector('.btn-text');
    const spinner = analyzeBtn.querySelector('.spinner');
    const resultsSection = document.getElementById('results-section');
    const resultComment = document.getElementById('result-comment');
    const starDisplay = document.getElementById('star-display');
    const ratingExplanation = document.getElementById('rating-explanation');
    const exampleButtons = document.querySelectorAll('.example-btn');
    
    // Mapping of star ratings to descriptions
    const ratingDescriptions = {
        1: "Very Negative: This comment expresses strong dissatisfaction or negative sentiment.",
        2: "Negative: This comment contains negative sentiment or criticism.",
        3: "Neutral: This comment is relatively balanced or neutral in sentiment.",
        4: "Positive: This comment expresses satisfaction or positive sentiment.",
        5: "Very Positive: This comment expresses strong satisfaction or enthusiasm."
    };
    
    // Handle form submission
    commentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const comment = commentInput.value.trim();
        if (!comment) {
            alert('Please enter a comment to analyze.');
            return;
        }
        
        // Show loading state
        btnText.textContent = 'Analyzing...';
        spinner.classList.remove('hidden');
        analyzeBtn.disabled = true;
        
        // Send request to backend
        analyzeSentiment(comment);
    });
    
    // Handle example buttons
    exampleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const exampleText = this.getAttribute('data-text');
            commentInput.value = exampleText;
            commentInput.focus();
        });
    });
    
    // Function to send analysis request
    function analyzeSentiment(comment) {
        fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ comment: comment })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            displayResults(data);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while analyzing the comment. Please try again.');
        })
        .finally(() => {
            // Reset button state
            btnText.textContent = 'Analyze Sentiment';
            spinner.classList.add('hidden');
            analyzeBtn.disabled = false;
        });
    }
    
    // Function to display results
    function displayResults(data) {
        // Show results section
        resultsSection.classList.remove('hidden');
        
        // Set comment text
        resultComment.textContent = data.comment;
        
        // Update stars display
        const stars = starDisplay.querySelectorAll('.fas');
        stars.forEach((star, index) => {
            if (index < data.rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
        
        // Set explanation text
        ratingExplanation.textContent = ratingDescriptions[data.rating] || 
                                      `Rating: ${data.rating} stars`;
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
});
