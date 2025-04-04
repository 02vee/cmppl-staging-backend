const API_URL = 'https://cmppl-staging-backend.onrender.com';
let socket;
let map;
let markers = {};
let trackedVehicles = {};

document.addEventListener('DOMContentLoaded', () => {
  console.log('Track.js loaded successfully');

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
        socket.emit('subscribeToUpdates');
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
        updateVehicleLocation(data);
      });
    }
  };

  const initMap = () => {
    map = L.map('map').setView([15.4909, 73.8278], 10);  // Initial center point (Goa, India)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  };

  const updateVehicleLocation = (data) => {
    const { vehicleId, lat, lng, locationName, deliveryLocationName, deliveryLocation } = data;

    if (!trackedVehicles[vehicleId]) {
      trackedVehicles[vehicleId] = true; // Mark the vehicle as tracked
    }

    let marker = markers[vehicleId];

    if (!marker) {
      marker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`Vehicle ${vehicleId} - ${locationName}`)
        .openPopup();
      markers[vehicleId] = marker;
    } else {
      marker.setLatLng([lat, lng])
        .setPopupContent(`Vehicle ${vehicleId} - ${locationName}`)
        .openPopup();
    }

    const vehicleList = document.getElementById('tracked-vehicles');
    let vehicleItem = document.getElementById(`vehicle-${vehicleId}`);

    if (!vehicleItem) {
      vehicleItem = document.createElement('li');
      vehicleItem.id = `vehicle-${vehicleId}`;
      vehicleItem.innerHTML = `Vehicle ${vehicleId} has reached ${locationName}. Delivery Location: ${deliveryLocationName}. <span id="eta-${vehicleId}">Calculating ETA...</span> <button onclick="removeVehicle('${vehicleId}')">Remove</button>`;
      vehicleList.appendChild(vehicleItem);
    } else {
      vehicleItem.innerHTML = `Vehicle ${vehicleId} has reached ${locationName}. Delivery Location: ${deliveryLocationName}. <span id="eta-${vehicleId}">Calculating ETA...</span> <button onclick="removeVehicle('${vehicleId}')">Remove</button>`;
    }

    // Calculate and display ETA
    calculateETA(lat, lng, deliveryLocation, document.getElementById(`eta-${vehicleId}`));
  };

  const calculateETA = async (currentLat, currentLng, deliveryLocation, etaElement) => {
    const deliveryCoords = deliveryLocation.split(',').map(coord => parseFloat(coord.trim()));
    const [deliveryLat, deliveryLng] = deliveryCoords;

    if (isNaN(deliveryLat) || isNaN(deliveryLng)) {
      etaElement.innerText = 'Invalid delivery location';
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/vehicle/calculate-eta?startLat=${currentLat}&startLng=${currentLng}&endLat=${deliveryLat}&endLng=${deliveryLng}`);
      const data = await response.json();
      const durationMinutes = Math.round(data.eta);

      // Convert duration to days, hours, and minutes
      const days = Math.floor(durationMinutes / (24 * 60));
      const hours = Math.floor((durationMinutes % (24 * 60)) / 60);
      const minutes = durationMinutes % 60;

      let etaString = '';
      if (days > 0) etaString += `${days}d `;
      if (hours > 0) etaString += `${hours}h `;
      etaString += `${minutes}m`;

      etaElement.innerText = `ETA: ${etaString}`;
    } catch (error) {
      console.error('Error calculating ETA:', error);
      etaElement.innerText = 'ETA: N/A';
    }
  };

  const removeVehicle = (vehicleId) => {
    if (markers[vehicleId]) {
      map.removeLayer(markers[vehicleId]);
      delete markers[vehicleId];
    }

    if (trackedVehicles[vehicleId]) {
      delete trackedVehicles[vehicleId];
    }

    const vehicleItem = document.getElementById(`vehicle-${vehicleId}`);
    if (vehicleItem) {
      vehicleItem.remove();
    }

    console.log(`Vehicle ${vehicleId} removed from tracking`);
  };

  window.removeVehicle = removeVehicle;

  initializeSocket();
  initMap();

  const trackForm = document.getElementById('track-form');
  trackForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const vehicleNumber = document.getElementById('vehicle-number').value;
    console.log(`Tracking request for vehicle: ${vehicleNumber}`);

    if (vehicleNumber) {
      try {
        const response = await fetch(`${API_URL}/api/vehicle/track/${vehicleNumber}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',  // Ensure credentials are included
          body: JSON.stringify({
            vehicleId: vehicleNumber
          })
        });

        const data = await response.json();

        document.getElementById('vehicle-number').value = '';
        document.getElementById('vehicle-number').placeholder = 'Enter any vehicle number';

        if (response.status === 404) {
          alert('Vehicle not found. Please enter a correct number.');
        } else if (data.message === 'Tracking started') {
          trackedVehicles[vehicleNumber] = true;
          console.log(`Tracking started for vehicle ${vehicleNumber}`);
          updateVehicleLocation({
            vehicleId: vehicleNumber,
            lat: data.lat,
            lng: data.lng,
            locationName: data.locationName,
            deliveryLocation: data.deliveryLocation,
            deliveryLocationName: data.deliveryLocationName
          });
        } else {
          alert('Error starting tracking!');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    } else {
      alert('Please enter a valid vehicle number!');
    }
  });
});
