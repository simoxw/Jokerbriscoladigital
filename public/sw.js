const CACHE_NAME = 'joker-briscola-cards-v7'; // Bump version
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './assets/icon.png',
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    const isInternal = url.host === location.host;
    const isCardImage = url.pathname.includes('/assets/cards/') || url.pathname.endsWith('.webp');

    // Strategia per le CARTE: Cache-First
    if (isCardImage) {
        event.respondWith(
            caches.match(request).then((res) => {
                return res || fetch(request).then((fetchRes) => {
                    const responseToCache = fetchRes.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                    return fetchRes;
                });
            })
        );
        return;
    }

    // Strategia per FILE LOGICI (HTML, JS, CSS, JSON): Network-First
    if (isInternal) {
        event.respondWith(
            fetch(request)
                .then((fetchRes) => {
                    if (fetchRes && fetchRes.status === 200) {
                        const responseToCache = fetchRes.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return fetchRes;
                })
                .catch(() => {
                    return caches.match(request);
                })
        );
    }
});
