/* MecaLIK Service Worker — Push Notifications */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

self.addEventListener('push', event => {
  let data = { title: 'MecaLIK', body: 'Vous avez une mise à jour.', url: '/' }

  try {
    data = event.data.json()
  } catch {
    data.body = event.data?.text() || data.body
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      data: { url: data.url },
      requireInteraction: false,
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        const existing = windowClients.find(w =>
          w.url.startsWith(self.registration.scope)
        )
        if (existing) {
          existing.focus()
          return existing.navigate(url)
        }
        return self.clients.openWindow(url)
      })
  )
})
