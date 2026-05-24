import { Camera } from 'lucide-react'

export default function FAB({ onClick }) {
  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center shadow-fab hover:shadow-fab-hover hover:scale-110 active:scale-95 transition-all duration-200 group"
        aria-label="Snap and upload a found item"
      >
        <Camera size={26} strokeWidth={2} className="group-hover:rotate-6 transition-transform duration-200" />
      </button>
      <span className="text-[10px] font-semibold text-ink-secondary bg-surface-card rounded-pill px-3 py-1 shadow-card whitespace-nowrap border border-surface-muted">
        Snap & Upload
      </span>
    </div>
  )
}
