const API_URL = 'https://cmppl-staging-backend.onrender.com';
document.addEventListener('DOMContentLoaded', () => {
    // Check if the user is authenticated
    fetch(`${API_URL}/api/auth/check-session`, { method: 'GET', credentials: 'include' })
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
        fetch(`${API_URL}/api/auth/logout`, { method: 'GET', credentials: 'include' })
            .then(response => window.location.href = '/login.html');
    }

    // Attach logout function to the logout link
    document.querySelector('a[onclick="logout()"]').addEventListener('click', logout);
});
async function fetchAdminData() {
    const response = await fetch(`${API_URL}/admin/data`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.json();
}