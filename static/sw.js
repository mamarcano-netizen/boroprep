const CACHE_NAME = "boroprep-v1";
const APP_SHELL = [
  "/",
  "/dashboard",
  "/study",
  "/exam",
  "/static/style.css",
  "/static/app.js",
  "/static/videos.js",
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BoroPrep — Offline</title>
  <style>
    body { font-family: sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px; }
    .box { background: white; border-radius: 16px; padding: 40px 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); max-width: 360px; }
    h2 { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
    p { color: #64748b; font-size: 0.95rem; line-height: 1.6; }
    .icon { font-size: 3rem; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">📡</div>
    <h2>You're offline</h2>
    <p>But your last quiz is still available! Connect to the internet to keep studying.</p>
  </div>
</body>
</html>`;

// ── Install: cache app shell ──────────────────────────────────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache each item individually — don't fail the whole install if one 404s
      return Promise.allSettled(APP_SHELL.map(url => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch strategy ────────────────────────────────────────────────────────────
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Network-first for API calls
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: "offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Cache-first for static assets
  if (url.pathname.startsWith("/static/")) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // Network-first for navigation (pages), fallback to offline page
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then(cached =>
          cached || new Response(OFFLINE_HTML, {
            status: 200,
            headers: { "Content-Type": "text/html" },
          })
        )
      )
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(event.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
      }
      return res;
    }).catch(() => caches.match(event.request))
  );
});

// Push notification handler
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || '📚 BoroPrep Study Time!', {
      body: data.body || "Your Regents exam is coming up. Quick 5-minute quiz? 🔥",
      icon: '/static/icon-192.png',
      badge: '/static/icon-192.png',
      tag: 'study-reminder',
      renotify: true,
      data: { url: data.url || '/study' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/study'));
});
