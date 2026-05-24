// ─── OwnerSearch — full search page with filters, pagination, LIR filing ──────

import { useState } from 'react'
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  FileText, ArrowUpDown, Filter,
} from 'lucide-react'
import { SectionLabel, EmptyState, MatchScoreBadge, StatusBadge, ColourDots } from '../components/ui/index.jsx'
import ItemDetailModal from '../components/owner/ItemDetailModal.jsx'
import LIRForm from '../components/owner/LIRForm.jsx'
import { useSearch } from '../hooks/useSearch.js'
import { getBestScoreForItem } from '../services/matchEngine.js'
import { timeAgo } from '../services/utils.js'
import { CATEGORIES, CAMPUS_BUILDINGS } from '../data/mockData.js'
import BlurredPhoto from '../components/ui/BlurredPhoto.jsx'

// ─── Result card ──────────────────────────────────────────────────────────────
function ResultCard({ item, lirs, onClick, delay }) {
  const score  = getBestScoreForItem(item, lirs)
  const catDef = CATEGORIES.find((c) => c.value === item.tags.category)

  return (
    <button
      onClick={() => onClick(item)}
      className={`bento-card text-left overflow-hidden cursor-pointer group
        hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200
        animate-fade-up stagger-${Math.min(delay + 1, 6)}`}
      aria-label={`View ${item.tags.description}`}
    >
      {/* Blurred image */}
      <div className="relative aspect-square">
        <BlurredPhoto
          emoji={item.photo.emoji}
          blurredBg={item.photo.blurredBg}
          revealed={false}
          alt={item.tags.description}
          className="w-full h-full"
          showLockBadge={false}
        />
        {/* Lock icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-ink/10 group-hover:bg-ink/5 transition-colors">
          <div className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow-card group-hover:scale-110 transition-transform">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-ink-secondary">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
        </div>
        {score >= 0.6 && (
          <div className="absolute top-2 left-2"><MatchScoreBadge score={score} /></div>
        )}
        <div className="absolute top-2 right-2"><StatusBadge status={item.status} /></div>
      </div>

      {/* Card body */}
      <div className="p-3.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-ink-tertiary">
            {catDef?.emoji} {catDef?.label || item.tags.category}
          </span>
          <ColourDots colours={item.tags.colours} />
        </div>
        <p className="text-sm font-medium text-ink leading-snug mb-2 line-clamp-2">{item.tags.description}</p>
        <div className="flex items-center justify-between text-[11px] text-ink-tertiary">
          <span>📍 {item.location.building}</span>
          <span>{timeAgo(item.createdAt)}</span>
        </div>
      </div>
    </button>
  )
}

// ─── Advanced filter panel ────────────────────────────────────────────────────
function FilterPanel({ search, onClose }) {
  return (
    <div className="bento-card p-5 mb-4 animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-ink text-sm">Advanced Filters</h3>
        <button onClick={onClose} className="btn-ghost p-1"><X size={15} /></button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary block mb-1.5">
            Status
          </label>
          <select
            value={search.statusFilter}
            onChange={(e) => search.setStatusFilter(e.target.value)}
            className="input-field text-xs py-2"
          >
            <option value="all">All statuses</option>
            <option value="UNCLAIMED">Unclaimed</option>
            <option value="PENDING_CLAIM">Pending</option>
            <option value="CLAIMED">Claimed</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary block mb-1.5">
            Building
          </label>
          <select
            value={search.buildingFilter}
            onChange={(e) => search.setBuildingFilter(e.target.value)}
            className="input-field text-xs py-2"
          >
            <option value="all">All buildings</option>
            {CAMPUS_BUILDINGS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary block mb-1.5">
            Found from
          </label>
          <input
            type="date"
            value={search.dateFrom}
            onChange={(e) => search.setDateFrom(e.target.value)}
            className="input-field text-xs py-2"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary block mb-1.5">
            Found to
          </label>
          <input
            type="date"
            value={search.dateTo}
            onChange={(e) => search.setDateTo(e.target.value)}
            className="input-field text-xs py-2"
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-muted">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">Sort by</label>
          <select
            value={search.sortBy}
            onChange={(e) => search.setSortBy(e.target.value)}
            className="input-field text-xs py-1.5 w-auto"
          >
            <option value="relevance">Relevance</option>
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
          </select>
        </div>
        {search.hasActiveFilters && (
          <button onClick={search.clearFilters} className="text-xs text-danger font-medium hover:underline">
            Clear all filters
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        className="btn-outline px-3 py-2 text-xs disabled:opacity-40 gap-1"
      >
        <ChevronLeft size={14} /> Prev
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
        .reduce((acc, p, idx, arr) => {
          if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('…')
          acc.push(p)
          return acc
        }, [])
        .map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="text-ink-disabled px-1">…</span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-inner text-sm font-semibold transition-all ${
                p === page ? 'bg-brand-900 text-white' : 'btn-outline'
              }`}
            >
              {p}
            </button>
          )
        )}
      <button
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        className="btn-outline px-3 py-2 text-xs disabled:opacity-40 gap-1"
      >
        Next <ChevronRight size={14} />
      </button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OwnerSearchPage({ items, lirs, addLir }) {
  const search        = useSearch(items, lirs)
  const [selected, setSelected] = useState(null)
  const [showLIRForm, setShowLIRForm]     = useState(false)
  const [showFilters, setShowFilters]     = useState(false)
  const [lirSuccess, setLirSuccess]       = useState(false)

  const categoryTabs = [
    { value: 'all', label: 'All', count: items.length },
    ...CATEGORIES
      .filter((c) => items.some((i) => i.tags.category === c.value))
      .map((c) => ({ value: c.value, label: c.label, emoji: c.emoji, count: items.filter((i) => i.tags.category === c.value).length })),
  ]

  function handleAddLir(lirData) {
    addLir(lirData)
    setShowLIRForm(false)
    setLirSuccess(true)
    setTimeout(() => setLirSuccess(false), 4000)
  }

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8 pb-28">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap animate-fade-up">
        <div>
          <SectionLabel>Lost Item Registry</SectionLabel>
          <h1 className="font-display font-semibold text-brand-900 text-3xl mt-2 mb-1">
            Search found items
          </h1>
          <p className="text-sm text-ink-tertiary">
            {items.length} items in registry · Photos revealed after ownership verification
          </p>
        </div>
        <button
          onClick={() => setShowLIRForm((p) => !p)}
          className="btn-primary gap-2 flex-shrink-0"
        >
          <FileText size={15} />
          {showLIRForm ? 'Cancel report' : 'Report lost item'}
        </button>
      </div>

      {/* LIR success banner */}
      {lirSuccess && (
        <div className="mb-4 p-4 bg-success-bg border border-success-border/50 rounded-inner text-sm text-success font-medium flex items-center gap-2 animate-fade-up">
          ✅ Lost Item Report filed. You'll be notified when a match is found.
        </div>
      )}

      {/* LIR Form */}
      {showLIRForm && (
        <div className="bento-card p-6 mb-6 animate-fade-up">
          <div className="flex items-center gap-2 mb-5">
            <FileText size={16} className="text-brand-500" />
            <h2 className="font-display font-semibold text-brand-900 text-xl">File a Lost Item Report</h2>
          </div>
          <LIRForm onSubmit={handleAddLir} onCancel={() => setShowLIRForm(false)} />
        </div>
      )}

      {/* Search bar */}
      <div className="flex gap-2 mb-4 animate-fade-up stagger-1">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-disabled" />
          <input
            type="text"
            value={search.query}
            onChange={(e) => search.setQuery(e.target.value)}
            placeholder="Search by description, colour, brand, building…"
            className="input-field pl-11 py-3.5"
            aria-label="Search found items"
          />
          {search.query && (
            <button
              onClick={() => search.setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-surface-muted flex items-center justify-center hover:bg-surface-subtle transition-colors"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((p) => !p)}
          className={`btn-outline gap-2 flex-shrink-0 ${showFilters || search.hasActiveFilters ? 'border-brand-500 text-brand-600 bg-brand-50' : ''}`}
          aria-label="Toggle filters"
          aria-expanded={showFilters}
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filters</span>
          {search.hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-brand-500" />
          )}
        </button>
      </div>

      {/* Advanced filters */}
      {showFilters && <FilterPanel search={search} onClose={() => setShowFilters(false)} />}

      {/* Category tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hidden pb-1 animate-fade-up stagger-2">
        {categoryTabs.map(({ value, label, emoji, count }) => (
          <button
            key={value}
            onClick={() => search.setCategoryFilter(value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-xs font-semibold border transition-all ${
              search.categoryFilter === value
                ? 'bg-brand-900 text-white border-brand-900'
                : 'bg-surface-card text-ink-secondary border-surface-muted hover:border-brand-300 hover:text-brand-600'
            }`}
            aria-pressed={search.categoryFilter === value}
          >
            {emoji && <span aria-hidden="true">{emoji}</span>}
            {label}
            <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${
              search.categoryFilter === value ? 'bg-white/20' : 'bg-surface-muted text-ink-tertiary'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between mb-3 text-xs text-ink-tertiary animate-fade-up stagger-2">
        <span>
          {search.totalCount} result{search.totalCount !== 1 ? 's' : ''}
          {search.debouncedQuery ? ` for "${search.debouncedQuery}"` : ''}
          {search.categoryFilter !== 'all' ? ` in ${search.categoryFilter}` : ''}
        </span>
        {search.hasActiveFilters && (
          <button onClick={search.clearFilters} className="text-danger font-medium hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {search.paginated.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No items found"
          subtitle={search.debouncedQuery ? `No results for "${search.debouncedQuery}". Try different keywords.` : 'No items match this filter.'}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {search.paginated.map((item, i) => (
            <ResultCard key={item.id} item={item} lirs={lirs} onClick={setSelected} delay={i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={search.page} totalPages={search.totalPages} setPage={search.setPage} />

      {/* Item detail modal */}
      {selected && (
        <ItemDetailModal item={selected} lirs={lirs} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
