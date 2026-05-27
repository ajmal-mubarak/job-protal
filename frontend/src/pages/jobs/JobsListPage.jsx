import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, X, Loader, SlidersHorizontal, MapPin } from 'lucide-react'
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

  // Filter state — read ?q= (from hero) or ?search= (from direct URL)
  const [query, setQuery] = useState(searchParams.get('q') || searchParams.get('search') || '')
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
      // Backend returns: { jobs: [...], page, limit, count }
      const jobsList = data.jobs || []
      const jobsCount = data.count ?? jobsList.length
      if (p === 1) setJobs(jobsList)
      else setJobs((prev) => [...prev, ...jobsList])
      setTotal(jobsCount)
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
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-white border-b border-slate-100 px-4 py-12 relative overflow-hidden">
        {/* Subtle decorative elements for a premium feel */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-60 h-60 bg-violet-50/30 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100/50 mb-3 uppercase tracking-wider">
            Explore Roles
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
            Find your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">dream career</span>
          </h1>
          <p className="text-sm text-slate-500 mb-8 max-w-xl leading-relaxed">
            Browse through hundreds of curated professional roles from fast-growing startups and established tech enterprises.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-[0_12px_30px_rgba(15,23,42,0.03)]">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="jobs-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Job title, skills, or company..."
                className="w-full bg-transparent pl-10 pr-4 py-2.5 outline-none text-slate-700 text-sm placeholder-slate-400"
              />
            </div>
            <div className="w-px h-8 bg-slate-100 hidden sm:block self-center" />
            <div className="relative sm:w-48">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="jobs-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                type="text"
                placeholder="Location"
                className="w-full bg-transparent pl-9 pr-4 py-2.5 outline-none text-slate-700 text-sm placeholder-slate-400"
              />
            </div>
            <div className="flex gap-2">
              <button 
                type="button"
                id="toggle-filters"
                onClick={() => setShowFilters((v) => !v)}
                className="btn-secondary px-4 py-2.5 rounded-xl text-slate-600 border border-slate-200/80 hover:bg-slate-50 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
              >
                <SlidersHorizontal size={14} className="text-slate-500" /> Filters
              </button>
              <button type="submit" className="btn-primary px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white shadow-md hover:bg-indigo-700 flex-1 sm:flex-initial">
                Search
              </button>
            </div>
          </form>

          {/* Filter row */}
          {showFilters && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50/60 border border-slate-100 flex flex-wrap items-center gap-3 animate-slide-up">
              {JOB_TYPES.map((t) => (
                <button
                  key={t.value}
                  id={`type-filter-${t.value || 'all'}`}
                  type="button"
                  onClick={() => setJobType(t.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border',
                    jobType === t.value 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  )}
                >
                  {t.label}
                </button>
              ))}
              <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="featured-filter"
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => setFeaturedOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                />
                <span className="text-xs text-slate-600 font-semibold">Featured only</span>
              </label>
              {hasFilters && (
                <button 
                  onClick={clearFilters} 
                  type="button"
                  className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 transition-colors ml-auto bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100/50"
                >
                  <X size={12} /> Clear all
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              {total === 0 ? 'No jobs found' : `${total} job${total !== 1 ? 's' : ''} available`}
              {hasFilters && ' (filtered)'}
            </h2>
          </div>
        )}

        {loading && page === 1 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white border border-slate-100 rounded-3xl">
            <Loader size={32} className="text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Fetching professional listings...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgba(15,23,42,0.01)]">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Search size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No matching jobs found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              We couldn't find any job openings matching your current query. Try adjusting your location, searching with different keywords, or clearing your filters.
            </p>
            {hasFilters && (
              <button 
                onClick={clearFilters} 
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 hover:bg-indigo-100/50 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>

            {/* Load more */}
            {jobs.length < total && (
              <div className="text-center mt-12">
                <button
                  id="load-more-jobs"
                  onClick={() => fetchJobs(page + 1)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-800 shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader size={16} className="animate-spin text-indigo-600" /> : 'Load more jobs'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
