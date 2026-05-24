import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ItemProvider } from './store/itemStore.jsx'
import { LirProvider } from './store/lirStore.jsx'
import { UserProvider } from './store/userStore.jsx'
import { NotificationProvider, ToastStack } from './services/notificationService.jsx'
import './index.css'

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
