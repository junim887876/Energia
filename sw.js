// Importa a SDK do OneSignal para funcionar dentro do Service Worker principal
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

const CACHE_NAME = 'solarinvest-energia-v3';

// Lista completa com arquivos locais e dependências externas (CDN) necessárias para o modo offline
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './casa.glb',
  './logo_nova.jpg',
  './Improve_video_quality_20261008170930.mp4',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
  'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
];

// Instalação e Cache Inicial
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(LOCAL_ASSETS).catch((err) => {
        console.warn('Aviso: Falha ao colocar alguns arquivos no cache inicial:', err);
      });
    })
  );
});

// Ativação e Limpeza de Caches Antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação com estratégia Cache-First e Network Fallback
self.addEventListener('fetch', (e) => {
  if (!e.request.url.startsWith('http')) return;

  // Ignora requisições diretas de API externas
  if (e.request.url.includes('docs.google.com') || e.request.url.includes('onesignal.com/api')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && e.request.method === 'GET') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
