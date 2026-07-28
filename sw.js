// sw.js — кладётся РЯДОМ с index.html (в корень репозитория, тот же уровень)
// Даёт мгновенный запуск: после первого открытия приложение грузится
// из памяти телефона, без ожидания сети. Работает и офлайн.

const CACHE = 'zhizn-cache-v1';
const SHELL = ['./', './index.html'];

// Установка — кэшируем оболочку приложения
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// Активация — удаляем старые версии кэша
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Запросы — сначала из кэша (мгновенно), сеть тихо обновляет кэш в фоне
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then((cached) => {
      const fromNet = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fromNet;
    })
  );
});
