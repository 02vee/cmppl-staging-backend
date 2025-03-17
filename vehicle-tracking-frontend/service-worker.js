importScripts('https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/idb-keyval-iife.min.js');

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'syncLocationUpdates') {
    event.waitUntil(syncLocationUpdates());
  }
});

async function syncLocationUpdates() {
  const locations = JSON.parse(await idbKeyval.get('locations')) || [];
  if (locations.length > 0) {
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
