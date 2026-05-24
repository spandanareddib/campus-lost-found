// ─── useMatchAlert — watches new items and fires match notifications ──────────

import { useEffect, useRef } from 'react'
import { findMatches } from '../services/matchEngine.js'

export function useMatchAlert({ items, lirs, onMatch }) {
  const seenIds = useRef(new Set(items.map((i) => i.id)))

  useEffect(() => {
    const newItems = items.filter((i) => !seenIds.current.has(i.id))
    newItems.forEach((item) => {
      seenIds.current.add(item.id)
      const matches = findMatches(item, lirs)
      matches.forEach(({ lir, score }) => {
        onMatch?.({ item, lir, score })
      })
    })
  }, [items, lirs, onMatch])
}
