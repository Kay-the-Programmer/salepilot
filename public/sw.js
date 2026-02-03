// sw.js (improved)
const CACHE_VERSION = 'v8';
const CACHE_NAME = `salepilot-cache-${CACHE_VERSION}`;
const ASSET_CACHE = `salepilot-assets-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `salepilot-image-cache-${CACHE_VERSION}`;

// Minimal shell to precache. Vite will generate hashed assets we cache at runtime.
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
];

const CDN_URLS = [
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@^19.1.0',
  'https://esm.sh/react@^19.1.0/',
  'https://esm.sh/react-dom@^19.1.0/',
  'https://esm.sh/jsbarcode@^3.11.6',
  'https://esm.sh/qrcode@^1.5.3',
  'https://esm.sh/html5-qrcode@^2.3.8',
  'https://esm.sh/jspdf@2.5.1',
  'https://esm.sh/jspdf-autotable@3.8.2',
  'https://esm.sh/express@^5.1.0',
  'https://esm.sh/cors@^2.8.5',
  'https://esm.sh/dotenv@^17.2.1',
  'https://esm.sh/jsonwebtoken@^9.0.2',
  'https://esm.sh/@google/genai@^1.11.0',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(SHELL_ASSETS);
      } catch (e) {
        // Add individually to tolerate CORS/opaque responses
        await Promise.all(
          SHELL_ASSETS.map(url => cache.add(url).catch(() => undefined))
        );
      }
      // Warm CDN/cache for critical external scripts (best-effort)
      await Promise.all(
        CDN_URLS.map(url => cache.add(url).catch(() => undefined))
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Claim control immediately so new SW works without reload
    await self.clients.claim();
    const keep = new Set([CACHE_NAME, ASSET_CACHE, IMAGE_CACHE_NAME]);
    const names = await caches.keys();
    await Promise.all(names.map(name => keep.has(name) ? undefined : caches.delete(name)));
  })());
});

function isNavigationRequest(request) {
  return request.mode === 'navigate' || (request.destination === '' && request.headers.get('accept')?.includes('text/html'));
}

function shouldHandleAsAsset(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return (
    url.pathname.startsWith('/assets/') ||
    /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf)$/i.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Do not interfere with API calls or non-GET
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) return;

  // 1) SPA navigation: network-first with offline fallback to cached index.html
  if (isNavigationRequest(request)) {
    event.respondWith((async () => {
      try {
        const network = await fetch(request);
        // Fresh copy of index.html to cache for offline
        if ((url.pathname === '/' || url.pathname.endsWith('.html')) && request.url.startsWith('http')) {
          const copy = network.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/index.html', copy)).catch(() => { });
        }
        return network;
      } catch (_) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match('/index.html');
        if (cached) return cached;
        // As last resort try any cached shell
        const match = await caches.match(request);
        return match || new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  // 2) Same-origin built assets: stale-while-revalidate
  if (shouldHandleAsAsset(request)) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSET_CACHE);
      const cached = await cache.match(request);
      const fetchPromise = fetch(request).then(response => {
        if (response && response.ok && request.url.startsWith('http')) cache.put(request, response.clone());
        return response;
      }).catch(() => undefined);
      return cached || fetchPromise || fetch(request);
    })());
    return;
  }

  // 3) Images (any origin): cache-first
  if (request.destination === 'image') {
    event.respondWith((async () => {
      const cache = await caches.open(IMAGE_CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request, { mode: request.mode });
        if (response && (response.ok || response.type === 'opaque') && request.url.startsWith('http')) {
          cache.put(request, response.clone());
          // Optional: prune old entries (best-effort)
          cache.keys().then(keys => { if (keys.length > 200) cache.delete(keys[0]); });
        }
        return response;
      } catch (_) {
        return new Response('', { status: 404 });
      }
    })());
    return;
  }

  // 4) External CDN requests: cache-first best-effort
  if (CDN_URLS.some(prefix => request.url.startsWith(prefix))) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && (response.ok || response.type === 'opaque') && request.url.startsWith('http')) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }
        return response;
      } catch (_) {
        return cached || new Response('Offline CDN resource', { status: 503 });
      }
    })());
    return;
  }

  // 5) Default: try cache first then network, and cache successful responses
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok && request.url.startsWith('http')) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch (_) {
      return new Response('Offline', { status: 503 });
    }
  })());
});

// --- Push Notification Handlers ---

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'SalePilot Notification';
    const options = {
      body: data.body || 'New update available',
      icon: data.icon || '/images/salepilot.png',
      badge: '/vite.svg',
      data: data.data || { url: '/' },
      vibrate: [100, 50, 100],
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);

    // Fallback if not JSON
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('SalePilot', {
        body: text,
        icon: '/images/salepilot.png'
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If a window is already open at this URL, focus it
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});
