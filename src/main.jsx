import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ItemProvider } from './store/itemStore.jsx'
import { LirProvider } from './store/lirStore.jsx'
import { UserProvider } from './store/userStore.jsx'
import { NotificationProvider, ToastStack } from './services/notificationService.jsx'
import './index.css'

// ─── Service Worker — DISABLED ────────────────────────────────────────────────
// Removed to prevent stale-cache hard-refresh issues during development.
// sw.js and manifest.json are kept in /public — do NOT delete them.
// To re-enable for a production build, restore the block below.
//
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js').catch(() => {})
//   })
// }
//
// ─── One-time browser cleanup ─────────────────────────────────────────────────
// If you still get a stale SW from a previous session, run this once in DevTools:
//
//   navigator.serviceWorker.getRegistrations()
//     .then(regs => regs.forEach(r => r.unregister()))
//   caches.keys()
//     .then(keys => keys.forEach(k => caches.delete(k)))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserProvider>
      <NotificationProvider>
        <ItemProvider>
          <LirProvider>
            <App />
            <ToastStack />
          </LirProvider>
        </ItemProvider>
      </NotificationProvider>
    </UserProvider>
  </React.StrictMode>
)
