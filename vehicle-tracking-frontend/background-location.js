let lastSyncedTimestamp = 0;

// Check if the browser supports service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}

// Function to store location data locally
function storeLocationLocally(location) {
  const locations = JSON.parse(localStorage.getItem('locations')) || [];
  locations.push(location);
  localStorage.setItem('locations', JSON.stringify(locations));
}

// Function to sync stored locations with the server
async function syncLocations() {
  const locations = JSON.parse(localStorage.getItem('locations')) || [];

  if (locations.length > 0) {
    try {
      const response = await fetch(`${API_URL}/api/vehicle/update-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locations })
      });

      if (response.ok) {
        // Clear stored locations after successful sync
        localStorage.removeItem('locations');
        console.log('Locations synced successfully');
      } else {
        console.error('Failed to sync locations:', response.statusText);
      }
    } catch (error) {
      console.error('Error syncing locations:', error);
    }
  }
}

// Function to start background location tracking
function startBackgroundLocationTracking() {
  if ('geolocation' in navigator) {
    navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
        };

        // Store location locally
        storeLocationLocally(location);

        // Sync locations with the server if online
        if (navigator.onLine && Date.now() - lastSyncedTimestamp > 60000) { // Sync every 60 seconds
          syncLocations();
          lastSyncedTimestamp = Date.now();
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        handleLocationError(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 60000, // Increased timeout to 60 seconds
      }
    );
  } else {
    console.error('Geolocation is not supported by this browser.');
  }
}

function handleLocationError(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      alert('User denied the request for Geolocation.');
      break;
    case error.POSITION_UNAVAILABLE:
      alert('Location information is unavailable.');
      break;
    case error.TIMEOUT:
      alert('The request to get user location timed out.');
      break;
    case error.UNKNOWN_ERROR:
      alert('An unknown error occurred.');
      break;
  }
}

// Start background location tracking
startBackgroundLocationTracking();

// Sync locations when the device goes online
window.addEventListener('online', syncLocations);
