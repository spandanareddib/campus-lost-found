// ─── TagReview — editable AI tag chips with confidence colours ────────────────

import { useState } from 'react'
import { Plus, X, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, Info } from 'lucide-react'
import { TagChip, SectionLabel } from '../ui/index.jsx'
import { confidenceClass } from '../../services/utils.js'

const GROUP_ORDER = ['category', 'colour', 'brand', 'condition', 'description', 'custom']
const GROUP_LABELS = {
  category: 'Category',
  colour: 'Colour',
  brand: 'Brand',
  condition: 'Condition',
  description: 'Description',
  custom: 'Custom',
}
const MANDATORY_GROUPS = ['category', 'colour']

export default function TagReview({ imagePreview, tags, setTags, onNext, onBack }) {
  const [newTag, setNewTag] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  const hasCat = tags.some((t) => t.key === 'category')
  const hasColour = tags.some((t) => t.key === 'colour')
  const canPost = hasCat && hasColour

  function removeTag(id) {
    setTags((prev) => prev.filter((t) => t.id !== id))
  }

  function startEdit(tag) {
    setEditingId(tag.id)
    setEditValue(tag.label)
  }

  function commitEdit(id) {
    if (!editValue.trim()) { setEditingId(null); return }
    setTags((prev) =>
      prev.map((t) => t.id === id ? { ...t, label: editValue.trim(), value: editValue.trim() } : t)
    )
    setEditingId(null)
  }

  function addCustomTag(e) {
    e.preventDefault()
    const val = newTag.trim().slice(0, 30)
    if (!val) return
    setTags((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, key: 'custom', label: val, value: val, confidence: 1, mandatory: false },
    ])
    setNewTag('')
    setShowAdd(false)
  }

  const grouped = GROUP_ORDER.map((key) => ({
    key, label: GROUP_LABELS[key],
    items: tags.filter((t) => t.key === key),
    mandatory: MANDATORY_GROUPS.includes(key),
  })).filter((g) => g.items.length > 0 || g.mandatory)

  const lowConfidenceTags = tags.filter((t) => t.confidence < 0.5)

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="flex gap-4 mb-6">
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Found item"
            className="w-28 h-28 rounded-inner object-cover flex-shrink-0 border border-surface-muted"
          />
        ) : (
          <div className="w-28 h-28 rounded-inner bg-surface-subtle flex items-center justify-center text-4xl flex-shrink-0">
            🎒
          </div>
        )}
        <div className="flex-1 min-w-0">
          <SectionLabel>AI Tag Review</SectionLabel>
          <h2 className="font-display font-semibold text-brand-900 text-xl mt-1 mb-1.5">
            Review & confirm tags
          </h2>
          <p className="text-xs text-ink-tertiary leading-relaxed">
            Tap any tag to rename it. Press × to remove. Add custom tags with the + button.
          </p>
        </div>
      </div>

      {/* Confidence legend */}
      <div className="flex items-center gap-4 bg-surface-subtle rounded-inner px-4 py-2.5 mb-4 text-xs">
        <span className="flex items-center gap-1.5 text-success font-medium">
          <span className="w-2 h-2 rounded-full bg-success" /> High (≥ 80%)
        </span>
        <span className="flex items-center gap-1.5 text-warning font-medium">
          <span className="w-2 h-2 rounded-full bg-warning" /> Check (50–80%)
        </span>
        <span className="flex items-center gap-1.5 text-danger font-medium">
          <span className="w-2 h-2 rounded-full bg-danger" /> Low (&lt; 50%)
        </span>
      </div>

      {/* Low-confidence alert */}
      {lowConfidenceTags.length > 0 && (
        <div className="flex items-start gap-2.5 bg-warning-bg border border-warning-border/50 rounded-inner p-3 mb-4">
          <AlertTriangle size={14} className="text-warning mt-0.5 flex-shrink-0" />
          <p className="text-xs text-warning font-medium">
            {lowConfidenceTags.length} tag{lowConfidenceTags.length > 1 ? 's are' : ' is'} flagged for review.
            Please verify or remove them before posting.
          </p>
        </div>
      )}

      {/* Tag groups */}
      <div className="bento-card p-5 mb-4 space-y-5">
        {grouped.map(({ key, label, items, mandatory }) => (
          <div key={key}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">
                {label}
              </span>
              {mandatory && <span className="text-danger text-xs leading-none">*</span>}
              {mandatory && items.length === 0 && (
                <span className="text-[10px] text-danger font-medium ml-1">Required</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 min-h-[28px]">
              {items.map((tag, i) => (
                <div key={tag.id}>
                  {editingId === tag.id ? (
                    <form
                      onSubmit={(e) => { e.preventDefault(); commitEdit(tag.id) }}
                      className="flex items-center"
                    >
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(tag.id)}
                        maxLength={30}
                        className={`text-sm font-medium rounded-pill px-3 py-1 border-2 outline-none ${
                          tag.confidence >= 0.8
                            ? 'border-success bg-success-bg text-success'
                            : tag.confidence >= 0.5
                            ? 'border-warning bg-warning-bg text-warning'
                            : 'border-danger bg-danger-bg text-danger'
                        }`}
                        style={{ width: Math.max(80, editValue.length * 9) }}
                      />
                    </form>
                  ) : (
                    <div className="flex items-center">
                      <span
                        className={`${confidenceClass(tag.confidence)} cursor-text animate-tag-pop`}
                        style={{ animationDelay: `${i * 55}ms` }}
                        onClick={() => startEdit(tag)}
                        title="Click to rename"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && startEdit(tag)}
                      >
                        {tag.label}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeTag(tag.id) }}
                          className="opacity-50 hover:opacity-100 transition-opacity ml-1"
                          aria-label={`Remove ${tag.label} tag`}
                        >
                          <X size={10} strokeWidth={2.5} />
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {items.length === 0 && mandatory && (
                <span className="text-xs text-ink-disabled italic">None — please add one</span>
              )}
            </div>
          </div>
        ))}

        {/* Add custom tag */}
        <div className="pt-4 border-t border-surface-subtle">
          {showAdd ? (
            <form onSubmit={addCustomTag} className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                maxLength={30}
                placeholder="Custom tag (max 30 chars)"
                className="input-field text-sm flex-1"
                aria-label="Custom tag text"
              />
              <button type="submit" className="btn-primary text-xs px-3 py-2">Add</button>
              <button
                type="button"
                onClick={() => { setShowAdd(false); setNewTag('') }}
                className="btn-ghost text-xs px-3 py-2"
                aria-label="Cancel"
              >
                <X size={13} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
            >
              <Plus size={13} /> Add custom tag
            </button>
          )}
        </div>
      </div>

      {/* Validation warning */}
      {(!hasCat || !hasColour) && (
        <div className="flex items-start gap-2 bg-danger-bg border border-danger-border/50 rounded-inner p-3 mb-4">
          <Info size={14} className="text-danger mt-0.5 flex-shrink-0" />
          <p className="text-xs text-danger">
            Required before posting:{' '}
            {!hasCat && <strong>category</strong>}
            {!hasCat && !hasColour && ' and '}
            {!hasColour && <strong>at least one colour</strong>}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-outline gap-1.5" aria-label="Go back to retake photo">
          <ChevronLeft size={15} /> Retake
        </button>
        <button
          onClick={onNext}
          disabled={!canPost}
          className="btn-primary flex-1 gap-1.5"
          aria-label="Proceed to set location"
        >
          Set Location <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
