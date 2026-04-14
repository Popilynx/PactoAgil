var CACHE_VERSION = 'v2';
var CACHE_NAME = 'pacto-agil-' + CACHE_VERSION;

self.addEventListener('install', function(event) {
  console.log('[SW] Instalando nova versão do cache:', CACHE_NAME);
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Ativando nova versão e limpando caches antigos');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache absoluto:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      // Força o SW a tomar controle de todas as abas abertas imediatamente
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  // Deixa o Next.js gerenciar seus próprios chunks
  return;
});
