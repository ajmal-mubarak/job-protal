import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Briefcase, ExternalLink, Globe, CheckCircle2, User, Loader, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { profilesApi } from '../../api/profiles'
import { chatApi } from '../../api/chat'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../lib/utils'

export default function PublicProfilePage() {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messaging, setMessaging] = useState(false)

  useEffect(() => {
    profilesApi.getPublicProfile(userId)
      .then(res => setProfile(res.data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [userId])

  const handleMessage = async () => {
    if (!currentUser) {
      toast.error('Please login to send messages')
      return
    }
    setMessaging(true)
    try {
      const res = await chatApi.getOrCreateConversation(userId)
      navigate(`/chat/${res.data.id}`)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Could not start conversation')
    } finally {
      setMessaging(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader size={28} className="text-indigo-600 animate-spin" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Profile Not Found</h2>
          <p className="text-slate-400 text-xs font-semibold mb-6">The user you are looking for does not exist.</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl shadow-sm transition-colors">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const isSeeker = profile.role === 'jobseeker'
  const isEmployer = profile.role === 'employer'
  const isRecruiter = profile.role === 'recruiter'

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 w-full px-4 py-8 animate-fade-in">
        <div className="max-w-5xl mx-auto w-full">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-white/80 border border-slate-100 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm mb-5"
          >
            <ArrowLeft size={13} /> Back
          </button>

          <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_12px_40px_rgba(15,23,42,0.02)] overflow-hidden transition-all">
            {/* Header / Cover */}
            <div className="h-32 bg-gradient-to-r from-indigo-50/70 via-violet-50/50 to-transparent relative">
              {profile.is_premium && (
                <div className="absolute top-4 right-4 inline-flex items-center px-2.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase tracking-wide">
                  ⭐ Premium {isEmployer ? 'Employer' : 'Recruiter'}
                </div>
              )}
            </div>

            <div className="px-6 sm:px-8 pb-8">
              {/* Avatar & Title Row */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 sm:-mt-14 mb-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-4 border-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                  {profile.avatar_url || profile.company_logo_url ? (
                    <img src={profile.avatar_url || profile.company_logo_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center text-4xl font-extrabold text-indigo-500">
                      {profile.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  {currentUser && currentUser.id !== profile.user_id && (
                    <button
                      onClick={handleMessage}
                      disabled={messaging}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-100 active:scale-95 disabled:opacity-50 flex-1 sm:flex-none"
                    >
                      {messaging ? <Loader size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                      Message Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                    {isEmployer && profile.company_name ? profile.company_name : profile.name}
                  </h1>
                  {profile.is_verified_badge && (
                    <CheckCircle2 size={18} className="text-indigo-500" fill="rgba(99,102,241,0.08)" />
                  )}
                </div>

                {/* Subtitle / Headline */}
                <p className="text-base font-bold text-slate-500 mb-4">
                  {isSeeker && profile.headline}
                  {isRecruiter && (profile.agency_name ? `Recruiter at ${profile.agency_name}` : 'Independent Recruiter')}
                  {isEmployer && !profile.company_name && 'Hiring Manager'}
                </p>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-400">
                  {profile.location && (
                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-300" />{profile.location}</span>
                  )}
                  {profile.experience_years > 0 && (
                    <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-slate-300" />{profile.experience_years} years experience</span>
                  )}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 transition-colors">
                      <Globe size={14} /> Website
                    </a>
                  )}
                  {isSeeker && profile.is_open_to_work && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Open to Work
                    </span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 my-6" />

              {/* Role Specific Content */}
              {isSeeker && (
                <div className="space-y-6">
                  {profile.skills?.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skills & Expertises</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map(s => (
                          <span key={s} className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100/30">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.resume_url && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resume (PDF)</h3>
                      <div>
                        <a
                          href={profile.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                        >
                          <ExternalLink size={13} /> View Resume Document
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isEmployer && profile.company_description && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">About the Company</h3>
                  <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-6 text-slate-600 leading-relaxed text-sm font-semibold whitespace-pre-wrap">
                    {profile.company_description}
                  </div>
                </div>
              )}

              {isRecruiter && profile.bio && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">About Me</h3>
                  <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-6 text-slate-600 leading-relaxed text-sm font-semibold whitespace-pre-wrap">
                    {profile.bio}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
