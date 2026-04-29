import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MessageSquare, MapPin, Briefcase, Loader, Filter } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../../components/layout/Navbar'
import { profilesApi } from '../../api/profiles'
import { chatApi } from '../../api/chat'
import { cn } from '../../lib/utils'

function SeekerCard({ seeker, onMessage }) {
  return (
    <div className="card p-5 hover:border-border-light transition-all duration-200 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-lg font-bold text-primary-light flex-shrink-0">
          {seeker.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-text-primary text-sm">{seeker.name}</p>
            {seeker.is_open_to_work && (
              <span className="badge badge-success text-[10px]">Open to Work</span>
            )}
          </div>
          {seeker.headline && (
            <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{seeker.headline}</p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
            {seeker.location && (
              <span className="flex items-center gap-1"><MapPin size={10} />{seeker.location}</span>
            )}
            {seeker.experience_years > 0 && (
              <span className="flex items-center gap-1"><Briefcase size={10} />{seeker.experience_years} yr{seeker.experience_years !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>

      {/* Skills */}
      {seeker.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {seeker.skills.slice(0, 5).map((s) => (
            <span key={s} className="badge badge-muted text-xs">{s}</span>
          ))}
          {seeker.skills.length > 5 && (
            <span className="badge badge-muted text-xs">+{seeker.skills.length - 5}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        {seeker.resume_url && (
          <a
            href={seeker.resume_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost btn-sm text-xs flex-1 text-center"
          >
            View Resume
          </a>
        )}
        <button
          id={`msg-seeker-${seeker.user_id}`}
          onClick={() => onMessage(seeker)}
          className="btn-primary btn-sm text-xs flex items-center gap-1.5 flex-1 justify-center"
        >
          <MessageSquare size={13} /> Message
        </button>
      </div>
    </div>
  )
}

export default function SeekersPage() {
  const navigate = useNavigate()
  const [seekers, setSeekers] = useState([])
  const [loading, setLoading] = useState(true)
  const [messaging, setMessaging] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [skills, setSkills] = useState('')
  const [location, setLocation] = useState('')
  const [openOnly, setOpenOnly] = useState(true)

  const fetchSeekers = async (params = {}) => {
    setLoading(true)
    try {
      const res = await profilesApi.listSeekers({
        open_to_work: params.openOnly ?? openOnly,
        skills: params.skills ?? (skills || undefined),
        location: params.location ?? (location || undefined),
      })
      setSeekers(res.data || [])
    } catch {
      toast.error('Failed to load job seekers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSeekers() }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setSkills(searchInput)
    fetchSeekers({ skills: searchInput || undefined, location: location || undefined })
  }

  const handleMessage = async (seeker) => {
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

  // Client-side name filter
  const displayed = seekers.filter((s) =>
    !searchInput || s.name.toLowerCase().includes(searchInput.toLowerCase()) ||
    (s.skills || []).some((sk) => sk.toLowerCase().includes(searchInput.toLowerCase()))
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <div className="bg-surface border-b border-border px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-text-primary mb-1">Browse Job Seekers</h1>
          <p className="text-text-muted text-sm mb-5">Find candidates open to work and message them directly</p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                id="seekers-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or skill..."
                className="input pl-10"
              />
            </div>
            <input
              id="seekers-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="input sm:w-44"
            />
            <label className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => {
                  setOpenOnly(e.target.checked)
                  fetchSeekers({ openOnly: e.target.checked })
                }}
                className="accent-primary"
              />
              Open to Work only
            </label>
            <button type="submit" className="btn-primary flex-shrink-0">Search</button>
          </form>
        </div>
      </div>

      {/* Results */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader size={28} className="text-primary animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No seekers found</h3>
            <p className="text-text-muted text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-text-muted mb-5">
              {displayed.length} seeker{displayed.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  )
}
