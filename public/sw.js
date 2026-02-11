// Calixo PWA Service Worker
// Version 1.0.0

const CACHE_NAME = 'calixo-v1';
const OFFLINE_URL = '/offline';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/challenges',
  '/challenges/social',
  '/feed',
  '/store',
  '/avatar',
  '/notifications',
  '/manifest.json',
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching app shell');
      return cache.addAll(PRECACHE_ASSETS).catch((error) => {
        console.error('[SW] Precache failed:', error);
        // Continue even if some assets fail to cache
      });
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - implement cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Skip Chrome extensions and other protocols
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // API routes - Only cache GET requests, pass through POST/PUT/DELETE/etc
  if (url.pathname.startsWith('/api/')) {
    // For non-GET requests (POST, PUT, DELETE, etc), bypass cache completely
    if (request.method !== 'GET') {
      event.respondWith(fetch(request));
      return;
    }
    // For GET requests, use network first strategy
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Supabase Storage - Cache First (for images)
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/')) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // Navigation requests - Network First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }
  
  // Static assets (_next/static) - Cache First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // Images, fonts, etc - Cache First
  if (request.destination === 'image' || request.destination === 'font' || request.destination === 'style') {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // Default - Network First
  event.respondWith(networkFirstStrategy(request));
});

// Network First Strategy - Try network, fallback to cache
// Only works with GET requests (POST/PUT/DELETE should bypass this)
async function networkFirstStrategy(request) {
  // Safety check: only cache GET requests
  if (request.method !== 'GET') {
    return fetch(request);
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful GET responses only
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      // Only cache if the request is cacheable
      if (request.method === 'GET') {
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return offline page for navigation
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    throw error;
  }
}

// Cache First Strategy - Try cache first, fallback to network
// Only works with GET requests
async function cacheFirstStrategy(request) {
  // Safety check: only cache GET requests
  if (request.method !== 'GET') {
    return fetch(request);
  }
  
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache and network both failed:', error);
    throw error;
  }
}

// Navigation Strategy - Network first with offline fallback
// Only works with GET requests (navigation is always GET)
async function navigationStrategy(request) {
  // Safety check: navigation requests should always be GET
  if (request.method !== 'GET') {
    return fetch(request);
  }
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation offline, showing offline page');
    
    // Try to return cached version of the page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match(OFFLINE_URL);
  }
}

// Background Sync - Queue failed requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-calixo-actions') {
    event.waitUntil(syncFailedRequests());
  }
});

// Sync failed requests from IndexedDB
async function syncFailedRequests() {
  console.log('[SW] Syncing failed requests...');
  
  try {
    // Open IndexedDB to get pending requests
    const db = await openSyncDatabase();
    const requests = await getPendingRequests(db);
    
    console.log('[SW] Found pending requests:', requests.length);
    
    for (const req of requests) {
      try {
        await fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body,
        });
        
        // Remove from queue on success
        await removeFromQueue(db, req.id);
        console.log('[SW] Synced request:', req.url);
      } catch (error) {
        console.error('[SW] Failed to sync request:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// IndexedDB helpers for background sync
function openSyncDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('calixo-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-requests')) {
        db.createObjectStore('pending-requests', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getPendingRequests(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-requests'], 'readonly');
    const store = transaction.objectStore('pending-requests');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeFromQueue(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-requests'], 'readwrite');
    const store = transaction.objectStore('pending-requests');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Calixo';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: data.url || '/',
    tag: data.tag || 'calixo-notification',
    requireInteraction: false,
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log('[SW] Service Worker loaded');



