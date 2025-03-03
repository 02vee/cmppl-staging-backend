let socket;
let map;
let markers = {};
let trackedVehicles = {};

document.addEventListener('DOMContentLoaded', () => {
  console.log('Track.js loaded successfully');

  // Request location access as soon as the page loads
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location access granted');
      },
      (error) => {
        console.error('Location access denied', error);
      }
    );
  } else {
    console.error('Geolocation is not supported by this browser');
  }

  const initializeSocket = () => {
    if (!socket) {
      console.log('Initializing socket connection');
      socket = io('http://localhost:5000', {
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
      return; // Ignore updates for vehicles not being tracked
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
    // Convert the delivery location into lat, lng
    const deliveryCoords = deliveryLocation.split(',').map(coord => parseFloat(coord.trim()));
    const [deliveryLat, deliveryLng] = deliveryCoords;

    if (isNaN(deliveryLat) || isNaN(deliveryLng)) {
      etaElement.innerText = 'Invalid delivery location';
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/vehicle/calculate-eta?startLat=${currentLat}&startLng=${currentLng}&endLat=${deliveryLat}&endLng=${deliveryLng}`);
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
        const response = await fetch(`http://localhost:5000/api/vehicle/track/${vehicleNumber}`, {
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

        // Clear the input field and set the placeholder
        document.getElementById('vehicle-number').value = '';
        document.getElementById('vehicle-number').placeholder = 'Enter any vehicle number';

        if (response.status === 404) {
          // Display specific error message if vehicle is not found
          alert('Vehicle not found. Please enter a correct number.');
        } else if (data.message === 'Tracking started') {
          trackedVehicles[vehicleNumber] = true;
          console.log(`Tracking started for vehicle ${vehicleNumber}`);
          // Manually trigger a vehicle update to ensure the UI is updated immediately
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