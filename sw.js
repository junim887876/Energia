// Importa a SDK do OneSignal para funcionar dentro do Service Worker principal
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

const CACHE_NAME = 'solarinvest-energia-v1';

// Apenas arquivos locais essenciais (removidos CDNs e sw.js da lista fixa)
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './casa.glb',
  './logo_nova.jpg'
];

// Instalação e Cache
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(LOCAL_ASSETS).catch((err) => {
        console.warn('Aviso: Falha ao colocar arquivos no cache inicial:', err);
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

// Interceptação com estratégia Network-First e Fallback para Cache
self.addEventListener('fetch', (e) => {
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && e.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});
