// app.js - Main application logic for the admin dashboard

// Main Application Logic
class AdminDashboard {
    constructor() {
        this.initializeApp();
    }

    async initializeApp() {
        try {
            // Initialize Firebase data
            await firebaseAPI.initializeData();

            // Initialize UI components
            ui.initializeIoTChart();
            ui.updateDashboardStats();
            ui.updateIoTChart('1H'); // Default to 1 hour view

            // Set up periodic updates
            this.setupPeriodicUpdates();
        } catch (error) {
            console.error('Error initializing admin dashboard:', error);
            this.showError('Failed to initialize dashboard. Please refresh the page.');
        }
    }

    setupPeriodicUpdates() {
        // Update dashboard stats every minute
        setInterval(() => {
            ui.updateDashboardStats();
        }, 60000);

        // Update IoT data every minute
        setInterval(() => {
            ui.updateIoTChart(ui.currentRange || '1H');
        }, 60000);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new AdminDashboard();
});
