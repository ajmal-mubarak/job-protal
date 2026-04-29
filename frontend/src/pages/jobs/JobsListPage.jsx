import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, X, Loader, SlidersHorizontal } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import JobCard from '../../components/JobCard'
import { jobsApi } from '../../api/jobs'
import { cn } from '../../lib/utils'

const JOB_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' },
]

export default function JobsListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Filter state
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [jobType, setJobType] = useState(searchParams.get('type') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [featuredOnly, setFeaturedOnly] = useState(searchParams.get('featured') === 'true')

  const fetchJobs = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, page_size: 12 }
      if (query) params.q = query
      if (jobType) params.job_type = jobType
      if (location) params.location = location
      if (featuredOnly) params.featured = true

      const res = await jobsApi.list(params)
      const data = res.data
      if (p === 1) setJobs(data.items || [])
      else setJobs((prev) => [...prev, ...(data.items || [])])
      setTotal(data.total || 0)
      setPage(p)
    } catch { setJobs([]) }
    finally { setLoading(false) }
  }, [query, jobType, location, featuredOnly])

  useEffect(() => { fetchJobs(1) }, [fetchJobs])

  const handleSearch = (e) => {
    e.preventDefault()
    const sp = new URLSearchParams()
    if (query) sp.set('q', query)
    if (jobType) sp.set('type', jobType)
    if (location) sp.set('location', location)
    if (featuredOnly) sp.set('featured', 'true')
    setSearchParams(sp)
    fetchJobs(1)
  }

  const clearFilters = () => {
    setQuery(''); setJobType(''); setLocation(''); setFeaturedOnly(false)
    setSearchParams({})
  }

  const hasFilters = query || jobType || location || featuredOnly

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <div className="bg-surface border-b border-border px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Browse Jobs</h1>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                id="jobs-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Job title, skills, or company..."
                className="input pl-10"
              />
            </div>
            <input
              id="jobs-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              type="text"
              placeholder="Location"
              className="input sm:w-48"
            />
            <button type="submit" className="btn-primary flex-shrink-0">Search</button>
            <button
              type="button"
              id="toggle-filters"
              onClick={() => setShowFilters((v) => !v)}
              className="btn-secondary flex-shrink-0"
            >
              <SlidersHorizontal size={15} /> Filters
            </button>
          </form>

          {/* Filter row */}
          {showFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-3 animate-slide-up">
              {JOB_TYPES.map((t) => (
                <button
                  key={t.value}
                  id={`type-filter-${t.value || 'all'}`}
                  onClick={() => setJobType(t.value)}
                  className={cn(
                    'badge cursor-pointer transition-all',
                    jobType === t.value ? 'badge-primary' : 'badge-muted hover:border-border-light'
                  )}
                >
                  {t.label}
                </button>
              ))}
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  id="featured-filter"
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => setFeaturedOnly(e.target.checked)}
                  className="accent-primary"
                />
                <span className="text-xs text-text-secondary">Featured only</span>
              </label>
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-text-muted hover:text-error transition-colors">
                  <X size={12} /> Clear all
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <main className="flex-1 section-sm">
        <div className="max-w-5xl mx-auto">
          {!loading && (
            <p className="text-sm text-text-muted mb-5">
              {total === 0 ? 'No jobs found' : `${total} job${total !== 1 ? 's' : ''} found`}
              {hasFilters && ' (filtered)'}
            </p>
          )}

          {loading && page === 1 ? (
            <div className="flex items-center justify-center py-20">
              <Loader size={28} className="text-primary animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No jobs found</h3>
              <p className="text-text-muted text-sm">Try adjusting your filters or search query</p>
              {hasFilters && (
                <button onClick={clearFilters} className="btn-ghost mt-4 text-sm">Clear filters</button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => <JobCard key={job.id} job={job} />)}
              </div>

              {/* Load more */}
              {jobs.length < total && (
                <div className="text-center mt-8">
                  <button
                    id="load-more-jobs"
                    onClick={() => fetchJobs(page + 1)}
                    disabled={loading}
                    className="btn-secondary"
                  >
                    {loading ? <Loader size={16} className="animate-spin" /> : 'Load more jobs'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
