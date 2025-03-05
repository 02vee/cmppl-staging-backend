self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  return self.clients.claim();
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-locations') {
    event.waitUntil(syncLocations());
  }
});

async function syncLocations() {
  const locations = JSON.parse(localStorage.getItem('locations')) || [];

  if (locations.length > 0) {
    try {
      const response = await fetch(`${API_URL}/api/vehicle/update-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locations),
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
