// ============================================================
// Service Worker: オフライン対応のためのキャッシュ管理
// アプリのファイルを更新したら CACHE_VERSION を上げること
// ============================================================
const CACHE_VERSION = "dokusho-quest-daidai-v2";

// インストール時にキャッシュするアプリ本体のファイル
const APP_ASSETS = [
  "./",
  "./index.html",
  "./data.js",
  "./storage.js",
  "./components.js",
  "./app.js",
  "./circle.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // ページ本体は「ネット優先」:更新がすぐ反映され、オフライン時はキャッシュで動く
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html")),
    );
    return;
  }

  // その他(JS・画像・CDN)は「キャッシュ優先」:2回目以降の起動が速く、オフラインでも動く
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // 正常応答(CDNのopaque応答も含む)をキャッシュに保存
        if (response.status === 200 || response.type === "opaque") {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
