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
  const url = event.request.url;
  
  // Bloquear requisições para o diretório do Next.js
  if (url.includes('_next/')) {
    console.log('[SW] Detectado asset legado do Next.js, injetando script de recarregamento:', url);
    event.respondWith(
      new Response(
        "console.warn('Next.js asset blocked by SW, purging...'); window.location.replace('/force-refresh.html?v=' + Date.now());",
        {
          status: 200,
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        }
      )
    );
    return;
  }

  // Deixa o navegador processar as demais requisições normalmente
  return;
});
