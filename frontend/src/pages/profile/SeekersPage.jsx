import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, MessageSquare, MapPin, Briefcase, Loader, Filter } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { profilesApi } from '../../api/profiles'
import { chatApi } from '../../api/chat'
import { cn } from '../../lib/utils'
import useAuthStore from '../../store/useAuthStore'

function SeekerCard({ seeker, onMessage }) {
  return (
    <div className="bg-white/90 border border-white hover:border-indigo-100 rounded-2xl p-5 shadow-[0_8px_24px_rgba(15,23,42,0.012)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.04)] transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4 group backdrop-blur-md">
      {/* Header */}
      <div className="flex items-start gap-3">
        {seeker.avatar_url ? (
          <img 
            src={seeker.avatar_url} 
            alt={seeker.name} 
            className="w-12 h-12 rounded-xl object-cover border border-slate-100 flex-shrink-0"
          />
        ) : (
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-[15px] font-black text-white flex-shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            {seeker.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-[14px] leading-tight truncate">
              {seeker.name}
            </p>
            {seeker.is_open_to_work && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150 uppercase tracking-wider">
                Open To Work
              </span>
            )}
          </div>
          {seeker.headline && (
            <p className="text-xs font-semibold text-slate-400 mt-1 line-clamp-1 leading-snug">{seeker.headline}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
            {seeker.location && (
              <span className="flex items-center gap-1 text-[11px]"><MapPin size={11} className="text-indigo-500/80" />{seeker.location}</span>
            )}
            {seeker.experience_years > 0 && (
              <span className="flex items-center gap-1 text-[11px]"><Briefcase size={11} className="text-violet-500/80" />{seeker.experience_years} yr{seeker.experience_years !== 1 ? 's' : ''} exp</span>
            )}
          </div>
        </div>
      </div>

      {/* Skills */}
      {seeker.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 my-1">
          {seeker.skills.slice(0, 4).map((s) => (
            <span key={s} className="px-2.5 py-0.5 rounded-lg bg-indigo-50/30 text-indigo-700 font-bold text-[10px] border border-indigo-100/20">
              {s}
            </span>
          ))}
          {seeker.skills.length > 4 && (
            <span className="px-2 py-0.5 rounded-lg bg-slate-50 text-slate-400 font-bold text-[10px] border border-slate-100">
              +{seeker.skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2.5 pt-3 border-t border-slate-50 mt-auto">
        <Link
          to={`/profiles/${seeker.user_id}`}
          className="px-3 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-bold text-[11px] rounded-xl flex-1 text-center transition-all shadow-sm"
        >
          View Profile
        </Link>
        <button
          id={`msg-seeker-${seeker.user_id}`}
          onClick={() => onMessage(seeker)}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-xl flex-1 justify-center flex items-center gap-1 shadow-sm shadow-indigo-50 hover:shadow-indigo-100 transition-all"
        >
          <MessageSquare size={12} /> Message
        </button>
      </div>
    </div>
  )
}

export default function SeekersPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [seekers, setSeekers] = useState([])
  const [loading, setLoading] = useState(true)
  const [messaging, setMessaging] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [skills, setSkills] = useState('')
  const [location, setLocation] = useState('')
  const [openOnly, setOpenOnly] = useState(false)

  const fetchSeekers = async (params = {}) => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const effectiveOpenOnly = params.openOnly !== undefined ? params.openOnly : openOnly
      const queryParams = {
        skills: params.skills ?? (skills || undefined),
        location: params.location ?? (location || undefined),
      }
      // Only send open_to_work=true if checkbox is checked — omitting means show all
      if (effectiveOpenOnly) {
        queryParams.open_to_work = true
      }
      const res = await profilesApi.listSeekers(queryParams)
      setSeekers(res.data || [])
    } catch {
      toast.error('Failed to load job seekers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    if (isAuthenticated) {
      fetchSeekers() 
    }
  }, [isAuthenticated])

  const handleSearch = (e) => {
    e.preventDefault()
    setSkills(searchInput)
    fetchSeekers({ skills: searchInput || undefined, location: location || undefined })
  }

  const handleMessage = async (seeker) => {
    if (!isAuthenticated) {
      navigate('/auth/login')
      return
    }
    setMessaging(seeker.user_id)
    try {
      const res = await chatApi.getOrCreateConversation(seeker.user_id)
      navigate(`/chat/${res.data.id}`)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Could not start conversation')
    } finally {
      setMessaging(null)
    }
  }

  // Graceful screen for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgba(15,23,42,0.015)] max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6">
              <MessageSquare size={28} className="text-indigo-600 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-2">Candidate Directory</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 font-medium">
              Browse profiles of top professionals who are actively looking for their next challenge. Connect, message, and review portfolios today.
            </p>
            <div className="flex flex-col gap-2">
              <Link to="/auth/login" className="px-5 py-3 rounded-xl font-bold text-sm bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 text-center transition-all">
                Log In to Directory
              </Link>
              <Link to="/auth/signup" className="px-4 py-3 bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 text-slate-600 font-bold text-sm rounded-xl transition-all text-center">
                Create Free Account
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Client-side name/skill filter
  const displayed = seekers.filter((s) =>
    !searchInput || s.name.toLowerCase().includes(searchInput.toLowerCase()) ||
    (s.skills || []).some((sk) => sk.toLowerCase().includes(searchInput.toLowerCase()))
  )

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-60 h-60 bg-violet-50/30 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100/50 mb-3 uppercase tracking-wider">
            Talent Pool
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mb-1">
            Browse Job <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Seekers</span>
          </h1>
          <p className="text-sm text-slate-500 mb-8 max-w-xl font-medium leading-relaxed">
            Find talented candidates open to work — review their capabilities and message them instantly.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-[0_12px_30px_rgba(15,23,42,0.03)]">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="seekers-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or skill..."
                className="w-full bg-transparent pl-10 pr-4 py-2.5 outline-none text-slate-700 text-sm placeholder-slate-400"
              />
            </div>
            <div className="w-px h-8 bg-slate-100 hidden sm:block self-center" />
            <div className="relative sm:w-44">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="seekers-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="w-full bg-transparent pl-9 pr-4 py-2.5 outline-none text-slate-700 text-sm placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 pr-2 select-none">
              <input
                type="checkbox"
                id="open-to-work-check"
                checked={openOnly}
                onChange={(e) => {
                  setOpenOnly(e.target.checked)
                  fetchSeekers({ openOnly: e.target.checked })
                }}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
              />
              <label htmlFor="open-to-work-check" className="text-xs text-slate-600 font-bold cursor-pointer">
                Open to Work Only
              </label>
            </div>
            <button type="submit" className="btn-primary px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white shadow-md hover:bg-indigo-700 flex-shrink-0">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white border border-slate-100 rounded-3xl">
            <Loader size={32} className="text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Loading talented profiles...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgba(15,23,42,0.01)]">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Search size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No candidates found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              We couldn't find any job seekers matching your query. Try adjusting your skills search, checking different locations, or disabling the Open to Work filter.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">
              {displayed.length} candidate{displayed.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayed.map((seeker) => (
                <SeekerCard
                  key={seeker.user_id}
                  seeker={seeker}
                  onMessage={messaging === seeker.user_id ? () => {} : handleMessage}
                />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
