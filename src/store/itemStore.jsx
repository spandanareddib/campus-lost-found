// ─── itemStore — central state for FoundItems ────────────────────────────────
// Uses React context + useReducer as a Zustand-compatible pattern (no extra dep)

import { createContext, useContext, useReducer, useCallback } from 'react'
import { MOCK_FOUND_ITEMS } from '../data/mockData.js'

const ItemContext = createContext(null)

const ACTIONS = {
  ADD: 'ADD',
  UPDATE_STATUS: 'UPDATE_STATUS',
  PURGE: 'PURGE',
  BULK_PURGE: 'BULK_PURGE',
  EXTEND: 'EXTEND',
}

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD:
      return { ...state, items: [action.payload, ...state.items] }

    case ACTIONS.UPDATE_STATUS:
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, status: action.payload.status, updatedAt: new Date().toISOString() }
            : item
        ),
      }

    case ACTIONS.PURGE:
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload.id),
      }

    case ACTIONS.BULK_PURGE:
      return {
        ...state,
        items: state.items.filter((item) => !action.payload.ids.includes(item.id)),
      }

    case ACTIONS.EXTEND:
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? {
                ...item,
                expiresAt: new Date(
                  new Date(item.expiresAt).getTime() + action.payload.days * 86400000
                ).toISOString(),
              }
            : item
        ),
      }

    default:
      return state
  }
}

export function ItemProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { items: MOCK_FOUND_ITEMS })

  const addItem = useCallback((item) => dispatch({ type: ACTIONS.ADD, payload: item }), [])
  const updateStatus = useCallback((id, status) =>
    dispatch({ type: ACTIONS.UPDATE_STATUS, payload: { id, status } }), [])
  const purgeItem = useCallback((id) => dispatch({ type: ACTIONS.PURGE, payload: { id } }), [])
  const bulkPurge = useCallback((ids) => dispatch({ type: ACTIONS.BULK_PURGE, payload: { ids } }), [])
  const extendItem = useCallback((id, days = 14) =>
    dispatch({ type: ACTIONS.EXTEND, payload: { id, days } }), [])

  return (
    <ItemContext.Provider value={{ items: state.items, addItem, updateStatus, purgeItem, bulkPurge, extendItem }}>
      {children}
    </ItemContext.Provider>
  )
}

export function useItemStore() {
  const ctx = useContext(ItemContext)
  if (!ctx) throw new Error('useItemStore must be used within ItemProvider')
  return ctx
}
