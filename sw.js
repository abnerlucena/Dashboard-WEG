// ─── SERVICE WORKER — Dashboard WEG ──────────────────────────
// Estratégia: cache-first para assets estáticos, network-only para API GAS
// Para atualizar o cache: incremente o número da versão abaixo

const CACHE_NAME = 'dashboard-weg-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js',
];

// ── Install: pré-cacheia assets estáticos ────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove caches antigos ─────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: roteamento de requisições ────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Chamadas à API do Google Apps Script: sempre vai à rede (sem cache)
  // Dados de produção não devem ser servidos do cache
  if (url.hostname.includes('script.google.com')) {
    return; // navegador trata normalmente
  }

  // Assets estáticos e CDN: cache-first, fallback para rede
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Só cacheia respostas válidas
        if (response && response.ok && (response.type === 'basic' || response.type === 'cors')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline: retorna index.html para navegação (SPA fallback)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
