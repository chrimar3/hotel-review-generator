/**
 * Service Worker for Hotel Review Generator PWA
 * Provides offline functionality and caching for core features
 */

const CACHE_NAME = 'hotel-review-generator-v1';
const STATIC_CACHE_NAME = 'hotel-review-static-v1';
const DYNAMIC_CACHE_NAME = 'hotel-review-dynamic-v1';

// Cache static assets for offline access
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/404.html'
];

// Cache strategies
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE_NAME).then((cache) => {
                console.log('[ServiceWorker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),
            self.skipWaiting()
        ])
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
    
    event.waitUntil(
        Promise.all([
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME &&
                            cacheName.startsWith('hotel-review-')) {
                            console.log('[ServiceWorker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            self.clients.claim()
        ])
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle different types of requests
    if (request.method === 'GET') {
        if (isStaticAsset(request)) {
            event.respondWith(handleStaticAsset(request));
        } else if (isAPIRequest(request)) {
            event.respondWith(handleAPIRequest(request));
        } else if (isNavigationRequest(request)) {
            event.respondWith(handleNavigationRequest(request));
        } else {
            event.respondWith(handleOtherRequest(request));
        }
    }
});

// Check if request is for a static asset
function isStaticAsset(request) {
    const url = new URL(request.url);
    return STATIC_ASSETS.includes(url.pathname) ||
           url.pathname.endsWith('.css') ||
           url.pathname.endsWith('.js') ||
           url.pathname.endsWith('.png') ||
           url.pathname.endsWith('.jpg') ||
           url.pathname.endsWith('.jpeg') ||
           url.pathname.endsWith('.svg') ||
           url.pathname.endsWith('.ico');
}

// Check if request is for an API
function isAPIRequest(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/api/') ||
           url.hostname.includes('booking.com') ||
           url.hostname.includes('expedia.com') ||
           url.hostname.includes('tripadvisor.com') ||
           url.hostname.includes('google.com');
}

// Check if request is a navigation request
function isNavigationRequest(request) {
    return request.mode === 'navigate' ||
           (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[ServiceWorker] Static asset fetch failed:', error);
        
        // Return cached version if available
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline fallback for images
        if (request.destination === 'image') {
            return new Response('', {
                status: 200,
                statusText: 'OK',
                headers: { 'Content-Type': 'image/svg+xml' }
            });
        }
        
        throw error;
    }
}

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful GET requests
        if (networkResponse.ok && request.method === 'GET') {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[ServiceWorker] API request failed:', error);
        
        // For platform URLs, we can't really cache them effectively
        // so we'll return an error response that the app can handle
        return new Response(JSON.stringify({
            error: 'offline',
            message: 'This feature requires an internet connection'
        }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
    try {
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        console.log('[ServiceWorker] Navigation request failed:', error);
        
        // Return cached index.html for SPA
        const cachedResponse = await caches.match('/index.html');
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return basic offline page
        return new Response(getOfflinePage(), {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

// Handle other requests
async function handleOtherRequest(request) {
    try {
        return await fetch(request);
    } catch (error) {
        console.log('[ServiceWorker] Other request failed:', error);
        throw error;
    }
}

// Generate offline page HTML
function getOfflinePage() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline - Hotel Review Generator</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    color: #334155;
                    text-align: center;
                    padding: 20px;
                }
                .offline-container {
                    max-width: 400px;
                    background: white;
                    padding: 40px;
                    border-radius: 16px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                }
                .offline-icon {
                    font-size: 48px;
                    margin-bottom: 20px;
                }
                .offline-title {
                    font-size: 24px;
                    font-weight: 600;
                    margin-bottom: 16px;
                }
                .offline-message {
                    font-size: 16px;
                    line-height: 1.5;
                    margin-bottom: 24px;
                }
                .retry-button {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .retry-button:hover {
                    background: #2563eb;
                }
            </style>
        </head>
        <body>
            <div class="offline-container">
                <div class="offline-icon">🏨</div>
                <h1 class="offline-title">You're Offline</h1>
                <p class="offline-message">
                    The Hotel Review Generator is not available right now. 
                    Please check your internet connection and try again.
                </p>
                <button class="retry-button" onclick="location.reload()">
                    Try Again
                </button>
            </div>
        </body>
        </html>
    `;
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Background sync:', event.tag);
    
    if (event.tag === 'review-submission') {
        event.waitUntil(syncPendingReviews());
    }
});

// Sync pending reviews when connection is restored
async function syncPendingReviews() {
    try {
        // This would handle any queued review submissions
        console.log('[ServiceWorker] Syncing pending reviews...');
        // Implementation would depend on how reviews are queued
    } catch (error) {
        console.log('[ServiceWorker] Failed to sync pending reviews:', error);
    }
}

// Push notification handling (for future enhancement)
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push received:', event);
    
    const options = {
        body: 'Thank you for using our review generator!',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data: {
            url: '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('Hotel Review Generator', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker] Notification clicked:', event);
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});

// Error handling for service worker
self.addEventListener('error', (event) => {
    console.error('[ServiceWorker] Error:', event.error);
});

// Unhandled promise rejection handling
self.addEventListener('unhandledrejection', (event) => {
    console.error('[ServiceWorker] Unhandled promise rejection:', event.reason);
});

console.log('[ServiceWorker] Loaded successfully');