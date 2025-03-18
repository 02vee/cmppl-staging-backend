let lastSyncedTimestamp = 0;
let trackingEnabled = false; // Flag to check if tracking is enabled
let vehicleId = null; // Store vehicleId once it's set

// Ensure that IndexedDB is available
if (!window.indexedDB) {
  console.error("Your browser doesn't support a stable version of IndexedDB.");
}

const idbKeyval = {
  get(key) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('keyval-store', 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('keyval')) {
          db.createObjectStore('keyval');
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('keyval', 'readonly');
        const store = tx.objectStore('keyval');
        const getRequest = store.get(key);
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  },
  set(key, val) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('keyval-store', 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('keyval')) {
          db.createObjectStore('keyval');
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('keyval', 'readwrite');
        const store = tx.objectStore('keyval');
        store.put(val, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  },
};

// Register the service worker
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  navigator.serviceWorker.register('/service-worker.js').then((registration) => {
    console.log('Service Worker registered with scope:', registration.scope);
  }).catch((error) => {
    console.error('Service Worker registration failed:', error);
  });
}

// Function to store location data locally
function storeLocationLocally(location) {
  idbKeyval.get('locations').then((locations) => {
    locations = locations || [];
    locations.push(location);
    idbKeyval.set('locations', JSON.stringify(locations));
  });
}

// Function to sync stored locations with the server
async function syncLocations() {
  const locations = JSON.parse(await idbKeyval.get('locations')) || [];

  if (locations.length > 0 && trackingEnabled && vehicleId) {
    try {
      const response = await fetch(`${API_URL}/api/vehicle/update-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locations }),
      });

      if (response.ok) {
        // Clear stored locations after successful sync
        await idbKeyval.set('locations', JSON.stringify([]));
        console.log('Locations synced successfully');
      } else {
        const responseData = await response.json();
        console.error('Failed to sync locations:', response.statusText, responseData);
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
        if (trackingEnabled && vehicleId) {
          const location = {
            vehicleId: vehicleId,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString(),
          };

          // Store location locally
          storeLocationLocally(location);

          // Register background sync
          navigator.serviceWorker.ready.then((registration) => {
            return registration.sync.register('syncLocationUpdates');
          }).catch((error) => {
            console.error('Sync registration failed:', error);
          });

          // Sync locations with the server if online
          if (navigator.onLine && Date.now() - lastSyncedTimestamp > 60000) { // Sync every 60 seconds
            syncLocations();
            lastSyncedTimestamp = Date.now();
          }
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

// Sync locations when the device goes online
window.addEventListener('online', syncLocations);

// Start background location tracking when the script is loaded
startBackgroundLocationTracking();
