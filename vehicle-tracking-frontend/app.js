const API_URL = 'https://cmppl-staging-backend.onrender.com';

let socket;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('App.js loaded successfully');

    const initializeSocket = () => {
        if (!socket) {
            console.log('Initializing socket connection');
            socket = io(API_URL, {
                withCredentials: true,  // Important for session handling
                reconnectionAttempts: 5,  // Limit reconnection attempts
                transports: ['websocket']  // Force WebSocket over polling
            });

            // Connection success
            socket.on('connect', () => {
                console.log(`Connected to Socket.IO server with ID: ${socket.id}`);
            });

            // Handle reconnection
            socket.on('reconnect_attempt', () => {
                console.log('Attempting to reconnect...');
            });

            // Handle disconnection
            socket.on('disconnect', (reason) => {
                console.log(`Disconnected: ${reason}`);
                if (reason === 'io server disconnect') {
                    socket.connect();  // Manual reconnect
                }
            });

            // Listen for vehicle updates
            socket.on('vehicleLocationUpdate', (data) => {
                console.log('Vehicle update:', data);
            });
        }
    };

    // Check session on Admin page
    if (window.location.pathname === '/admin.html') {
        console.log('Checking session on Admin page');
        try {
            const response = await fetch(`${API_URL}/api/auth/check-session`, {
                method: 'GET',
                credentials: 'include',  // Include credentials in request
            });

            const data = await response.json();
            console.log('Session check data:', data);
            if (!data.isAuthenticated) {
                console.log('User not authenticated, redirecting to login page');
                window.location.href = '/login.html';
            } else {
                initializeSocket();
            }
        } catch (error) {
            console.error('Session check failed:', error);
            window.location.href = '/login.html';
        }
    }

    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        console.log('Login form found');
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            console.log('Login form submitted', { username, password });

            if (username && password) {
                try {
                    console.log('Sending login request:', { username, password });

                    const response = await fetch(`${API_URL}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password }),
                        credentials: 'include',  // Include credentials in request
                    });

                    const data = await response.json();
                    console.log('Response data:', data);

                    if (response.ok) {
                        console.log('Login successful, redirecting to /admin.html');
                        window.location.href = '/admin.html';
                    } else {
                        alert(data.message);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Login failed! Check server or credentials.');
                }
            } else {
                alert('Please fill in both fields!');
            }
        });
    }

    // Admin vehicle tracking form submission
    const vehicleForm = document.getElementById('vehicle-form');
    if (vehicleForm) {
        console.log('Vehicle form found');
        vehicleForm.addEventListener('submit', function (event) {
            event.preventDefault();

            // Get vehicle number from input
            const vehicleNumber = document.getElementById('vehicle-number').value;

            console.log(`Tracking vehicle number: ${vehicleNumber}`);

            // Basic validation
            if (vehicleNumber) {
                // Call the backend to start tracking the vehicle
                fetch(`${API_URL}/api/vehicle/track/${vehicleNumber}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',  // Ensure credentials are included
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message === 'Tracking started') {
                        // Display vehicle status on admin dashboard
                        const vehicleList = document.getElementById('tracked-vehicles');
                        const vehicleItem = document.createElement('li');
                        vehicleItem.textContent = `Vehicle ${vehicleNumber} is being tracked.`;
                        vehicleList.appendChild(vehicleItem);
                    } else {
                        alert('Error starting tracking!');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            } else {
                alert('Please enter a valid vehicle number!');
            }
        });
    }
});
