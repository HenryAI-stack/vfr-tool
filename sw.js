/**
 * VFR FlightPlan – Service Worker
 * Caches the app shell for offline use
 * GitHub Pages path: /vfr-tool/
 */

const CACHE_NAME = 'vfr-flightplan-v1';
const CACHE_URLS = [
  '/vfr-tool/',
  '/vfr-tool/index.html',
  '/vfr-tool/manifest.json',
  // External libs – cache on first use
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
];

// Install: cache app shell
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_URLS.filter(function(url) {
        return url.startsWith('/');  // Only cache local files on install
      }));
    }).catch(function(e) {
      console.log('SW install cache error (non-fatal):', e.message);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network first for API calls, cache first for app shell
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Always network for API calls (weather, NOTAMs, Google APIs)
  if (url.includes('api.') || url.includes('workers.dev') ||
      url.includes('googleapis.com') || url.includes('accounts.google') ||
      url.includes('aviationweather') || url.includes('checkwx') ||
      url.includes('nominatim') || url.includes('tiles.')) {
    return; // Let browser handle normally
  }

  // Cache first for app shell (HTML, CSS, Leaflet)
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        // Cache successful responses
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    }).catch(function() {
      // Offline fallback for navigation
      if (event.request.mode === 'navigate') {
        return caches.match('/vfr-tool/');
      }
    })
  );
});
