// ─── LIRForm — File a Lost Item Report (PRD §3.2 Path B, F-07) ───────────────

import { useState } from 'react'
import { FileText, ChevronDown, Bell, BellOff, Check, X, Plus } from 'lucide-react'
import { SectionLabel } from '../ui/index.jsx'
import { CATEGORIES, CAMPUS_BUILDINGS } from '../../data/mockData.js'
import { getColourHex } from '../../services/utils.js'

const COLOUR_OPTIONS = [
  'black','white','grey','navy','blue','red','green',
  'yellow','orange','brown','pink','purple','silver','tan',
]

function ColourPicker({ selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOUR_OPTIONS.map((c) => {
        const active = selected.includes(c)
        return (
          <button
            key={c}
            type="button"
            onClick={() =>
              onChange(active ? selected.filter((x) => x !== c) : [...selected, c])
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-medium border transition-all ${
              active
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-surface-muted bg-surface-subtle text-ink-secondary hover:border-brand-300'
            }`}
            aria-pressed={active}
          >
            <span
              className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
              style={{ background: getColourHex(c) }}
            />
            {c}
            {active && <Check size={10} strokeWidth={3} />}
          </button>
        )
      })}
    </div>
  )
}

/**
 * LIRForm
 * @param {function} onSubmit  - called with the new LIR object
 * @param {function} onCancel  - called when the user cancels
 */
export default function LIRForm({ onSubmit, onCancel }) {
  const [description, setDescription] = useState('')
  const [category, setCategory]       = useState('')
  const [colours, setColours]         = useState([])
  const [brand, setBrand]             = useState('')
  const [building, setBuilding]       = useState('')
  const [dateFrom, setDateFrom]       = useState('')
  const [dateTo, setDateTo]           = useState('')
  const [notifyPush, setNotifyPush]   = useState(true)
  const [notifyEmail, setNotifyEmail] = useState(false)
  const [errors, setErrors]           = useState({})
  const [submitting, setSubmitting]   = useState(false)

  function validate() {
    const e = {}
    if (!description.trim() || description.trim().length < 10)
      e.description = 'Please describe your item (at least 10 characters).'
    if (!category)
      e.category = 'Please select a category.'
    if (colours.length === 0)
      e.colours = 'Please select at least one colour.'
    if (!building)
      e.building = 'Please select the last-seen building.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600)) // mock save delay

    onSubmit({
      description: description.trim(),
      structured: {
        category,
        colours,
        brand: brand.trim() || null,
        lastSeenBuilding: building,
        lastSeenDateFrom: dateFrom || null,
        lastSeenDateTo: dateTo || null,
      },
      notifications: { push: notifyPush, email: notifyEmail },
    })
  }

  const catDef = CATEGORIES.find((c) => c.value === category)

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="File a Lost Item Report">
      <div className="space-y-5">

        {/* Description */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary block mb-1.5">
            Description <span className="text-danger" aria-label="required">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: '' })) }}
            placeholder='e.g. "Black Sony headphones left in the Engineering canteen on Tuesday"'
            rows={3}
            className={`input-field resize-none ${errors.description ? 'border-danger bg-danger-bg' : ''}`}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'desc-error' : undefined}
          />
          {errors.description && (
            <p id="desc-error" className="text-xs text-danger mt-1">{errors.description}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary block mb-1.5">
            Category <span className="text-danger" aria-label="required">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => { setCategory(c.value); setErrors((p) => ({ ...p, category: '' })) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold border transition-all ${
                  category === c.value
                    ? 'bg-brand-900 text-white border-brand-900'
                    : 'bg-surface-subtle text-ink-secondary border-surface-muted hover:border-brand-300 hover:text-brand-600'
                }`}
                aria-pressed={category === c.value}
              >
                <span>{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
          {errors.category && (
            <p className="text-xs text-danger mt-1">{errors.category}</p>
          )}
        </div>

        {/* Colours */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary block mb-1.5">
            Colour(s) <span className="text-danger" aria-label="required">*</span>
          </label>
          <ColourPicker
            selected={colours}
            onChange={(c) => { setColours(c); setErrors((p) => ({ ...p, colours: '' })) }}
          />
          {errors.colours && (
            <p className="text-xs text-danger mt-1">{errors.colours}</p>
          )}
        </div>

        {/* Brand (optional) */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary block mb-1.5">
            Brand <span className="text-ink-disabled font-normal text-[10px] normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder='e.g. Sony, Adidas, Apple…'
            className="input-field"
          />
        </div>

        {/* Last-seen building */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary block mb-1.5">
            Last seen — Building <span className="text-danger" aria-label="required">*</span>
          </label>
          <select
            value={building}
            onChange={(e) => { setBuilding(e.target.value); setErrors((p) => ({ ...p, building: '' })) }}
            className={`input-field ${errors.building ? 'border-danger bg-danger-bg' : ''}`}
            aria-invalid={!!errors.building}
          >
            <option value="">Select building…</option>
            {CAMPUS_BUILDINGS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          {errors.building && (
            <p className="text-xs text-danger mt-1">{errors.building}</p>
          )}
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary block mb-1.5">
              Lost from <span className="text-ink-disabled font-normal text-[10px] normal-case">(optional)</span>
            </label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary block mb-1.5">
              Lost to <span className="text-ink-disabled font-normal text-[10px] normal-case">(optional)</span>
            </label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field" />
          </div>
        </div>

        {/* Notification preferences */}
        <div className="bg-surface-subtle rounded-inner border border-surface-muted p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary mb-3">
            Notify me via
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { id: 'push',  label: 'Push notification', desc: 'Browser / mobile alert',  value: notifyPush,  set: setNotifyPush  },
              { id: 'email', label: 'Email',             desc: 'Sent to your .ac.uk address', value: notifyEmail, set: setNotifyEmail },
            ].map(({ id, label, desc, value, set }) => (
              <label
                key={id}
                className="flex items-center gap-3 cursor-pointer group"
                htmlFor={`notif-${id}`}
              >
                <div className="relative flex-shrink-0">
                  <input
                    id={`notif-${id}`}
                    type="checkbox"
                    checked={value}
                    onChange={(e) => set(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-5 rounded-full transition-colors duration-200 ${value ? 'bg-brand-500' : 'bg-surface-muted'}`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-card absolute top-0.5 transition-all duration-200 ${value ? 'left-5' : 'left-0.5'}`}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">{label}</div>
                  <div className="text-[11px] text-ink-tertiary">{desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-outline flex-shrink-0 gap-1.5">
              <X size={14} /> Cancel
            </button>
          )}
          <button type="submit" disabled={submitting} className="btn-primary flex-1 gap-2 justify-center">
            {submitting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" /> Filing report…</>
            ) : (
              <><FileText size={15} /> File Lost Item Report</>
            )}
          </button>
        </div>

      </div>
    </form>
  )
}
