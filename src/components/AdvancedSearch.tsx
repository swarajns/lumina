'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search, 
  Filter, 
  Calendar,
  Clock,
  Upload,
  Mic,
  X,
  ChevronDown,
  CheckCircle,
  Circle
} from 'lucide-react'

interface SearchFilters {
  query: string
  source: 'all' | 'record' | 'upload'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year'
  actionItemsStatus: 'all' | 'complete' | 'incomplete' | 'none'
  customDateStart?: string
  customDateEnd?: string
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  onClear: () => void
  totalResults: number
  isLoading: boolean
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function AdvancedSearch({ 
  onSearch, 
  onClear, 
  totalResults, 
  isLoading 
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    source: 'all',
    dateRange: 'all',
    actionItemsStatus: 'all'
  })
  
  const [showFilters, setShowFilters] = useState(false)
  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  // Debounce search query
  const debouncedQuery = useDebounce(filters.query, 300)

  // Check if we have active filters
  useEffect(() => {
    const isActive = filters.source !== 'all' || 
                    filters.dateRange !== 'all' || 
                    filters.actionItemsStatus !== 'all' ||
                    filters.query.length > 0
    setHasActiveFilters(isActive)
  }, [filters])

  // Trigger search when debounced query or filters change
  useEffect(() => {
    onSearch({
      ...filters,
      query: debouncedQuery
    })
  }, [debouncedQuery, filters.source, filters.dateRange, filters.actionItemsStatus, filters.customDateStart, filters.customDateEnd, onSearch])

  const handleInputChange = (field: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleClearAll = () => {
    setFilters({
      query: '',
      source: 'all',
      dateRange: 'all',
      actionItemsStatus: 'all'
    })
    onClear()
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search meetings by title, transcript, or summary..."
                value={filters.query}
                onChange={(e) => handleInputChange('query', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {filters.query && (
                <button
                  onClick={() => handleInputChange('query', '')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 ${hasActiveFilters ? 'bg-primary-50 text-primary-700 border-primary-300' : ''}`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">!</span>}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
              {/* Source Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <select
                  value={filters.source}
                  onChange={(e) => handleInputChange('source', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Sources</option>
                  <option value="record">
                    Recorded
                  </option>
                  <option value="upload">
                    Uploaded
                  </option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleInputChange('dateRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              {/* Action Items Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Items
                </label>
                <select
                  value={filters.actionItemsStatus}
                  onChange={(e) => handleInputChange('actionItemsStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Meetings</option>
                  <option value="complete">Completed Action Items</option>
                  <option value="incomplete">Pending Action Items</option>
                  <option value="none">No Action Items</option>
                </select>
              </div>
            </div>
          )}

          {/* Search Results Summary */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-gray-600">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  Searching...
                </div>
              ) : (
                <span>
                  {totalResults > 0 ? `${totalResults} meeting${totalResults === 1 ? '' : 's'} found` : 'No meetings found'}
                </span>
              )}
              
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear all filters
                </Button>
              )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 text-xs">
                {filters.source !== 'all' && (
                  <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                    {filters.source === 'record' ? 'Recorded' : 'Uploaded'}
                  </span>
                )}
                {filters.dateRange !== 'all' && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {filters.dateRange.replace(/^\w/, c => c.toUpperCase())}
                  </span>
                )}
                {filters.actionItemsStatus !== 'all' && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {filters.actionItemsStatus === 'complete' ? 'Completed' : 
                     filters.actionItemsStatus === 'incomplete' ? 'Pending' : 'No Action Items'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
