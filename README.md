# Sarawak Forestry Corporation Website

This project is a comprehensive website for the Sarawak Forestry Corporation with integrated backend functionality for visitors and park guides.

## Project Overview

The Sarawak Forestry Corporation website serves as an information hub and management system with the following key features:

- User authentication system with role-based access (Admin, Park Guide, General User)
- Admin dashboard for managing website content
- Course dashboard for park guides
- Visitor feedback submission system
- Information about national parks, conservation efforts, and eco-tourism

## Setup Instructions

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, etc.)
- Internet connection for Firebase backend services

### Initial Setup

1. Ensure all files are in their appropriate directories as provided
2. Create an admin user by opening the `create-admin.html` file in your browser
3. Click the "Create Admin User" button
4. After successful creation, you can log in with:
   - Email: admin@sarawakforestry.com
   - Password: Admin123!

## Website Navigation

### Main Pages

The website includes the following main pages:

- **Home**: Landing page with overview of Sarawak Forestry Corporation
- **About Us**: Information about the organization
- **National Parks**: Details about national parks in Sarawak
- **Conservation**: Information about conservation efforts
- **Eco-Tourism**: Information about eco-tourism activities
- **Media & News**: Latest news and media releases
- **Contact**: Contact information and form
- **Feedback**: System for visitors to submit feedback
- **Login**: Authentication page for all user types

## User Roles and Access

### General User

- Can browse all public pages
- Can submit feedback
- Can view general information

To register as a general user:
1. Click "Login" in the navigation menu
2. Click "Register Now" at the bottom of the login form
3. Fill in the registration form and select "General User"
4. Verify your email (if required)
5. Login with your created credentials

### Park Guide

- Can access the Course Dashboard
- Can enroll in and complete courses
- Can view and manage their profile

To register as a park guide:
1. Click "Login" in the navigation menu
2. Click "Register Now" at the bottom of the login form
3. Fill in the registration form and select "Park Guide"
4. Verify your email (if required)
5. Login with your created credentials
6. You will be redirected to the Guide Profile page to complete your profile

### Admin

- Has access to the Admin Dashboard
- Can manage all website content
- Can view and respond to user feedback
- Can manage user accounts

To access admin features:
1. Create an admin account using create-admin.html (as described in Setup)
2. Log in with admin credentials
3. You'll be automatically redirected to the Admin Dashboard

## Page-by-Page Usage Guide

### Home Page (index.html)

- Displays featured content and news
- Shows upcoming events
- Provides quick navigation to other sections
- Login/register options are available in the navigation menu

### Login Page (login.html)

- Enter email and password to authenticate
- Option to reset password via "Forgot Password" link
- Link to registration page for new users

### Registration Page (register.html)

- Form to create a new account
- Options to register as General User or Park Guide
- Email verification may be required

### Admin Dashboard (admin-dashboard/admin-dashboard.html)

Accessible only to users with Admin role.

Features:
- Sidebar navigation to different data collections
- Data tables for viewing records
- Forms for adding/editing items
- User management capabilities

Collections that can be managed:
- Users
- Park Guides
- National Parks
- Courses
- Feedback submissions

### Guide Profile (guideprofile.html)

For Park Guide users to manage their profile.

Features:
- Profile picture upload
- Personal information management
- Experience and certification details
- Course history

### Course Dashboard (course-dashboard/course-dashboard.html)

For Park Guide users to access training courses.

Features:
- My Courses section showing enrolled courses
- Course browsing and enrollment
- Completed courses section
- Certificate management

### Feedback Page (feedback.html)

For visitors to submit feedback about their experiences.

Features:
- Star rating system
- Comment submission
- Contact information (optional)

## Troubleshooting

### Login Issues

- Ensure you're using the correct email and password
- Check if you've verified your email (if required)
- Use the "Forgot Password" feature if needed

### Logging Out

To log out from the website:

1. After logging in, your profile picture/icon will appear in the top-right corner of the navigation bar
2. Click on your profile picture/icon to open the dropdown menu
3. Click "Logout" from the dropdown menu
4. You will see a confirmation message and be redirected to the login page

### Admin Access

- If you cannot access the admin dashboard, ensure:
  1. You've created an admin account using create-admin.html
  2. You're logging in with the correct admin credentials
  3. Your user record has the "Admin" role in the database

### Firebase Backend

- The website uses Firebase for authentication and data storage
- If experiencing connection issues, check your internet connection
- Console errors may indicate Firebase configuration problems

## Directory Structure

- `admin-dashboard/`: Admin interface files
- `course-dashboard/`: Park guide course system
- `Resources/`: Images, videos, and other static resources
- Root directory: Main website pages and scripts
- `backup/`: Backup JSON data files

## Technologies Used

- HTML5, CSS3, JavaScript
- Firebase Authentication
- Firebase Firestore (database)
- Firebase Storage (for media files)

---

This project was created for educational purposes. All content is fictional and for demonstration only.
