import { Search, MapPin, Bell, LayoutDashboard, Camera, Shield } from 'lucide-react'
import { useUserStore } from '../../store/userStore.jsx'

const NAV_TABS = [
  { id: 'home',   label: 'Dashboard',    Icon: LayoutDashboard },
  { id: 'search', label: 'Search Items', Icon: Search          },
  { id: 'upload', label: 'Report Found', Icon: Camera          },
  { id: 'admin',  label: 'Admin',        Icon: Shield          },
]

export default function Navbar({ page, setPage, hasMatch }) {
  const { user, switchUser, MOCK_USERS } = useUserStore()

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-surface-muted/60">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <button className="flex items-center gap-2.5 flex-shrink-0 group" onClick={() => setPage('home')}>
          <div className="w-8 h-8 rounded-[10px] bg-brand-900 flex items-center justify-center group-hover:bg-brand-700 transition-colors">
            <MapPin size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="hidden sm:block">
            <div className="font-display font-semibold text-[15px] text-brand-900 leading-none">Lost & Found</div>
            <div className="text-[10px] text-ink-tertiary tracking-wide font-body mt-0.5">Westfield University</div>
          </div>
        </button>

        {/* Nav tabs (desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-subtle rounded-pill p-1 border border-surface-muted/60" aria-label="Main navigation">
          {NAV_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              aria-current={page === id ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-pill text-sm font-medium transition-all duration-200 ${
                page === id
                  ? 'bg-brand-900 text-white shadow-card'
                  : 'text-ink-secondary hover:text-ink hover:bg-surface-card'
              }`}
            >
              <Icon size={14} strokeWidth={2} />
              {label}
            </button>
          ))}
        </nav>

        {/* Right: bell + demo user switcher */}
        <div className="flex items-center gap-2">
          <button
            className="relative w-9 h-9 rounded-inner flex items-center justify-center text-ink-secondary hover:bg-surface-subtle hover:text-ink transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} strokeWidth={2} />
            {hasMatch && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent border-2 border-surface animate-pulse-dot" />
            )}
          </button>

          {/* User avatar + quick-switch */}
          <div className="relative group">
            <button
              className={`w-9 h-9 rounded-full border-2 border-brand-200 flex items-center justify-center text-xs font-bold ${user?.color || 'bg-brand-100 text-brand-700'}`}
              aria-label={`Signed in as ${user?.displayName}`}
            >
              {user?.initials || '?'}
            </button>
            {/* Demo user switcher dropdown */}
            <div className="absolute right-0 top-11 bg-surface-card border border-surface-muted rounded-inner shadow-modal min-w-[190px] py-1 opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-tertiary border-b border-surface-muted mb-1">
                Demo: switch user
              </div>
              {Object.values(MOCK_USERS).map((u) => (
                <button
                  key={u.id}
                  onClick={() => switchUser(u.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface-subtle transition-colors ${user?.id === u.id ? 'text-brand-600 font-semibold' : 'text-ink-secondary'}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${u.color}`}>
                    {u.initials}
                  </div>
                  <div className="text-left min-w-0">
                    <div className="truncate text-xs font-medium">{u.displayName}</div>
                    <div className="text-[10px] text-ink-tertiary capitalize">{u.role}</div>
                  </div>
                  {user?.id === u.id && <span className="ml-auto text-brand-500 text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden flex border-t border-surface-muted/60 bg-surface" role="navigation" aria-label="Mobile navigation">
        {NAV_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            aria-current={page === id ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
              page === id ? 'text-brand-600' : 'text-ink-tertiary'
            }`}
          >
            <Icon size={19} strokeWidth={page === id ? 2.5 : 1.75} />
            {label}
          </button>
        ))}
      </div>
    </header>
  )
}
