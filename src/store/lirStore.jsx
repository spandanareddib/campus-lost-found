// ─── lirStore — central state for Lost Item Reports ──────────────────────────

import { createContext, useContext, useReducer, useCallback } from 'react'
import { MOCK_LIRS } from '../data/mockData.js'

const LirContext = createContext(null)

let lirCounter = 3

function reducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return { ...state, lirs: [action.payload, ...state.lirs] }
    case 'UPDATE_STATUS':
      return {
        ...state,
        lirs: state.lirs.map((l) =>
          l.id === action.payload.id ? { ...l, status: action.payload.status } : l
        ),
      }
    case 'ADD_MATCH':
      return {
        ...state,
        lirs: state.lirs.map((l) =>
          l.id === action.payload.lirId
            ? {
                ...l,
                status: 'MATCHED',
                matches: [...l.matches, action.payload.match],
              }
            : l
        ),
      }
    case 'DELETE':
      return { ...state, lirs: state.lirs.filter((l) => l.id !== action.payload.id) }
    default:
      return state
  }
}

export function LirProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { lirs: MOCK_LIRS })

  const addLir = useCallback((lir) => {
    const newLir = {
      ...lir,
      id: `LIR-2026-${String(lirCounter++).padStart(3, '0')}`,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      matches: [],
      notifications: { push: lir.notifications?.push ?? true, email: lir.notifications?.email ?? false, sentCount: 0, lastSentAt: null },
    }
    dispatch({ type: 'ADD', payload: newLir })
    return newLir
  }, [])

  const updateLirStatus = useCallback((id, status) =>
    dispatch({ type: 'UPDATE_STATUS', payload: { id, status } }), [])

  const addMatch = useCallback((lirId, match) =>
    dispatch({ type: 'ADD_MATCH', payload: { lirId, match } }), [])

  const deleteLir = useCallback((id) =>
    dispatch({ type: 'DELETE', payload: { id } }), [])

  return (
    <LirContext.Provider value={{ lirs: state.lirs, addLir, updateLirStatus, addMatch, deleteLir }}>
      {children}
    </LirContext.Provider>
  )
}

export function useLirStore() {
  const ctx = useContext(LirContext)
  if (!ctx) throw new Error('useLirStore must be used within LirProvider')
  return ctx
}
