# Sentiment Rating System

This web application analyzes the sentiment of text comments and provides a rating from 1 to 5 stars, with 1 being very negative and 5 being very positive.

## Features

- **Sentiment Analysis**: Uses NLTK's VADER (Valence Aware Dictionary for Sentiment Reasoning) to analyze text sentiment
- **Star Rating**: Converts sentiment scores to a 1-5 star rating system
- **User-Friendly Interface**: Clean, responsive design for easy interaction
- **Example Comments**: Pre-defined examples to test the system
- **Detailed Explanations**: Provides context for each rating

## Technology Stack

- **Backend**: Flask (Python)
- **Sentiment Analysis**: NLTK VADER
- **Frontend**: HTML, CSS, JavaScript
- **UI Components**: Font Awesome for star icons

## How to Run

1. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the Flask application:
   ```
   python app.py
   ```

3. Open your browser and navigate to:
   ```
   http://127.0.0.1:5000/
   ```

## How It Works

1. The user enters a text comment in the form
2. The backend processes the comment using NLTK's VADER sentiment analyzer
3. The sentiment score is converted to a 1-5 star rating
4. The results are displayed with an explanation of the rating

## Rating Scale

- ⭐ - Very negative sentiment
- ⭐⭐ - Negative sentiment
- ⭐⭐⭐ - Neutral sentiment
- ⭐⭐⭐⭐ - Positive sentiment
- ⭐⭐⭐⭐⭐ - Very positive sentiment

## Technical Implementation

The application uses NLTK's VADER sentiment analyzer, which is specifically designed for social media text sentiment analysis. It considers:

- Punctuation
- Capitalization
- Intensifiers
- Common slang and emoticons

The compound score from VADER (ranging from -1 to 1) is mapped to a 1-5 star rating system to make it more intuitive for users.
