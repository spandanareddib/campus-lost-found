// ─── Service Worker — Cache-first for static assets, network-first for API ───
const CACHE_NAME = 'laf-v1'
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/favicon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  // Cache-first for same-origin static
  if (request.method === 'GET' && new URL(request.url).origin === location.origin) {
    e.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((resp) => {
          if (resp.ok) {
            const clone = resp.clone()
            caches.open(CACHE_NAME).then((c) => c.put(request, clone))
          }
          return resp
        })
      )
    )
  }
})

// ─── Push notification handler ────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'Lost & Found', {
      body: data.body || 'A match has been found for your item.',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: data.tag || 'laf-notification',
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/'))
})
