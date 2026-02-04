const CACHE_NAME = 'joker-briscola-cards-v4'; // Bump version
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

    // Gestiamo solo gli asset interni o le carte (WebP)
    // NON intercettiamo domini esterni (come Google Fonts) per evitare problemi CORS
    const isInternal = url.host === location.host;
    const isCardImage = url.pathname.includes('/assets/cards/') || url.pathname.endsWith('.webp');

    if (isInternal || isCardImage) {
        event.respondWith(
            caches.match(request).then((res) => {
                return res || fetch(request).then((fetchRes) => {
                    // Cache solo se la risposta è valida
                    if (!fetchRes || fetchRes.status !== 200 || fetchRes.type !== 'basic' && fetchRes.type !== 'cors') {
                        return fetchRes;
                    }
                    const responseToCache = fetchRes.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                    return fetchRes;
                }).catch(() => {
                    // Fallback silenzioso se il fetch fallisce (es. offline)
                    return res;
                });
            })
        );
    }
    // Se non è interno o una carta, non chiamiamo respondWith()
    // Il browser gestirà la richiesta normalmente (ottimo per i font esterni)
});
