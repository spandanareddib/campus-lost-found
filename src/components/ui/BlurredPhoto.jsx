// ─── BlurredPhoto — PRD §6.3: blurred until verificationPass + approvedAt ─────

import { useState } from 'react'
import { Lock, Eye } from 'lucide-react'

/**
 * BlurredPhoto
 * @param {string}  emoji         - fallback emoji for mock (replaces real image)
 * @param {string}  blurredBg     - tailwind gradient classes for the mock bg
 * @param {boolean} revealed      - if true, show full image (post-verification)
 * @param {string}  alt           - accessible alt text (from AI description)
 * @param {string}  className     - additional class overrides
 * @param {boolean} showLockBadge - show the lock overlay badge (default: true)
 */
export default function BlurredPhoto({
  emoji = '📦',
  blurredBg = 'from-gray-200 to-gray-300',
  revealed = false,
  alt = 'Found item photo',
  className = '',
  showLockBadge = true,
}) {
  const [isRevealing, setIsRevealing] = useState(false)

  // Trigger the reveal animation
  const handleReveal = () => {
    if (!revealed) return
    setIsRevealing(true)
  }

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${blurredBg} ${className}`}
      role="img"
      aria-label={revealed ? alt : `Blurred photo: ${alt} — verify ownership to reveal`}
    >
      {/* The item emoji / image */}
      <div
        className="w-full h-full flex items-center justify-center text-6xl transition-all duration-700 ease-out"
        style={{
          filter: revealed ? 'none' : 'blur(14px) brightness(0.88)',
          transform: revealed ? 'scale(1)' : 'scale(1.08)',
        }}
        aria-hidden="true"
      >
        {emoji}
      </div>

      {/* Lock overlay — only shown when not revealed */}
      {!revealed && showLockBadge && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/10">
          <div className="bg-white/90 backdrop-blur-sm rounded-inner px-4 py-2.5 flex items-center gap-2 shadow-card">
            <Lock size={13} className="text-ink-secondary" strokeWidth={2.5} />
            <span className="text-[11px] font-semibold text-ink-secondary whitespace-nowrap">
              Verify to reveal
            </span>
          </div>
        </div>
      )}

      {/* Reveal shimmer flash */}
      {revealed && isRevealing && (
        <div
          className="absolute inset-0 bg-white/50 animate-fade-in pointer-events-none"
          onAnimationEnd={() => setIsRevealing(false)}
        />
      )}

      {/* Revealed badge */}
      {revealed && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center gap-1 bg-success text-white text-[10px] font-bold rounded-pill px-2 py-0.5 shadow-card">
            <Eye size={9} strokeWidth={2.5} />
            Unlocked
          </span>
        </div>
      )}
    </div>
  )
}
