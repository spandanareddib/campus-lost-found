// ─── useSearch — debounced search with filters, sort, pagination ──────────────

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { getBestScoreForItem } from '../services/matchEngine.js'

const PAGE_SIZE = 12

export function useSearch(allItems, lirs) {
  const [query, setQueryRaw] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [buildingFilter, setBuildingFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('relevance') // 'relevance' | 'date_desc' | 'date_asc'
  const [page, setPage] = useState(1)
  const debounceTimer = useRef(null)

  // Debounce query
  const setQuery = useCallback((q) => {
    setQueryRaw(q)
    setPage(1)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedQuery(q), 250)
  }, [])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [categoryFilter, statusFilter, buildingFilter, dateFrom, dateTo, sortBy])

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()

    let results = allItems.filter((item) => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false

      // Category filter
      if (categoryFilter !== 'all' && item.tags.category !== categoryFilter) return false

      // Building filter
      if (buildingFilter !== 'all' && item.location.building !== buildingFilter) return false

      // Date range
      if (dateFrom) {
        const found = new Date(item.location.foundAt)
        if (found < new Date(dateFrom)) return false
      }
      if (dateTo) {
        const found = new Date(item.location.foundAt)
        if (found > new Date(dateTo + 'T23:59:59')) return false
      }

      // Text search
      if (!q) return true
      const haystack = [
        item.tags.category,
        item.tags.description,
        item.tags.brand || '',
        ...item.tags.colours,
        ...(item.tags.customTags || []),
        item.location.building,
        item.location.floor || '',
        item.location.zone || '',
        item.id,
      ].join(' ').toLowerCase()
      return haystack.includes(q)
    })

    // Sort
    if (sortBy === 'relevance') {
      results = results.sort((a, b) => {
        const sa = getBestScoreForItem(a, lirs)
        const sb = getBestScoreForItem(b, lirs)
        if (sb !== sa) return sb - sa
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
    } else if (sortBy === 'date_desc') {
      results = results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (sortBy === 'date_asc') {
      results = results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    }

    return results
  }, [allItems, debouncedQuery, categoryFilter, statusFilter, buildingFilter, dateFrom, dateTo, sortBy, lirs])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const clearFilters = useCallback(() => {
    setQueryRaw('')
    setDebouncedQuery('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setBuildingFilter('all')
    setDateFrom('')
    setDateTo('')
    setSortBy('relevance')
    setPage(1)
  }, [])

  const hasActiveFilters =
    debouncedQuery || categoryFilter !== 'all' || statusFilter !== 'all' ||
    buildingFilter !== 'all' || dateFrom || dateTo || sortBy !== 'relevance'

  return {
    query, setQuery, debouncedQuery,
    categoryFilter, setCategoryFilter,
    statusFilter, setStatusFilter,
    buildingFilter, setBuildingFilter,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    sortBy, setSortBy,
    page, setPage,
    results: filtered,
    paginated,
    totalPages,
    totalCount: filtered.length,
    clearFilters,
    hasActiveFilters,
  }
}
