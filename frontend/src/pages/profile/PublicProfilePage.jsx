import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Briefcase, ExternalLink, Globe, CheckCircle2, User, Loader, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { profilesApi } from '../../api/profiles'
import { chatApi } from '../../api/chat'
import { useAuth } from '../../hooks/useAuth'

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
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader size={32} className="text-primary animate-spin" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-text-muted mb-6">The user you are looking for does not exist.</p>
          <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
        </div>
      </div>
    )
  }

  const isSeeker = profile.role === 'jobseeker'
  const isEmployer = profile.role === 'employer'
  const isRecruiter = profile.role === 'recruiter'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 w-full px-4 py-6">
        <div className="max-w-5xl mx-auto w-full">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm mb-4 inline-flex">
            <ArrowLeft size={14} /> Back
          </button>

          <div className="card overflow-hidden">
            {/* Header / Cover */}
            <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative">
              {profile.is_premium && (
                <div className="absolute top-4 right-4 badge badge-warning">
                  Premium {isEmployer ? 'Employer' : 'Recruiter'}
                </div>
              )}
            </div>

            <div className="px-6 sm:px-8 pb-8">
              {/* Avatar & Title Row */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 sm:-mt-14 mb-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-surface border-4 border-background flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xl">
                  {profile.avatar_url || profile.company_logo_url ? (
                    <img src={profile.avatar_url || profile.company_logo_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-text-muted" />
                  )}
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  {currentUser && currentUser.id !== profile.user_id && (
                    <button
                      onClick={handleMessage}
                      disabled={messaging}
                      className="btn-primary flex-1 sm:flex-none py-2 px-6"
                    >
                      {messaging ? <Loader size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                      Message
                    </button>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-bold text-text-primary">
                    {isEmployer && profile.company_name ? profile.company_name : profile.name}
                  </h1>
                  {profile.is_verified_badge && (
                    <CheckCircle2 size={20} className="text-primary-light" fill="currentColor" stroke="var(--color-surface)" />
                  )}
                </div>

                {/* Subtitle / Headline */}
                <p className="text-lg text-text-secondary mb-3">
                  {isSeeker && profile.headline}
                  {isRecruiter && profile.agency_name}
                  {isEmployer && !profile.company_name && 'Employer'}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
                  {profile.location && (
                    <span className="flex items-center gap-1.5"><MapPin size={16} />{profile.location}</span>
                  )}
                  {profile.experience_years > 0 && (
                    <span className="flex items-center gap-1.5"><Briefcase size={16} />{profile.experience_years} years exp</span>
                  )}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                      <Globe size={16} /> Website
                    </a>
                  )}
                  {isSeeker && profile.is_open_to_work && (
                    <span className="badge badge-success bg-success/10 text-success border-success/20 py-1">Open to Work</span>
                  )}
                </div>
              </div>

              {/* Role Specific Content */}
              {isSeeker && (
                <div className="space-y-6">
                  {profile.skills?.length > 0 && (
                    <div>
                      <h3 className="text-base font-semibold mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map(s => (
                          <span key={s} className="badge badge-muted px-3 py-1.5 text-sm">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.resume_url && (
                    <div>
                      <h3 className="text-base font-semibold mb-2">Resume</h3>
                      <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex">
                        <ExternalLink size={16} /> View Resume Document
                      </a>
                    </div>
                  )}
                </div>
              )}

              {isEmployer && profile.company_description && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">About the Company</h3>
                  <div className="text-text-secondary whitespace-pre-wrap leading-relaxed bg-surface-2 p-5 rounded-xl">
                    {profile.company_description}
                  </div>
                </div>
              )}

              {isRecruiter && profile.bio && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">About Me</h3>
                  <div className="text-text-secondary whitespace-pre-wrap leading-relaxed bg-surface-2 p-5 rounded-xl">
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
