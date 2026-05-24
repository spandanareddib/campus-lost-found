// ─── SubmitConfirmation — success screen after posting a found item ───────────

import { CheckCircle2, Zap, Home, Camera, QrCode, Share2 } from 'lucide-react'

export default function SubmitConfirmation({ itemId, matchedLirs, onDone, onUploadAnother }) {
  return (
    <div className="animate-scale-in text-center">
      {/* Success icon */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="w-24 h-24 rounded-full bg-success-bg flex items-center justify-center">
          <CheckCircle2 size={44} className="text-success" strokeWidth={1.5} />
        </div>
        {matchedLirs.length > 0 && (
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center border-2 border-white">
            <Zap size={14} className="text-white" strokeWidth={2.5} />
          </div>
        )}
      </div>

      <h2 className="font-display font-semibold text-brand-900 text-3xl mb-2">
        Item posted!
      </h2>
      <p className="text-sm text-ink-tertiary mb-5 max-w-sm mx-auto leading-relaxed">
        Your find is now live in the campus registry. You're a campus hero!
      </p>

      {/* Item ID badge */}
      <div className="inline-flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-inner px-5 py-3 mb-6">
        <QrCode size={20} className="text-brand-400 flex-shrink-0" />
        <div className="text-left">
          <div className="text-[10px] font-bold uppercase tracking-widest text-brand-400">Item ID</div>
          <div className="font-mono text-base font-bold text-brand-700">{itemId}</div>
        </div>
      </div>

      {/* Match alert */}
      {matchedLirs.length > 0 && (
        <div className="bento-card bg-gradient-to-br from-accent-light via-white to-surface-card border-accent/25 p-5 mb-6 text-left animate-fade-up">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-accent flex items-center justify-center flex-shrink-0 shadow-fab">
              <Zap size={18} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="font-semibold text-accent text-sm mb-1">
                ⚡ {matchedLirs.length} match{matchedLirs.length > 1 ? 'es' : ''} found!
              </p>
              <p className="text-xs text-ink-secondary leading-relaxed">
                This item matched {matchedLirs.length} open Lost Item Report{matchedLirs.length > 1 ? 's' : ''}.
                {' '}The owner{matchedLirs.length > 1 ? 's have' : ' has'} been notified with a{' '}
                <strong>{Math.round(matchedLirs[0].score * 100)}% confidence</strong> match.
              </p>
              {matchedLirs.map(({ lir, score }) => (
                <div key={lir.id} className="mt-2 flex items-center gap-2 text-xs text-ink-tertiary">
                  <span className="font-mono">{lir.id}</span>
                  <span className="w-1 h-1 rounded-full bg-ink-disabled" />
                  <span className="font-semibold text-accent">{Math.round(score * 100)}% match</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* What happens next */}
      <div className="bento-card p-4 mb-6 text-left">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-tertiary mb-3">What happens next</p>
        <div className="space-y-2.5">
          {[
            { icon: '🔍', text: 'Item is immediately searchable by owners' },
            { icon: '🔔', text: 'We\'ll notify you if anyone claims it as yours' },
            { icon: '🏛️', text: 'Security desk will physically log the item' },
            { icon: '📅', text: 'Items are held for 30 days before disposal' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-2.5">
              <span className="text-base leading-none mt-0.5">{icon}</span>
              <p className="text-xs text-ink-secondary leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button onClick={onDone} className="btn-primary w-full justify-center gap-2">
          <Home size={15} /> Back to Dashboard
        </button>
        <button onClick={onUploadAnother} className="btn-outline w-full justify-center gap-2">
          <Camera size={15} /> Upload another item
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: 'Found item logged', text: `Item ${itemId} has been logged on the campus Lost & Found registry.` })
            }
          }}
          className="btn-ghost w-full justify-center gap-2 text-xs"
        >
          <Share2 size={13} /> Share this find
        </button>
      </div>
    </div>
  )
}
