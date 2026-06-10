// Service worker планировщика.
// Стратегия: сначала сеть (чтобы обновления с GitHub подтягивались сразу),
// при отсутствии сети — копия из кэша. Так приложение работает полностью офлайн.
const CACHE = 'lifeapp-v2';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['./', './index.html'])).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        // Успешный ответ кладём в кэш — это будет офлайн-копия
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        return resp;
      })
      .catch(() =>
        // Сети нет — отдаём из кэша; для навигации запасной вариант index.html
        caches.match(e.request).then(m => m || caches.match('./index.html'))
      )
  );
});
