// ─── notificationService — toast queue + match alert dispatcher ───────────────

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'

const NotifContext = createContext(null)

let notifId = 1

function reducer(state, action) {
  switch (action.type) {
    case 'PUSH':
      return { queue: [...state.queue, { ...action.payload, id: notifId++ }] }
    case 'DISMISS':
      return { queue: state.queue.filter((n) => n.id !== action.payload) }
    case 'CLEAR_ALL':
      return { queue: [] }
    default:
      return state
  }
}

export const NOTIF_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  MATCH: 'match',
  INFO: 'info',
  WARNING: 'warning',
}

export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { queue: [] })

  const push = useCallback((message, type = NOTIF_TYPES.INFO, duration = 4000) => {
    const id = notifId
    dispatch({ type: 'PUSH', payload: { message, notifType: type, duration } })
    if (duration > 0) {
      setTimeout(() => dispatch({ type: 'DISMISS', payload: id }), duration)
    }
    return id
  }, [])

  const dismiss = useCallback((id) => dispatch({ type: 'DISMISS', payload: id }), [])
  const clearAll = useCallback(() => dispatch({ type: 'CLEAR_ALL' }), [])

  // Shorthand helpers
  const success = useCallback((msg, dur) => push(msg, NOTIF_TYPES.SUCCESS, dur), [push])
  const error = useCallback((msg, dur) => push(msg, NOTIF_TYPES.ERROR, dur || 6000), [push])
  const match = useCallback((msg, dur) => push(msg, NOTIF_TYPES.MATCH, dur || 6000), [push])
  const info = useCallback((msg, dur) => push(msg, NOTIF_TYPES.INFO, dur), [push])
  const warning = useCallback((msg, dur) => push(msg, NOTIF_TYPES.WARNING, dur), [push])

  return (
    <NotifContext.Provider value={{ queue: state.queue, push, dismiss, clearAll, success, error, match, info, warning }}>
      {children}
    </NotifContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotifContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

// ─── ToastStack component ─────────────────────────────────────────────────────
import { X, CheckCircle2, AlertTriangle, Zap, Info } from 'lucide-react'

const TYPE_STYLES = {
  success: { bg: 'bg-success text-white', Icon: CheckCircle2 },
  error:   { bg: 'bg-danger text-white',  Icon: AlertTriangle },
  match:   { bg: 'bg-accent text-white',  Icon: Zap },
  info:    { bg: 'bg-brand-900 text-white', Icon: Info },
  warning: { bg: 'bg-warning text-white', Icon: AlertTriangle },
}

export function ToastStack() {
  const { queue, dismiss } = useNotifications()

  if (!queue.length) return null

  return (
    <div
      className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {queue.map((n) => {
        const { bg, Icon } = TYPE_STYLES[n.notifType] || TYPE_STYLES.info
        return (
          <div
            key={n.id}
            className={`flex items-center gap-3 rounded-inner shadow-modal px-5 py-3 pointer-events-auto animate-fade-up ${bg}`}
            style={{ minWidth: 280, maxWidth: 420 }}
          >
            <Icon size={16} strokeWidth={2} className="flex-shrink-0" />
            <span className="text-sm font-medium flex-1">{n.message}</span>
            <button
              onClick={() => dismiss(n.id)}
              className="opacity-60 hover:opacity-100 transition-opacity ml-1"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
