/* ΣΧΟΛΕΙΟ 360° — Service Worker (offline app shell)
   Λειτουργεί μόνο όταν η σελίδα σερβίρεται από http(s)/localhost (όχι file://). */
const CACHE = 'sxoleio360-v3';
const SHELL = [
  './',
  './index.html',
  './schools-data.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(
      SHELL.map(u => c.add(u).catch(() => {/* αγνόησε ό,τι λείπει */}))
    ))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

/* Network-first για τα δικά μας αρχεία: όταν υπάρχει internet παίρνεις πάντα φρέσκα
   (ώστε να φαίνονται ενημερώσεις), και πέφτει στο cache μόνο όταν είσαι offline.
   Τα εξωτερικά (βιβλία/βιβλιοθήκη) πάνε κανονικά στο δίκτυο. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
