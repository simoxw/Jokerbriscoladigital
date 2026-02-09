const CACHE_VERSION = 'v8';
const STATIC_CACHE = `joker-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `joker-dynamic-${CACHE_VERSION}`;
const IMAGES_CACHE = `joker-images-${CACHE_VERSION}`;

const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './assets/icon.png',
    './assets/sounds/carddrop2-92718.mp3',
    './assets/sounds/pageturn-102978.mp3'
];

// Install: Pre-cache asset critici
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// Activate: Pulizia vecchie cache
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) =>
                    key !== STATIC_CACHE &&
                    key !== DYNAMIC_CACHE &&
                    key !== IMAGES_CACHE
                ).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 1. CARTE e IMMAGINI: Cache-First
    if (url.pathname.includes('/assets/cards/') || url.pathname.endsWith('.webp') || url.pathname.endsWith('.png')) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (!response || response.status !== 200) return response;
                    const responseClone = response.clone();
                    caches.open(IMAGES_CACHE).then((cache) => cache.put(request, responseClone));
                    return response;
                });
            })
        );
        return;
    }

    // 2. SUONI: Cache-First
    if (url.pathname.includes('/assets/sounds/')) {
        event.respondWith(
            caches.match(request).then((cached) => {
                return cached || fetch(request).then((response) => {
                    const responseClone = response.clone();
                    caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
                    return response;
                });
            })
        );
        return;
    }

    // 3. LOGICA (HTML, JS, CSS): Stale-While-Revalidate
    // Permette aggiornamenti rapidi mantenendo l'offline funzionante
    if (url.origin === location.origin) {
        event.respondWith(
            caches.open(DYNAMIC_CACHE).then((cache) => {
                return cache.match(request).then((cached) => {
                    const fetchPromise = fetch(request).then((response) => {
                        if (response && response.status === 200) {
                            cache.put(request, response.clone());
                        }
                        return response;
                    });
                    return cached || fetchPromise;
                });
            })
        );
    }
});
