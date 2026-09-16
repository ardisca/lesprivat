// LesKu service worker — app-shell caching for offline use.
const CACHE_VERSION = 'lesku-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', (event)=>{
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache)=> cache.addAll(APP_SHELL)).then(()=> self.skipWaiting())
  );
});

self.addEventListener('activate', (event)=>{
  event.waitUntil(
    caches.keys().then((names)=>
      Promise.all(names.filter((n)=> n !== CACHE_VERSION).map((n)=> caches.delete(n)))
    ).then(()=> self.clients.claim())
  );
});

self.addEventListener('fetch', (event)=>{
  const req = event.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);

  // App-shell files: cache-first, so the app opens instantly and works offline.
  if(url.origin === self.location.origin){
    event.respondWith(
      caches.match(req).then((cached)=>{
        if(cached) return cached;
        return fetch(req).then((res)=>{
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache)=> cache.put(req, copy));
          return res;
        }).catch(()=> caches.match('./index.html'));
      })
    );
    return;
  }

  // Cross-origin (e.g. Google Fonts): network-first, fall back to cache if offline.
  event.respondWith(
    fetch(req).then((res)=>{
      const copy = res.clone();
      caches.open(CACHE_VERSION).then((cache)=> cache.put(req, copy));
      return res;
    }).catch(()=> caches.match(req))
  );
});
