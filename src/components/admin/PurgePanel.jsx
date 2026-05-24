// ─── PurgePanel — bulk purge / donate / extend expiring items (PRD §3.4 step 4)

import { useState } from 'react'
import { Trash2, Clock, CheckSquare, Square, RotateCcw, Package, AlertTriangle } from 'lucide-react'
import { SectionLabel } from '../ui/index.jsx'
import { daysUntilExpiry, timeAgo } from '../../services/utils.js'
import { CATEGORIES } from '../../data/mockData.js'

const PURGE_ACTIONS = [
  { id: 'donate',  label: 'Mark as Donated', icon: Package,   color: 'text-brand-600 bg-brand-50 border-brand-200' },
  { id: 'dispose', label: 'Dispose',          icon: Trash2,    color: 'text-danger bg-danger-bg border-danger-border/50' },
  { id: 'extend',  label: 'Extend +14 days',  icon: RotateCcw, color: 'text-success bg-success-bg border-success-border/50' },
]

/**
 * PurgePanel
 * @param {Array}    expiringItems  - items with expiresAt approaching
 * @param {function} onPurge        - (ids) => void
 * @param {function} onExtend       - (id, days) => void
 */
export default function PurgePanel({ expiringItems, onPurge, onExtend }) {
  const [selected, setSelected]   = useState(new Set())
  const [action, setAction]       = useState('dispose')
  const [confirming, setConfirming] = useState(false)
  const [done, setDone]           = useState(false)

  const sortedItems = [...expiringItems].sort(
    (a, b) => daysUntilExpiry(a.expiresAt) - daysUntilExpiry(b.expiresAt)
  )

  function toggleItem(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === sortedItems.length ? new Set() : new Set(sortedItems.map((i) => i.id))
    )
  }

  async function handleExecute() {
    setConfirming(false)
    if (action === 'extend') {
      selected.forEach((id) => onExtend?.(id, 14))
    } else {
      onPurge?.(Array.from(selected))
    }
    setSelected(new Set())
    setDone(true)
    setTimeout(() => setDone(false), 3000)
  }

  const selectedAction = PURGE_ACTIONS.find((a) => a.id === action)

  if (!sortedItems.length) {
    return (
      <div className="bento-card p-8 text-center text-ink-tertiary">
        <Clock size={32} className="mx-auto text-success mb-3" strokeWidth={1.5} />
        <p className="font-medium text-ink">No items expiring soon.</p>
      </div>
    )
  }

  return (
    <div className="bento-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-muted/60">
        <div>
          <SectionLabel>Expiry Management</SectionLabel>
          <h3 className="font-display font-semibold text-brand-900 text-lg mt-1">
            Items Approaching Expiry
          </h3>
        </div>
        {done && (
          <span className="text-xs font-bold bg-success-bg text-success border border-success-border/50 rounded-pill px-3 py-1 animate-fade-in">
            ✓ Action applied
          </span>
        )}
      </div>

      {/* Item list */}
      <div className="divide-y divide-surface-muted/40">
        {/* Select all row */}
        <div className="flex items-center gap-3 px-5 py-3 bg-surface-subtle">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-xs font-semibold text-ink-secondary hover:text-ink transition-colors"
            aria-label="Select all items"
          >
            {selected.size === sortedItems.length
              ? <CheckSquare size={16} className="text-brand-500" />
              : <Square      size={16} />}
            Select all ({sortedItems.length})
          </button>
          {selected.size > 0 && (
            <span className="text-xs text-brand-600 font-medium ml-auto">
              {selected.size} selected
            </span>
          )}
        </div>

        {sortedItems.map((item) => {
          const days   = daysUntilExpiry(item.expiresAt)
          const catDef = CATEGORIES.find((c) => c.value === item.tags.category)
          const isRed  = days <= 7
          const isAmb  = days > 7 && days <= 14

          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-surface-subtle transition-colors ${
                selected.has(item.id) ? 'bg-brand-50/50' : ''
              }`}
              onClick={() => toggleItem(item.id)}
            >
              <button
                aria-label={`Select ${item.id}`}
                className="flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); toggleItem(item.id) }}
              >
                {selected.has(item.id)
                  ? <CheckSquare size={16} className="text-brand-500" />
                  : <Square      size={16} className="text-ink-disabled" />}
              </button>

              <div className={`w-9 h-9 rounded-inner flex items-center justify-center text-lg flex-shrink-0 bg-gradient-to-br ${item.photo.blurredBg}`}>
                {item.photo.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">
                  {catDef?.label || item.tags.category}
                  {item.tags.brand ? ` · ${item.tags.brand}` : ''}
                </p>
                <p className="text-[10px] text-ink-tertiary">{item.id} · {item.location.building}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className={`text-xs font-bold ${isRed ? 'text-danger' : isAmb ? 'text-warning' : 'text-ink-tertiary'}`}>
                  {days <= 0 ? 'Expired' : `${days}d left`}
                </p>
                {isRed && (
                  <p className="text-[10px] text-danger">
                    <AlertTriangle size={9} className="inline" /> Flag red
                  </p>
                )}
                {isAmb && (
                  <p className="text-[10px] text-warning">Flag amber</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="px-5 py-4 border-t border-surface-muted/60 bg-surface-subtle animate-fade-up">
          {confirming ? (
            <div className="space-y-3">
              <p className="text-sm text-ink font-medium">
                <span className={`font-semibold ${selectedAction.color.split(' ')[0]}`}>
                  {selectedAction.label}
                </span>{' '}
                {selected.size} item{selected.size > 1 ? 's' : ''}? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={handleExecute} className="btn-primary flex-1 justify-center text-xs py-2">
                  Confirm
                </button>
                <button onClick={() => setConfirming(false)} className="btn-outline flex-1 justify-center text-xs py-2">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-medium text-ink-secondary">{selected.size} selected:</span>
              <div className="flex gap-2 flex-wrap">
                {PURGE_ACTIONS.map(({ id, label, icon: Icon, color }) => (
                  <button
                    key={id}
                    onClick={() => { setAction(id); setConfirming(true) }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-inner text-xs font-semibold border transition-all hover:brightness-95 ${color}`}
                  >
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
