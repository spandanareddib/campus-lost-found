// ─── Utility Helpers ──────────────────────────────────────────────────────────

/**
 * timeAgo — relative time string from ISO timestamp
 */
export function timeAgo(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  return `${diffDays}d ago`
}

/**
 * daysUntilExpiry — number of days until item expires
 */
export function daysUntilExpiry(expiresAt) {
  const expiry = new Date(expiresAt)
  const now = new Date()
  return Math.ceil((expiry - now) / 86400000)
}

/**
 * generateItemId — creates a new item ID
 */
export function generateItemId() {
  const num = String(Math.floor(Math.random() * 900) + 100)
  return `FI-2026-${num}`
}

/**
 * Colour name → hex mapping for colour dots
 */
export const COLOUR_HEX = {
  navy: '#1a3a6b',
  black: '#1C1B18',
  blue: '#3B82F6',
  silver: '#94a3b8',
  red: '#EF4444',
  yellow: '#EAB308',
  grey: '#6B7280',
  gray: '#6B7280',
  white: '#E2E8F0',
  orange: '#F97316',
  green: '#16A34A',
  pink: '#EC4899',
  brown: '#92400E',
  tan: '#B45309',
  purple: '#7C3AED',
  violet: '#7C3AED',
}

/**
 * getColourHex — returns hex or a fallback
 */
export function getColourHex(colourName) {
  return COLOUR_HEX[colourName?.toLowerCase()] || '#94a3b8'
}

/**
 * confidenceClass — returns tag chip class based on confidence
 */
export function confidenceClass(conf) {
  if (conf >= 0.8) return 'tag-high'
  if (conf >= 0.5) return 'tag-mid'
  return 'tag-low'
}

/**
 * confidenceLabel — short human label for confidence
 */
export function confidenceLabel(conf) {
  if (conf >= 0.8) return 'High'
  if (conf >= 0.5) return 'Check'
  return 'Low'
}

/**
 * statusClass — returns Tailwind class for status chip
 */
export function statusClass(status) {
  const map = {
    UNCLAIMED: 'status-unclaimed',
    PENDING_CLAIM: 'status-pending',
    CLAIMED: 'status-claimed',
    COLLECTED: 'status-collected',
  }
  return map[status] || 'status-unclaimed'
}

/**
 * statusLabel
 */
export function statusLabel(status) {
  const map = {
    UNCLAIMED: 'Unclaimed',
    PENDING_CLAIM: 'Pending',
    CLAIMED: 'Claimed',
    COLLECTED: 'Collected',
    PURGED: 'Purged',
  }
  return map[status] || status
}

/**
 * searchItems — keyword search across all text fields
 */
export function searchItems(items, query, categoryFilter) {
  const q = query.trim().toLowerCase()
  return items.filter((item) => {
    // Category filter
    if (categoryFilter && categoryFilter !== 'all') {
      if (item.tags.category !== categoryFilter) return false
    }
    // Text search
    if (!q) return true
    const searchFields = [
      item.tags.category,
      item.tags.description,
      item.tags.brand || '',
      ...item.tags.colours,
      ...(item.tags.customTags || []),
      item.location.building,
      item.location.floor || '',
      item.location.zone || '',
    ].join(' ').toLowerCase()
    return searchFields.includes(q)
  })
}

/**
 * formatDate — formats ISO date as "22 May 2026"
 */
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
