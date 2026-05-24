// ─── ItemDetailModal — full item modal with Info / Claim / Timeline tabs ──────

import { useState } from 'react'
import {
  X, MapPin, Clock, User, Tag, Info,
  ShieldCheck, ListOrdered, ChevronRight,
} from 'lucide-react'
import { SectionLabel, StatusBadge, ColourDots, MatchScoreBadge } from '../ui/index.jsx'
import BlurredPhoto from '../ui/BlurredPhoto.jsx'
import ClaimForm from './ClaimForm.jsx'
import StatusTimeline from './StatusTimeline.jsx'
import { timeAgo, formatDate } from '../../services/utils.js'
import { getBestScoreForItem } from '../../services/matchEngine.js'
import { CATEGORIES } from '../../data/mockData.js'

const TABS = [
  { id: 'info',     label: 'Details',  Icon: Info         },
  { id: 'claim',    label: 'Claim',    Icon: ShieldCheck  },
  { id: 'timeline', label: 'Timeline', Icon: ListOrdered  },
]

export default function ItemDetailModal({ item, lirs, onClose }) {
  const [tab, setTab]           = useState('info')
  const [claimed, setClaimed]   = useState(false)
  const [revealed, setRevealed] = useState(false)

  const score  = getBestScoreForItem(item, lirs)
  const catDef = CATEGORIES.find((c) => c.value === item.tags.category)

  function handleClaimSuccess({ verifyResult }) {
    if (verifyResult === 'pass') setRevealed(true)
    setClaimed(true)
  }

  // Map status to timeline step
  const statusToStep = {
    UNCLAIMED: 0, MATCHED: 1, PENDING_CLAIM: 2, CLAIMED: 4, COLLECTED: 6,
  }
  const tlStep = claimed ? 4 : (statusToStep[item.status] ?? 0)

  return (
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`Found item: ${item.tags.description}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-card rounded-t-bento sm:rounded-bento shadow-modal w-full sm:max-w-lg max-h-[92vh] flex flex-col animate-fade-up">

        {/* Modal header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-surface-muted/60 flex-shrink-0">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={item.status} />
              {score >= 0.6 && <MatchScoreBadge score={score} />}
            </div>
            <h2 className="font-display font-semibold text-brand-900 text-xl mt-1.5 leading-snug">
              {catDef?.emoji} {catDef?.label || item.tags.category} Found
            </h2>
            <p className="text-[11px] font-mono text-ink-tertiary mt-0.5">{item.id}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-subtle flex items-center justify-center hover:bg-surface-muted transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 pb-0 border-b border-surface-muted/60 flex-shrink-0">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-inner border-b-2 transition-all ${
                tab === id
                  ? 'border-brand-500 text-brand-600 bg-brand-50/50'
                  : 'border-transparent text-ink-tertiary hover:text-ink'
              }`}
              aria-selected={tab === id}
              role="tab"
            >
              <Icon size={13} strokeWidth={2} />
              {label}
              {id === 'claim' && claimed && (
                <span className="w-2 h-2 rounded-full bg-success ml-0.5" />
              )}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5" role="tabpanel">

          {/* ── Details tab ── */}
          {tab === 'info' && (
            <div className="space-y-5 animate-fade-up">
              <BlurredPhoto
                emoji={item.photo.emoji}
                blurredBg={item.photo.blurredBg}
                revealed={revealed}
                alt={item.tags.description}
                className="w-full aspect-video rounded-inner"
              />

              <div className="space-y-3">
                <div>
                  <SectionLabel dot={false}>Description</SectionLabel>
                  <p className="text-sm text-ink mt-1 leading-relaxed">{item.tags.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary mb-1">Category</p>
                    <p className="text-sm font-medium text-ink">{catDef?.emoji} {catDef?.label || item.tags.category}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary mb-1">Colour(s)</p>
                    <div className="flex items-center gap-2">
                      <ColourDots colours={item.tags.colours} size="md" />
                      <span className="text-sm text-ink">{item.tags.colours.join(', ')}</span>
                    </div>
                  </div>
                  {item.tags.brand && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary mb-1">Brand</p>
                      <p className="text-sm font-medium text-ink">{item.tags.brand}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary mb-1">Condition</p>
                    <p className="text-sm font-medium text-ink capitalize">{item.tags.condition || '—'}</p>
                  </div>
                </div>

                <hr className="border-surface-muted" />

                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-ink-secondary">
                    <MapPin size={14} className="flex-shrink-0 mt-0.5 text-ink-tertiary" />
                    <span>
                      <span className="font-medium text-ink">{item.location.building}</span>
                      {item.location.floor && ` · ${item.location.floor}`}
                      {item.location.zone  && ` · ${item.location.zone}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-ink-secondary">
                    <Clock size={14} className="flex-shrink-0 text-ink-tertiary" />
                    <span>Found {timeAgo(item.createdAt)} ({formatDate(item.createdAt)})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-ink-secondary">
                    <User size={14} className="flex-shrink-0 text-ink-tertiary" />
                    <span>{item.finder.anonymous ? 'Anonymous finder' : `Found by ${item.finder.displayName}`}</span>
                  </div>
                </div>
              </div>

              {item.status === 'UNCLAIMED' && (
                <button
                  onClick={() => setTab('claim')}
                  className="btn-primary w-full justify-center gap-2"
                >
                  Claim this item <ChevronRight size={15} />
                </button>
              )}
            </div>
          )}

          {/* ── Claim tab ── */}
          {tab === 'claim' && (
            <div className="animate-fade-up">
              {item.status === 'CLAIMED' || item.status === 'COLLECTED' ? (
                <div className="py-8 text-center text-ink-tertiary">
                  <ShieldCheck size={36} className="mx-auto text-success mb-3" strokeWidth={1.5} />
                  <p className="font-medium text-ink">This item has already been claimed.</p>
                </div>
              ) : (
                <ClaimForm item={item} onSuccess={handleClaimSuccess} onClose={onClose} />
              )}
            </div>
          )}

          {/* ── Timeline tab ── */}
          {tab === 'timeline' && (
            <div className="animate-fade-up">
              <p className="text-xs text-ink-tertiary mb-4 leading-relaxed">
                Your claim progresses through these stages. You'll be notified at each transition.
              </p>
              <StatusTimeline currentStep={tlStep} />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
