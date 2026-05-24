import { useState } from 'react'
import {
  Search, ArrowRight, Zap, Clock, CheckCircle2,
  Package, Bell, FileText, ChevronRight, TrendingUp,
} from 'lucide-react'
import { SectionLabel, StatusBadge, ColourDots, MatchScoreBadge } from '../components/ui/index.jsx'
import { timeAgo } from '../services/utils.js'
import { getBestScoreForItem } from '../services/matchEngine.js'
import { CATEGORIES } from '../data/mockData.js'

// ─── Recent item mini card ────────────────────────────────────────────────────
function RecentItemCard({ item, lirs, onClick, delay }) {
  const score = getBestScoreForItem(item, lirs)
  return (
    <button
      onClick={() => onClick(item)}
      className={`flex-shrink-0 w-36 bento-card-hover p-3 text-left cursor-pointer animate-fade-up stagger-${Math.min(delay + 1, 6)}`}
    >
      {/* Item image placeholder */}
      <div
        className={`w-full aspect-square rounded-inner mb-2.5 flex items-center justify-center text-3xl bg-gradient-to-br ${item.photo.blurredBg} relative overflow-hidden`}
      >
        {item.photo.emoji}
        {score >= 0.6 && (
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent animate-pulse-dot" title="Matches your LIR" />
        )}
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-tertiary mb-0.5">
        {item.tags.category}
      </div>
      <div className="text-xs font-medium text-ink leading-snug mb-1.5 line-clamp-2">
        {item.tags.description}
      </div>
      <div className="text-[10px] text-ink-tertiary flex items-center gap-1">
        <Clock size={9} />
        {timeAgo(item.createdAt)}
      </div>
    </button>
  )
}

// ─── My LIR row ───────────────────────────────────────────────────────────────
function LirRow({ lir, items }) {
  const bestMatch = items
    .map((item) => ({ item, score: getBestScoreForItem(item, [lir]) }))
    .filter(({ score }) => score >= 0.6)
    .sort((a, b) => b.score - a.score)[0]

  const catDef = CATEGORIES.find((c) => c.value === lir.structured.category)

  return (
    <div className="flex items-center gap-3 py-3 border-b border-surface-subtle last:border-0">
      <div className="w-9 h-9 rounded-inner bg-brand-50 flex items-center justify-center text-lg flex-shrink-0">
        {catDef?.emoji || '📦'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink truncate">{lir.description}</div>
        <div className="text-[11px] text-ink-tertiary mt-0.5">{lir.id} · {lir.status}</div>
      </div>
      {bestMatch && (
        <MatchScoreBadge score={bestMatch.score} />
      )}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, iconBg, delay }) {
  return (
    <div className={`flex items-center gap-3 animate-fade-up stagger-${delay}`}>
      <div className={`w-10 h-10 rounded-inner ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className="text-white" strokeWidth={2} />
      </div>
      <div>
        <div className="font-display font-semibold text-white text-xl leading-none">{value}</div>
        <div className="text-[11px] text-white/60 mt-0.5">{label}</div>
      </div>
    </div>
  )
}

// ─── Home Page ────────────────────────────────────────────────────────────────
export default function HomePage({ setPage, items, lirs }) {
  const [searchQuery, setSearchQuery] = useState('')

  const unclaimedItems = items.filter((i) => i.status === 'UNCLAIMED')
  const recentItems = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8)
  const activeLirs = lirs.filter((l) => l.status === 'OPEN' || l.status === 'MATCHED')

  function handleSearchSubmit(e) {
    e.preventDefault()
    setPage('search')
  }

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8 pb-28">

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Hero card — spans 2 cols */}
        <div className="md:col-span-2 bento-card bg-brand-900 border-brand-800 relative overflow-hidden animate-fade-up">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-brand-500/10 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-16 w-48 h-48 rounded-full bg-accent/8 translate-y-1/2 pointer-events-none" />

          <div className="relative z-10 p-7">
            <div className="section-label mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
              Campus Lost & Found
            </div>
            <h1 className="font-display font-semibold text-white text-3xl lg:text-4xl mb-2 leading-tight text-balance">
              Find what matters,<br />
              <span className="italic font-light text-white/80">fast.</span>
            </h1>
            <p className="text-white/55 text-sm mb-8 max-w-md leading-relaxed">
              Snap a found item in under 60 seconds. Owners are notified the moment their lost item appears.
            </p>

            <div className="grid grid-cols-3 gap-5">
              <StatCard icon={Package} value={unclaimedItems.length} label="Items live" iconBg="bg-brand-600" delay={2} />
              <StatCard icon={CheckCircle2} value="12" label="Claimed today" iconBg="bg-success" delay={3} />
              <StatCard icon={Zap} value="< 30s" label="Match speed" iconBg="bg-accent" delay={4} />
            </div>
          </div>
        </div>

        {/* Quick Search card */}
        <div className="bento-card p-6 animate-fade-up stagger-2 flex flex-col">
          <SectionLabel>Quick Search</SectionLabel>
          <h2 className="font-display font-semibold text-brand-900 text-xl mt-3 mb-1">
            Find your item
          </h2>
          <p className="text-xs text-ink-tertiary mb-5 leading-relaxed">
            Search across all found items by description, colour, category or location.
          </p>

          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-disabled" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. navy bag, AirPods…"
                className="input-field pl-9 pr-24"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-[10px] px-3 py-1.5 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-1.5 mt-auto">
            {['Bags', 'Headphones', 'Keys', 'Electronics', 'Clothing'].map((kw) => (
              <button
                key={kw}
                onClick={() => setPage('search')}
                className="text-[11px] font-medium text-brand-600 bg-brand-50 border border-brand-100 hover:bg-brand-100 rounded-pill px-2.5 py-1 transition-colors"
              >
                #{kw}
              </button>
            ))}
          </div>
        </div>

        {/* Finds Nearby — full width */}
        <div className="md:col-span-3 bento-card p-6 animate-fade-up stagger-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <SectionLabel>Finds Nearby</SectionLabel>
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded-pill px-2 py-0.5">
                {recentItems.length} items
              </span>
            </div>
            <button
              onClick={() => setPage('search')}
              className="btn-ghost text-xs text-brand-600 hover:text-brand-700 px-0 gap-1"
            >
              View all <ArrowRight size={13} />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto scrollbar-hidden pb-1">
            {recentItems.map((item, i) => (
              <RecentItemCard
                key={item.id}
                item={item}
                lirs={lirs}
                onClick={() => setPage('search')}
                delay={i}
              />
            ))}
          </div>
        </div>

        {/* My Active Reports */}
        <div className="md:col-span-2 bento-card p-6 animate-fade-up stagger-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <SectionLabel>My Active Reports</SectionLabel>
              <span className="text-[10px] font-bold bg-surface-subtle text-ink-secondary rounded-pill px-2 py-0.5">
                {activeLirs.length} open
              </span>
            </div>
            <button className="btn-ghost text-xs px-0 gap-1 text-brand-600">
              File new <ArrowRight size={13} />
            </button>
          </div>

          {activeLirs.length === 0 ? (
            <div className="py-8 text-center text-ink-tertiary text-sm">
              No active reports. Lost something?
            </div>
          ) : (
            <div>
              {activeLirs.map((lir) => (
                <LirRow key={lir.id} lir={lir} items={items} />
              ))}
            </div>
          )}
        </div>

        {/* Call to action — finder */}
        <div className="bento-card p-6 bg-gradient-to-br from-accent-light to-surface-card border-accent/20 animate-fade-up stagger-4 flex flex-col">
          <div className="w-12 h-12 rounded-[14px] bg-accent flex items-center justify-center mb-4 shadow-fab">
            <Bell size={22} className="text-white" strokeWidth={2} />
          </div>
          <h3 className="font-display font-semibold text-brand-900 text-xl mb-2">
            Found something?
          </h3>
          <p className="text-sm text-ink-secondary leading-relaxed mb-6 flex-1">
            Be a campus hero. Snap & upload in 60 seconds — AI does the tagging.
          </p>
          <button
            onClick={() => setPage('upload')}
            className="btn-accent w-full justify-center"
          >
            Snap & Upload
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Quick stats row */}
        <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up stagger-4">
          {[
            { label: 'Items logged this month', value: '47', icon: TrendingUp, color: 'text-brand-600' },
            { label: 'Successful claims', value: '19', icon: CheckCircle2, color: 'text-success' },
            { label: 'Avg match time', value: '< 30s', icon: Zap, color: 'text-accent' },
            { label: 'LIRs active', value: String(lirs.length), icon: FileText, color: 'text-ink-secondary' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bento-card p-4 flex items-center gap-3">
              <Icon size={18} className={color} strokeWidth={2} />
              <div>
                <div className="font-display font-semibold text-ink text-xl leading-none">{value}</div>
                <div className="text-[11px] text-ink-tertiary mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
