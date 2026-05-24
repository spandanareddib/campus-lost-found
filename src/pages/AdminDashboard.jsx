// ─── AdminDashboard — full admin view: metrics, table, claim queue, purge ─────

import { useState } from 'react'
import {
  Package, Clock, CheckCircle2, AlertTriangle,
  Check, X, Shield, BarChart3, ListChecks, Trash2,
} from 'lucide-react'
import { SectionLabel, StatusBadge, ColourDots } from '../components/ui/index.jsx'
import ClaimQueue from '../components/admin/ClaimQueue.jsx'
import PurgePanel from '../components/admin/PurgePanel.jsx'
import { timeAgo, daysUntilExpiry } from '../services/utils.js'
import { CATEGORIES } from '../data/mockData.js'

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview',    Icon: BarChart3    },
  { id: 'claims',   label: 'Claim Queue', Icon: ListChecks   },
  { id: 'expiry',   label: 'Expiry',      Icon: Trash2       },
]

function MetricCard({ icon: Icon, value, label, iconBg, delta, deltaUp, delay }) {
  return (
    <div className={`bento-card p-5 animate-fade-up stagger-${delay}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-[12px] ${iconBg} flex items-center justify-center`}>
          <Icon size={18} className="text-white" strokeWidth={2} />
        </div>
        {delta && (
          <span className={`text-[10px] font-bold rounded-pill px-2 py-0.5 border ${
            deltaUp
              ? 'bg-success-bg text-success border-success-border/50'
              : 'bg-warning-bg text-warning border-warning-border/50'
          }`}>
            {delta}
          </span>
        )}
      </div>
      <div className="font-display font-semibold text-brand-900 text-3xl leading-none mb-1">{value}</div>
      <div className="text-xs text-ink-tertiary">{label}</div>
    </div>
  )
}

export default function AdminDashboard({ items: initialItems, onUpdateStatus, onPurge, onExtend }) {
  const [items, setItems]       = useState(initialItems)
  const [tab, setTab]           = useState('overview')
  const [tableFilter, setTableFilter] = useState('ALL')
  const [actionMap, setActionMap]     = useState({})

  const unclaimed     = items.filter((i) => i.status === 'UNCLAIMED').length
  const pending       = items.filter((i) => i.status === 'PENDING_CLAIM').length
  const claimed       = items.filter((i) => i.status === 'CLAIMED').length
  const expiringSoon  = items.filter((i) => daysUntilExpiry(i.expiresAt) <= 14 && i.status !== 'CLAIMED').length
  const pendingItems  = items.filter((i) => i.status === 'PENDING_CLAIM')
  const expiringItems = items.filter((i) => daysUntilExpiry(i.expiresAt) <= 14 && i.status !== 'CLAIMED')

  const tableFilters = [
    { value: 'ALL', label: 'All', count: items.length },
    { value: 'UNCLAIMED', label: 'Unclaimed', count: unclaimed },
    { value: 'PENDING_CLAIM', label: 'Pending', count: pending },
    { value: 'CLAIMED', label: 'Claimed', count: claimed },
  ]

  const filteredRows = items.filter((item) =>
    tableFilter === 'ALL' ? true : item.status === tableFilter
  )

  function handleApprove(id) {
    setActionMap((p) => ({ ...p, [id]: 'approved' }))
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: 'CLAIMED' } : i))
    onUpdateStatus?.(id, 'CLAIMED')
  }

  function handleReject(id) {
    setActionMap((p) => ({ ...p, [id]: 'rejected' }))
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: 'UNCLAIMED' } : i))
    onUpdateStatus?.(id, 'UNCLAIMED')
  }

  function handlePurge(ids) {
    setItems((prev) => prev.filter((i) => !ids.includes(i.id)))
    onPurge?.(ids)
  }

  function handleExtend(id, days) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, expiresAt: new Date(new Date(i.expiresAt).getTime() + days * 86400000).toISOString() }
          : i
      )
    )
    onExtend?.(id, days)
  }

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8 pb-28">

      {/* Header */}
      <div className="flex items-start justify-between mb-7 animate-fade-up">
        <div>
          <SectionLabel><Shield size={10} /> Admin Dashboard</SectionLabel>
          <h1 className="font-display font-semibold text-brand-900 text-3xl mt-2">Dashboard</h1>
          <p className="text-sm text-ink-tertiary mt-1">
            Westfield University · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={Package}       value={unclaimed}    label="Unclaimed items"    iconBg="bg-warning"       delta="+3 today"    deltaUp delay={1} />
        <MetricCard icon={Clock}         value={pending}      label="Pending claims"     iconBg="bg-brand-500"     delta="Needs review" deltaUp={false} delay={2} />
        <MetricCard icon={AlertTriangle} value={expiringSoon} label="Expiring ≤14 days"  iconBg="bg-danger"        delta="Review now"  deltaUp={false} delay={3} />
        <MetricCard icon={CheckCircle2}  value={claimed}      label="Claimed this week"  iconBg="bg-success"       delta="↑ 40%"       deltaUp delay={4} />
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 bg-surface-subtle rounded-pill p-1 border border-surface-muted/60 w-fit animate-fade-up stagger-3">
        {ADMIN_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-pill text-sm font-semibold transition-all ${
              tab === id ? 'bg-brand-900 text-white shadow-card' : 'text-ink-secondary hover:text-ink'
            }`}
            aria-selected={tab === id}
          >
            <Icon size={14} strokeWidth={2} />
            {label}
            {id === 'claims' && pending > 0 && (
              <span className={`text-[10px] font-bold rounded-full px-1.5 ${tab === id ? 'bg-white/20' : 'bg-warning-bg text-warning'}`}>
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === 'overview' && (
        <div className="bento-card overflow-hidden animate-fade-up">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-muted/60">
            <h2 className="font-semibold text-ink text-base">All Items</h2>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hidden">
              {tableFilters.map(({ value, label, count }) => (
                <button
                  key={value}
                  onClick={() => setTableFilter(value)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-pill text-xs font-semibold border transition-all ${
                    tableFilter === value
                      ? 'bg-brand-900 text-white border-brand-900'
                      : 'bg-surface-subtle text-ink-secondary border-surface-muted hover:border-brand-300'
                  }`}
                >
                  {label}
                  <span className={`text-[10px] font-bold rounded-full px-1.5 ${tableFilter === value ? 'bg-white/20' : 'bg-surface-muted text-ink-tertiary'}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table" aria-label="Items table">
              <thead>
                <tr className="border-b border-surface-muted/60 bg-surface-subtle">
                  {['Item', 'Location', 'Found', 'Status', 'Expires', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-tertiary">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((item) => {
                  const days    = daysUntilExpiry(item.expiresAt)
                  const catDef  = CATEGORIES.find((c) => c.value === item.tags.category)
                  const action  = actionMap[item.id]
                  const status  = action === 'approved' ? 'CLAIMED' : action === 'rejected' ? 'UNCLAIMED' : item.status

                  return (
                    <tr key={item.id} className="border-b border-surface-muted/40 hover:bg-surface-subtle/60 transition-colors last:border-0">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-inner flex items-center justify-center text-xl flex-shrink-0 bg-gradient-to-br ${item.photo.blurredBg}`}>
                            {item.photo.emoji}
                          </div>
                          <div>
                            <div className="font-medium text-ink">
                              {catDef?.label || item.tags.category}
                              {item.tags.brand && <span className="text-ink-tertiary font-normal"> · {item.tags.brand}</span>}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <ColourDots colours={item.tags.colours} />
                              <span className="text-[10px] font-mono text-ink-tertiary">{item.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm text-ink">{item.location.building}</div>
                        <div className="text-xs text-ink-tertiary">{item.location.floor}</div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-ink-secondary whitespace-nowrap">
                        {timeAgo(item.createdAt)}
                        <div className="text-ink-tertiary">{item.finder.displayName}</div>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={status} /></td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold ${days <= 7 ? 'text-danger' : days <= 14 ? 'text-warning' : 'text-ink-tertiary'}`}>
                          {days <= 0 ? 'Expired' : `${days}d`}
                        </span>
                        {days <= 7 && days > 0 && <div className="text-[10px] text-danger">⚠ Flag red</div>}
                      </td>
                      <td className="px-5 py-3.5">
                        {!action && item.status === 'PENDING_CLAIM' ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(item.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-success-bg text-success border border-success-border/50 text-xs font-semibold hover:brightness-95 transition-all">
                              <Check size={11} strokeWidth={3} /> Approve
                            </button>
                            <button onClick={() => handleReject(item.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-danger-bg text-danger border border-danger-border/50 text-xs font-semibold hover:brightness-95 transition-all">
                              <X size={11} strokeWidth={3} /> Reject
                            </button>
                          </div>
                        ) : action ? (
                          <span className={`text-xs font-semibold ${action === 'approved' ? 'text-success' : 'text-danger'}`}>
                            {action === 'approved' ? '✓ Approved' : '✗ Rejected'}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-disabled">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredRows.length === 0 && (
              <div className="py-12 text-center text-ink-tertiary text-sm">No items match this filter.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Claims tab ── */}
      {tab === 'claims' && (
        <div className="animate-fade-up">
          <ClaimQueue
            pendingItems={pendingItems}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
      )}

      {/* ── Expiry tab ── */}
      {tab === 'expiry' && (
        <div className="animate-fade-up">
          <PurgePanel
            expiringItems={expiringItems}
            onPurge={handlePurge}
            onExtend={handleExtend}
          />
        </div>
      )}

    </div>
  )
}
