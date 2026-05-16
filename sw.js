// StudyDeck Service Worker
const CACHE_NAME = 'studydeck-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// インストール: アセットをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// アクティベート: 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// フェッチ: ネットワークファースト（常に最新を取得、オフライン時のみキャッシュ）
self.addEventListener('fetch', event => {
  // GAS APIとChrome拡張はスキップ
  if (
    event.request.url.includes('script.google.com') ||
    event.request.url.startsWith('chrome-extension')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).then(response => {
      // 有効なレスポンスはキャッシュを更新して返す
      if (response && response.status === 200 && response.type !== 'opaque') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      // オフライン時はキャッシュにフォールバック
      return caches.match(event.request);
    })
  );
});
