// ─── userStore — mock authentication state ───────────────────────────────────

import { createContext, useContext, useState, useCallback } from 'react'

const UserContext = createContext(null)

const MOCK_USERS = {
  'james.okafor': {
    id: 'james.okafor',
    displayName: 'James Okafor',
    email: 'james.okafor@westfield.ac.uk',
    role: 'student',
    initials: 'JO',
    color: 'bg-brand-100 text-brand-700',
  },
  'priya.sharma': {
    id: 'priya.sharma',
    displayName: 'Priya Sharma',
    email: 'priya.sharma@westfield.ac.uk',
    role: 'student',
    initials: 'PS',
    color: 'bg-purple-100 text-purple-700',
  },
  'security.admin': {
    id: 'security.admin',
    displayName: 'Security Desk',
    email: 'security@westfield.ac.uk',
    role: 'admin',
    initials: 'SD',
    color: 'bg-amber-100 text-amber-700',
  },
}

export function UserProvider({ children }) {
  // Default to james.okafor (demo student)
  const [user, setUser] = useState(MOCK_USERS['james.okafor'])
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  const login = useCallback((userId) => {
    const u = MOCK_USERS[userId]
    if (u) { setUser(u); setIsAuthenticated(true) }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const switchUser = useCallback((userId) => {
    const u = MOCK_USERS[userId]
    if (u) setUser(u)
  }, [])

  return (
    <UserContext.Provider value={{ user, isAuthenticated, login, logout, switchUser, MOCK_USERS }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUserStore() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUserStore must be used within UserProvider')
  return ctx
}
