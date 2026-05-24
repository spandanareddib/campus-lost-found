import { X } from 'lucide-react'
import { confidenceClass, getColourHex, statusClass, statusLabel } from '../../services/utils.js'

// ─── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  return (
    <span className={statusClass(status)}>
      {statusLabel(status)}
    </span>
  )
}

// ─── ColourDots ───────────────────────────────────────────────────────────────
export function ColourDots({ colours, size = 'sm' }) {
  const dotSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
  return (
    <div className="flex items-center gap-1">
      {colours.map((c, i) => (
        <div
          key={i}
          className={`${dotSize} rounded-full border border-black/10 flex-shrink-0`}
          style={{ background: getColourHex(c) }}
          title={c}
        />
      ))}
    </div>
  )
}

// ─── TagChip ──────────────────────────────────────────────────────────────────
export function TagChip({ tag, onRemove, delay = 0 }) {
  const cls = confidenceClass(tag.confidence)
  return (
    <span
      className={`${cls} stagger-${Math.min(delay, 6)}`}
      style={{ animationDelay: `${delay * 60}ms` }}
    >
      <span className="leading-none">{tag.label}</span>
      {onRemove && (
        <button
          onClick={() => onRemove(tag.id)}
          className="opacity-50 hover:opacity-100 transition-opacity ml-0.5 -mr-0.5"
          aria-label={`Remove ${tag.label}`}
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </span>
  )
}

// ─── ConfidenceDot ────────────────────────────────────────────────────────────
export function ConfidenceDot({ confidence }) {
  const color =
    confidence >= 0.8
      ? 'bg-success animate-pulse-dot'
      : confidence >= 0.5
      ? 'bg-warning animate-pulse-dot'
      : 'bg-danger animate-pulse-dot'
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
export function SectionLabel({ children, dot = true }) {
  return (
    <div className="section-label">
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-brand-400 inline-block" />}
      {children}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

// ─── MatchScoreBadge ──────────────────────────────────────────────────────────
export function MatchScoreBadge({ score }) {
  if (score < 0.6) return null
  const color =
    score >= 0.85
      ? 'bg-success-bg text-success border-success-border/50'
      : score >= 0.7
      ? 'bg-brand-50 text-brand-600 border-brand-200/50'
      : 'bg-warning-bg text-warning border-warning-border/50'
  const label =
    score >= 0.85 ? 'Strong match' : score >= 0.7 ? 'Good match' : 'Possible match'
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label} {Math.round(score * 100)}%
    </span>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-surface-subtle flex items-center justify-center mb-4">
        <Icon size={24} className="text-ink-tertiary" />
      </div>
      <p className="font-display font-semibold text-ink-secondary text-lg mb-1">{title}</p>
      <p className="text-sm text-ink-tertiary max-w-xs">{subtitle}</p>
    </div>
  )
}

// ─── NotificationToast ────────────────────────────────────────────────────────
export function NotificationToast({ message, type = 'info', onClose }) {
  const styles = {
    info: 'bg-brand-900 text-white',
    success: 'bg-success text-white',
    match: 'bg-accent text-white',
  }
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-up flex items-center gap-3 rounded-inner shadow-modal px-5 py-3 ${styles[type]}`}>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  )
}
