// ─── Login — mock campus SSO login page ──────────────────────────────────────

import { useState } from 'react'
import { MapPin, ChevronRight, Loader2, ShieldCheck } from 'lucide-react'
import { useUserStore } from '../store/userStore.jsx'

const DEMO_ACCOUNTS = [
  {
    id: 'james.okafor',
    initials: 'JO',
    name: 'James Okafor',
    role: 'Student',
    email: 'james.okafor@westfield.ac.uk',
    desc: 'Has active Lost Item Reports and can file claims',
    color: 'bg-brand-100 text-brand-700',
  },
  {
    id: 'priya.sharma',
    initials: 'PS',
    name: 'Priya Sharma',
    role: 'Student (Finder)',
    email: 'priya.sharma@westfield.ac.uk',
    desc: 'Demo finder — use the Snap & Upload flow',
    color: 'bg-purple-100 text-purple-700',
  },
  {
    id: 'security.admin',
    initials: 'SD',
    name: 'Security Desk',
    role: 'Admin',
    email: 'security@westfield.ac.uk',
    desc: 'Full admin access: approve claims, purge items',
    color: 'bg-amber-100 text-amber-700',
  },
]

export default function LoginPage() {
  const { login } = useUserStore()
  const [loading, setLoading] = useState(null)

  async function handleLogin(userId) {
    setLoading(userId)
    await new Promise((r) => setTimeout(r, 900))
    login(userId)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10 animate-fade-up">
          <div className="w-16 h-16 rounded-[18px] bg-brand-900 flex items-center justify-center mb-4 shadow-card">
            <MapPin size={28} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="font-display font-semibold text-brand-900 text-2xl mb-1">Lost & Found</h1>
          <p className="text-sm text-ink-tertiary">Westfield University</p>
        </div>

        {/* Card */}
        <div className="bento-card p-6 animate-fade-up stagger-1">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={16} className="text-brand-500" />
            <h2 className="font-semibold text-ink text-base">Sign in with Campus SSO</h2>
          </div>
          <p className="text-xs text-ink-tertiary mb-5 leading-relaxed">
            Select a demo account to explore the app. In production this uses your university Microsoft / Google account.
          </p>

          <div className="flex flex-col gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.id}
                onClick={() => handleLogin(acc.id)}
                disabled={!!loading}
                className="group flex items-center gap-3 p-3.5 rounded-inner border border-surface-muted hover:border-brand-300 hover:bg-brand-50/40 transition-all disabled:opacity-60 text-left"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${acc.color}`}>
                  {acc.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-ink">{acc.name}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-surface-muted text-ink-tertiary rounded-pill px-2 py-0.5">
                      {acc.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-tertiary truncate mt-0.5">{acc.email}</p>
                  <p className="text-[11px] text-ink-secondary mt-1 leading-snug">{acc.desc}</p>
                </div>
                <div className="flex-shrink-0 ml-1">
                  {loading === acc.id
                    ? <Loader2 size={18} className="text-brand-500 animate-spin" />
                    : <ChevronRight size={18} className="text-ink-disabled group-hover:text-brand-500 transition-colors" />
                  }
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-ink-disabled mt-6 animate-fade-up stagger-4">
          © 2026 Westfield University · Lost & Found MVP v1.0
        </p>
      </div>
    </div>
  )
}
