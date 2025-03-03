document.addEventListener('DOMContentLoaded', () => {
    // Check if the user is authenticated
    fetch('http://localhost:5000/api/auth/check-session', { method: 'GET', credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            if (!data.isAuthenticated) {
                window.location.href = '/login.html'; // Redirect to login page if not authenticated
            }
        })
        .catch(() => {
            window.location.href = '/login.html'; // Redirect if error in checking session
        });

    // Logout functionality
    function logout() {
        fetch('http://localhost:5000/api/auth/logout', { method: 'GET', credentials: 'include' })
            .then(response => window.location.href = '/login.html');
    }

    // Attach logout function to the logout link
    document.querySelector('a[onclick="logout()"]').addEventListener('click', logout);
});