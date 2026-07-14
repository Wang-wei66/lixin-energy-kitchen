// 理信能量厨房 —— Service Worker
// 关键策略：导航（页面 HTML）永远走网络 + no-store，确保刷新/更新一定能拿到最新页面，
// 绝不被缓存的旧 HTML 卡住。静态资源（图标/清单）才走缓存优先，用于离线兜底。
const CACHE = 'lixin-kitchen-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // 导航请求：始终从网络拉最新页面，不缓存、不回退旧 HTML
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(() => caches.match('index'))
    );
    return;
  }

  // 静态资源：缓存优先，离线可用
  e.respondWith(
    caches.match(e.request).then((r) =>
      r || fetch(e.request).then((resp) => {
        const cp = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, cp));
        return resp;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
