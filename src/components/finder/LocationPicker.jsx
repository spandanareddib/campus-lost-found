// ─── LocationPicker — building / floor / zone selector ───────────────────────

import { useState } from 'react'
import { MapPin, Clock, ChevronLeft, Upload, Loader2, Info } from 'lucide-react'
import { CAMPUS_BUILDINGS } from '../../data/mockData.js'

const FLOORS = ['Ground Floor', 'Basement', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor +']

export default function LocationPicker({ location, setLocation, onSubmit, onBack, loading }) {
  const [showGpsNote, setShowGpsNote] = useState(false)

  function update(key, val) {
    setLocation((prev) => ({ ...prev, [key]: val }))
  }

  function useCurrentTime() {
    update('foundAt', new Date().toISOString().slice(0, 16))
  }

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="text-center mb-7">
        <div className="w-12 h-12 rounded-[14px] bg-brand-50 flex items-center justify-center mx-auto mb-3">
          <MapPin size={22} className="text-brand-500" strokeWidth={2} />
        </div>
        <h2 className="font-display font-semibold text-brand-900 text-2xl mb-1">
          Where did you find it?
        </h2>
        <p className="text-sm text-ink-tertiary leading-relaxed">
          Precise location helps owners find their item and helps admin coordinate pickup.
        </p>
      </div>

      <div className="bento-card p-5 mb-5 space-y-4">
        {/* Building */}
        <div>
          <label htmlFor="building" className="text-[11px] font-bold uppercase tracking-wider text-ink-tertiary block mb-1.5">
            Building <span className="text-danger">*</span>
          </label>
          <select
            id="building"
            value={location.building}
            onChange={(e) => update('building', e.target.value)}
            className="input-field"
          >
            {CAMPUS_BUILDINGS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Floor */}
        <div>
          <label htmlFor="floor" className="text-[11px] font-bold uppercase tracking-wider text-ink-tertiary block mb-1.5">
            Floor
          </label>
          <select
            id="floor"
            value={location.floor}
            onChange={(e) => update('floor', e.target.value)}
            className="input-field"
          >
            {FLOORS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Zone */}
        <div>
          <label htmlFor="zone" className="text-[11px] font-bold uppercase tracking-wider text-ink-tertiary block mb-1.5">
            Zone / Room
            <span className="ml-1.5 text-[10px] text-ink-disabled font-normal normal-case tracking-normal">optional</span>
          </label>
          <input
            id="zone"
            type="text"
            value={location.zone}
            onChange={(e) => update('zone', e.target.value)}
            placeholder='e.g. "Seat 14B near the window" or "by the vending machine"'
            className="input-field"
          />
        </div>

        {/* Found-at timestamp */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="foundAt" className="text-[11px] font-bold uppercase tracking-wider text-ink-tertiary">
              Found at (time)
            </label>
            <button
              type="button"
              onClick={useCurrentTime}
              className="text-[10px] text-brand-500 hover:text-brand-600 flex items-center gap-1 font-medium"
            >
              <Clock size={10} /> Set to now
            </button>
          </div>
          <input
            id="foundAt"
            type="datetime-local"
            value={location.foundAt || new Date().toISOString().slice(0, 16)}
            onChange={(e) => update('foundAt', e.target.value)}
            className="input-field"
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="text-[11px] font-bold uppercase tracking-wider text-ink-tertiary block mb-1.5">
            Additional Notes
            <span className="ml-1.5 text-[10px] text-ink-disabled font-normal normal-case tracking-normal">optional</span>
          </label>
          <textarea
            id="notes"
            value={location.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Any extra detail that might help the owner or security desk..."
            rows={2}
            className="input-field resize-none"
          />
        </div>

        {/* GPS note */}
        <div className="pt-2 border-t border-surface-subtle">
          <button
            type="button"
            onClick={() => setShowGpsNote((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] text-ink-tertiary hover:text-ink-secondary transition-colors"
          >
            <Info size={11} /> GPS coordinates
            <span className="text-[10px] text-ink-disabled">(click to learn more)</span>
          </button>
          {showGpsNote && (
            <p className="text-xs text-ink-tertiary mt-2 leading-relaxed bg-surface-subtle rounded-inner p-3">
              GPS coordinates are stored privately and are <strong>never</strong> shown to owners until after
              their claim is approved. They're used only by the security desk for item retrieval.
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-outline gap-1.5" aria-label="Back to tag review">
          <ChevronLeft size={15} /> Back
        </button>
        <button
          onClick={onSubmit}
          disabled={loading || !location.building}
          className="btn-primary flex-1 gap-2"
          aria-label="Post item to registry"
        >
          {loading
            ? <><Loader2 size={15} className="animate-spin" /> Posting…</>
            : <><Upload size={15} /> Post Item</>
          }
        </button>
      </div>
    </div>
  )
}
