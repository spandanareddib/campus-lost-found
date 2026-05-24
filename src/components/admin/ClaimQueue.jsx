// ─── ClaimQueue — admin claim review with side panel (PRD §3.4 step 3) ───────

import { useState } from 'react'
import { Check, X, Eye, EyeOff, Clock, User, MapPin, AlertTriangle } from 'lucide-react'
import { SectionLabel, StatusBadge, ColourDots } from '../ui/index.jsx'
import BlurredPhoto from '../ui/BlurredPhoto.jsx'
import { timeAgo } from '../../services/utils.js'
import { CATEGORIES } from '../../data/mockData.js'

/**
 * ClaimQueue
 * @param {Array}    pendingItems   - items with PENDING_CLAIM status
 * @param {function} onApprove      - (itemId) => void
 * @param {function} onReject       - (itemId) => void
 */
export default function ClaimQueue({ pendingItems, onApprove, onReject }) {
  const [selectedId, setSelectedId] = useState(pendingItems[0]?.id || null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [actionMap, setActionMap]   = useState({})

  const selected = pendingItems.find((i) => i.id === selectedId)
  const catDef   = selected ? CATEGORIES.find((c) => c.value === selected.tags.category) : null

  function handleApprove(id) {
    setActionMap((p) => ({ ...p, [id]: 'approved' }))
    onApprove(id)
    // Auto-advance to next pending
    const next = pendingItems.find((i) => i.id !== id && !actionMap[i.id])
    if (next) setSelectedId(next.id)
  }

  function handleReject(id) {
    setActionMap((p) => ({ ...p, [id]: 'rejected' }))
    onReject(id)
    const next = pendingItems.find((i) => i.id !== id && !actionMap[i.id])
    if (next) setSelectedId(next.id)
  }

  if (!pendingItems.length) {
    return (
      <div className="bento-card p-8 text-center text-ink-tertiary">
        <Check size={32} className="mx-auto text-success mb-3" strokeWidth={1.5} />
        <p className="font-medium text-ink">All claims reviewed — queue is clear.</p>
      </div>
    )
  }

  return (
    <div className="bento-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-muted/60">
        <div>
          <SectionLabel>Claim Queue</SectionLabel>
          <h3 className="font-display font-semibold text-brand-900 text-lg mt-1">
            Pending Review
          </h3>
        </div>
        <span className="text-xs font-bold bg-warning-bg text-warning border border-warning-border/50 rounded-pill px-3 py-1">
          {pendingItems.filter((i) => !actionMap[i.id]).length} remaining
        </span>
      </div>

      <div className="flex" style={{ minHeight: 400 }}>
        {/* Left: item list */}
        <div className="w-56 border-r border-surface-muted/60 flex flex-col overflow-y-auto flex-shrink-0">
          {pendingItems.map((item) => {
            const action = actionMap[item.id]
            const cat = CATEGORIES.find((c) => c.value === item.tags.category)
            return (
              <button
                key={item.id}
                onClick={() => { setSelectedId(item.id); setShowAnswer(false) }}
                className={`flex items-center gap-2.5 px-4 py-3 text-left border-b border-surface-muted/40 transition-colors ${
                  selectedId === item.id ? 'bg-brand-50' : 'hover:bg-surface-subtle'
                }`}
              >
                <div className={`w-8 h-8 rounded-inner flex items-center justify-center text-base flex-shrink-0 bg-gradient-to-br ${item.photo.blurredBg}`}>
                  {item.photo.emoji}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink truncate">{cat?.label || item.tags.category}</p>
                  <p className="text-[10px] text-ink-tertiary truncate">{item.id}</p>
                </div>
                {action && (
                  <span className={`ml-auto flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                    action === 'approved' ? 'bg-success' : 'bg-danger'
                  }`}>
                    {action === 'approved'
                      ? <Check size={9} strokeWidth={3} className="text-white" />
                      : <X    size={9} strokeWidth={3} className="text-white" />}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Right: claim detail */}
        {selected ? (
          <div className="flex-1 p-5 overflow-y-auto">
            <div className="flex gap-4 mb-5">
              <BlurredPhoto
                emoji={selected.photo.emoji}
                blurredBg={selected.photo.blurredBg}
                revealed
                alt={selected.tags.description}
                className="w-28 h-28 rounded-inner flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <StatusBadge status={selected.status} />
                </div>
                <p className="text-sm font-medium text-ink leading-snug mb-2">{selected.tags.description}</p>
                <div className="space-y-1 text-xs text-ink-secondary">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={11} className="text-ink-tertiary" />
                    {selected.location.building}, {selected.location.floor}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-ink-tertiary" />
                    Found {timeAgo(selected.createdAt)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={11} className="text-ink-tertiary" />
                    {selected.finder.displayName}
                  </div>
                </div>
              </div>
            </div>

            {/* Verification answer reveal */}
            <div className="bg-surface-subtle border border-surface-muted rounded-inner p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-tertiary">
                  Verification Q&A
                </p>
                <button
                  onClick={() => setShowAnswer((p) => !p)}
                  className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600"
                  aria-label={showAnswer ? 'Hide answer' : 'Reveal answer'}
                >
                  {showAnswer ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showAnswer ? 'Hide' : 'Reveal'}
                </button>
              </div>
              <p className="text-sm text-ink mb-1.5">
                <span className="font-medium">Q:</span> {selected.tags.verificationQuestion}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink font-medium">A:</span>
                {showAnswer ? (
                  <span className="text-sm text-success font-semibold bg-success-bg rounded px-2 py-0.5">
                    {selected.tags.verificationAnswer}
                  </span>
                ) : (
                  <span className="text-sm text-ink-disabled bg-surface-muted rounded px-8 py-0.5 select-none tracking-widest">
                    ●●●●●●
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            {actionMap[selected.id] ? (
              <div className={`flex items-center gap-2 py-3 px-4 rounded-inner ${
                actionMap[selected.id] === 'approved'
                  ? 'bg-success-bg text-success border border-success-border/50'
                  : 'bg-danger-bg text-danger border border-danger-border/50'
              }`}>
                {actionMap[selected.id] === 'approved'
                  ? <Check size={16} strokeWidth={2.5} />
                  : <X    size={16} strokeWidth={2.5} />}
                <span className="text-sm font-semibold">
                  {actionMap[selected.id] === 'approved' ? 'Claim approved' : 'Claim rejected'}
                </span>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selected.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-inner bg-success-bg text-success border border-success-border/50 text-sm font-semibold hover:brightness-95 transition-all"
                >
                  <Check size={15} strokeWidth={2.5} /> Approve
                </button>
                <button
                  onClick={() => handleReject(selected.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-inner bg-danger-bg text-danger border border-danger-border/50 text-sm font-semibold hover:brightness-95 transition-all"
                >
                  <X size={15} strokeWidth={2.5} /> Reject
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-ink-tertiary text-sm">
            Select a claim to review
          </div>
        )}
      </div>
    </div>
  )
}
