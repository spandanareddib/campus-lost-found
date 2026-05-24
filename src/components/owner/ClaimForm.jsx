// ─── ClaimForm — verification gate + claim submission (PRD §3.3) ─────────────

import { useState } from 'react'
import { Lock, Check, AlertTriangle, Send, ShieldCheck } from 'lucide-react'
import BlurredPhoto from '../ui/BlurredPhoto.jsx'
import StatusTimeline from './StatusTimeline.jsx'

/**
 * ClaimForm
 * @param {object}   item        - the FoundItem being claimed
 * @param {function} onSuccess   - called with { verifyResult } on submission
 * @param {function} onClose     - called to close the parent modal
 */
export default function ClaimForm({ item, onSuccess, onClose }) {
  const [answer, setAnswer]               = useState('')
  const [verifyResult, setVerifyResult]   = useState(null) // null | 'pass' | 'fail'
  const [submitted, setSubmitted]         = useState(false)
  const [submitting, setSubmitting]       = useState(false)
  const [routedToAdmin, setRoutedToAdmin] = useState(false)

  const isCorrect = answer.trim().toLowerCase() === item.tags.verificationAnswer?.toLowerCase()

  async function handleVerify(e) {
    e.preventDefault()
    if (!answer.trim()) return
    setSubmitting(true)

    // Simulate a short server round-trip
    await new Promise((r) => setTimeout(r, 700))

    if (isCorrect) {
      setVerifyResult('pass')
      await new Promise((r) => setTimeout(r, 500))
      setSubmitted(true)
      onSuccess?.({ verifyResult: 'pass' })
    } else {
      setVerifyResult('fail')
    }
    setSubmitting(false)
  }

  async function handleManualReview() {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    setRoutedToAdmin(true)
    setSubmitted(true)
    onSuccess?.({ verifyResult: 'manual' })
    setSubmitting(false)
  }

  // ── Post-submission view ──
  if (submitted) {
    const timelineStep = routedToAdmin ? 3 : 4 // Verification vs Approved
    return (
      <div className="animate-scale-in space-y-5">
        <div className="flex items-center justify-center gap-2 py-4 bg-success-bg rounded-inner border border-success-border/50">
          <ShieldCheck size={20} className="text-success flex-shrink-0" />
          <p className="text-sm font-semibold text-success">
            {routedToAdmin ? 'Sent for admin review' : 'Claim submitted — verification passed!'}
          </p>
        </div>

        <BlurredPhoto
          emoji={item.photo.emoji}
          blurredBg={item.photo.blurredBg}
          revealed={!routedToAdmin}
          alt={item.tags.description}
          className="w-full aspect-square rounded-inner"
        />

        {!routedToAdmin && (
          <div className="bg-brand-50 border border-brand-200/50 rounded-inner p-3 text-xs text-brand-700">
            <strong>Next step:</strong> Visit the Security Desk with your student ID to collect your item.
          </div>
        )}
        {routedToAdmin && (
          <div className="bg-warning-bg border border-warning-border/50 rounded-inner p-3 text-xs text-warning">
            An admin will review your answer and contact you within 24 hours.
          </div>
        )}

        <div className="pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary mb-3">
            Claim status
          </p>
          <StatusTimeline currentStep={timelineStep} compact />
        </div>

        <button onClick={onClose} className="btn-outline w-full justify-center text-sm">
          Close
        </button>
      </div>
    )
  }

  // ── Verification gate ──
  return (
    <form onSubmit={handleVerify} noValidate className="space-y-4" aria-label="Ownership verification">

      {/* Blurred photo */}
      <BlurredPhoto
        emoji={item.photo.emoji}
        blurredBg={item.photo.blurredBg}
        revealed={false}
        alt={item.tags.description}
        className="w-full aspect-square rounded-inner"
      />

      {/* Verification gate card */}
      <div className="bg-brand-50 border border-brand-200/50 rounded-inner p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lock size={13} className="text-brand-500" strokeWidth={2.5} />
          <span className="text-xs font-bold uppercase tracking-wide text-brand-600">
            Ownership verification
          </span>
        </div>

        <p className="text-sm font-medium text-ink mb-3 leading-snug">
          {item.tags.verificationQuestion}
        </p>

        <input
          type="text"
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value)
            if (verifyResult === 'fail') setVerifyResult(null)
          }}
          placeholder="Your answer…"
          autoFocus
          className={`input-field text-sm transition-colors ${
            verifyResult === 'pass' ? 'border-success bg-success-bg' :
            verifyResult === 'fail' ? 'border-danger  bg-danger-bg'  : ''
          }`}
          aria-invalid={verifyResult === 'fail'}
          aria-describedby={verifyResult === 'fail' ? 'verify-err' : undefined}
        />

        {/* Pass feedback */}
        {verifyResult === 'pass' && (
          <p className="text-xs text-success mt-2 flex items-center gap-1.5 font-medium">
            <Check size={12} strokeWidth={3} /> Correct — submitting claim…
          </p>
        )}

        {/* Fail feedback */}
        {verifyResult === 'fail' && (
          <div id="verify-err" className="mt-2">
            <p className="text-xs text-danger flex items-center gap-1.5 font-medium">
              <AlertTriangle size={12} /> Incorrect answer.
            </p>
            <button
              type="button"
              onClick={handleManualReview}
              disabled={submitting}
              className="mt-2 text-xs text-ink-secondary underline hover:text-ink transition-colors"
            >
              Submit for manual admin review instead →
            </button>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!answer.trim() || submitting || verifyResult === 'pass'}
        className="btn-primary w-full justify-center gap-2"
      >
        {submitting ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" /> Checking…</>
        ) : (
          <><Lock size={14} /> Submit Claim</>
        )}
      </button>

    </form>
  )
}
