import { useState, useCallback } from 'react'
import Navbar from './components/ui/Navbar.jsx'
import FAB from './components/ui/FAB.jsx'
import HomePage from './pages/Home.jsx'
import FinderUploadPage from './pages/FinderUpload.jsx'
import OwnerSearchPage from './pages/OwnerSearch.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import LoginPage from './pages/Login.jsx'
import { useItemStore } from './store/itemStore.jsx'
import { useLirStore } from './store/lirStore.jsx'
import { useUserStore } from './store/userStore.jsx'
import { useNotifications } from './services/notificationService.jsx'
import { useMatchAlert } from './hooks/useMatchAlert.js'

export default function App() {
  const [page, setPage] = useState('home')
  const { items, addItem } = useItemStore()
  const { lirs, addLir }   = useLirStore()
  const { user, isAuthenticated } = useUserStore()
  const { match: notifyMatch, success: notifySuccess } = useNotifications()

  const hasMatch = lirs.some((l) => l.status === 'MATCHED')

  // Fire toast whenever a new item matches an open LIR
  useMatchAlert({
    items,
    lirs,
    onMatch: useCallback(({ item, lir, score }) => {
      notifyMatch(
        `⚡ Match! "${item.tags.description}" → LIR ${lir.id} (${Math.round(score * 100)}% confidence)`
      )
    }, [notifyMatch]),
  })

  const handleAddItem = useCallback((newItem) => {
    addItem(newItem)
    notifySuccess('Item posted to registry!')
  }, [addItem, notifySuccess])

  // Show login if not authenticated
  if (!isAuthenticated) return <LoginPage />

  return (
    <div className="min-h-screen bg-surface">
      <Navbar page={page} setPage={setPage} hasMatch={hasMatch} />

      <main>
        {page === 'home'   && <HomePage          setPage={setPage} items={items} lirs={lirs} />}
        {page === 'upload' && <FinderUploadPage  setPage={setPage} addItem={handleAddItem} lirs={lirs} />}
        {page === 'search' && <OwnerSearchPage   items={items} lirs={lirs} addLir={addLir} />}
        {page === 'admin'  && <AdminDashboard    items={items} />}
      </main>

      {page !== 'upload' && <FAB onClick={() => setPage('upload')} />}
    </div>
  )
}
