// ─── StatusTimeline — PRD F-06 claim status tracker ──────────────────────────

import { Check, Clock } from 'lucide-react'

const STEPS = [
  { label: 'Reported',         sublabel: 'LIR filed in registry' },
  { label: 'Matched',          sublabel: 'Found item linked to your report' },
  { label: 'Claim submitted',  sublabel: 'Your claim is in the queue' },
  { label: 'Verification',     sublabel: 'Admin reviewing your answer' },
  { label: 'Approved',         sublabel: 'Claim confirmed by security' },
  { label: 'Ready for pickup', sublabel: 'Visit Security Desk with ID' },
  { label: 'Collected',        sublabel: 'Item returned to owner' },
]

/**
 * StatusTimeline
 * @param {number} currentStep - 0-based index of active step
 * @param {boolean} compact    - condensed view (no sublabels)
 */
export default function StatusTimeline({ currentStep = 0, compact = false }) {
  return (
    <ol className="flex flex-col gap-0" aria-label="Claim status timeline">
      {STEPS.map((step, i) => {
        const done   = i < currentStep
        const active = i === currentStep
        const future = i > currentStep

        return (
          <li
            key={i}
            className={`flex items-start gap-3 py-2.5 ${i < STEPS.length - 1 ? 'border-b border-surface-subtle' : ''}`}
            aria-current={active ? 'step' : undefined}
          >
            {/* Circle */}
            <div
              className={`
                w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center
                text-[11px] font-bold mt-0.5 transition-all duration-300
                ${done   ? 'bg-success text-white'                              : ''}
                ${active ? 'bg-brand-500 text-white ring-4 ring-brand-100'      : ''}
                ${future ? 'bg-surface-muted text-ink-disabled'                 : ''}
              `}
            >
              {done ? <Check size={11} strokeWidth={3} /> : i + 1}
            </div>

            {/* Labels */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium leading-tight ${
                  active  ? 'text-brand-600' :
                  done    ? 'text-ink-secondary' :
                  'text-ink-disabled'
                }`}
              >
                {step.label}
              </p>
              {!compact && (
                <p className={`text-[11px] mt-0.5 leading-snug ${
                  active ? 'text-brand-400' : 'text-ink-disabled'
                }`}>
                  {step.sublabel}
                </p>
              )}
            </div>

            {/* Active indicator */}
            {active && (
              <Clock size={13} className="text-brand-400 flex-shrink-0 mt-1 animate-pulse" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
