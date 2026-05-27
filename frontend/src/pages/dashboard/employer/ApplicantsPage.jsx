import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader, User, ExternalLink, Zap, BarChart2, PlusCircle, MessageSquare, Users } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../../../components/layout/Navbar'
import Sidebar from '../../../components/layout/Sidebar'
import { applicationsApi } from '../../../api/applications'
import { jobsApi } from '../../../api/jobs'
import { chatApi } from '../../../api/chat'
import { useAuth } from '../../../hooks/useAuth'
import { cn, timeAgo, statusColors } from '../../../lib/utils'

const STATUSES = ['applied', 'reviewing', 'shortlisted', 'rejected', 'hired']

const EMPLOYER_SIDEBAR = [
  { href: '/dashboard/employer', label: 'Overview', icon: <BarChart2 size={16} /> },
  { href: '/dashboard/employer/post-job', label: 'Post a Job', icon: <PlusCircle size={16} /> },
  { href: '/payment/upgrade', label: 'Go Premium', icon: <Zap size={16} /> },
]

const RECRUITER_SIDEBAR = [
  { href: '/dashboard/recruiter', label: 'Overview', icon: <BarChart2 size={16} /> },
  { href: '/dashboard/recruiter/post-job', label: 'Post a Job', icon: <PlusCircle size={16} /> },
  { href: '/payment/upgrade', label: 'Go Premium', icon: <Zap size={16} /> },
]

export default function ApplicantsPage() {
  const { jobId } = useParams()
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [jobTitle, setJobTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState({}) // appId -> loading

  const isRecruiter = user?.role === 'recruiter'
  const dashBase = isRecruiter ? '/dashboard/recruiter' : '/dashboard/employer'
  const sidebarItems = isRecruiter ? RECRUITER_SIDEBAR : EMPLOYER_SIDEBAR
  const navigate = useNavigate()
  const [messaging, setMessaging] = useState(null) // appId of in-progress message

  useEffect(() => {
    Promise.all([
      applicationsApi.forJob(jobId),
      jobsApi.get(jobId),
    ]).then(([appRes, jobRes]) => {
      setApplications(appRes.data || [])
      setJobTitle(jobRes.data?.title || 'Job')
    }).catch(() => {}).finally(() => setLoading(false))
  }, [jobId])

  const updateStatus = async (appId, status) => {
    try {
      await applicationsApi.updateStatus(appId, status)
      setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status } : a))
      toast.success('Status updated')
    } catch { toast.error('Failed to update status') }
  }

  const scoreResume = async (appId) => {
    setScoring((s) => ({ ...s, [appId]: true }))
    try {
      const res = await applicationsApi.scoreResume(appId)
      const updated = res.data
      setApplications((prev) => prev.map((a) => a.id === appId ? {
        ...a,
        ai_score: updated.ai_score,
        ai_feedback: updated.ai_feedback,
      } : a))
      toast.success(`AI Score: ${updated.ai_score}/100`)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'AI scoring failed')
    } finally {
      setScoring((s) => ({ ...s, [appId]: false }))
    }
  }

  const startChat = async (app) => {
    const targetUserId = app.applicant_user_id
    if (!targetUserId) {
      toast.error('Cannot start chat — applicant user ID not found')
      return
    }
    setMessaging(app.id)
    try {
      const res = await chatApi.getOrCreateConversation(targetUserId)
      navigate(`/chat/${res.data.id}`)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Could not start conversation')
    } finally {
      setMessaging(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex gap-8">
        <Sidebar items={sidebarItems} />

        <main className="flex-1 min-w-0">
          <Link to={dashBase} className="btn-ghost text-sm mb-5 inline-flex">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <div className="mb-5">
            <h1 className="text-xl font-bold text-text-primary">Applicants</h1>
            <p className="text-sm text-text-muted mt-0.5">{jobTitle} · {applications.length} application{applications.length !== 1 ? 's' : ''}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader size={24} className="text-primary animate-spin" />
            </div>
          ) : applications.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">📭</div>
              <h3 className="font-semibold text-text-primary mb-2">No applications yet</h3>
              <p className="text-text-muted text-sm">Applications will appear here when candidates apply</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {applications.map((app) => (
                <div key={app.id} className="card p-5 hover:border-border-light transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-3 border border-border flex items-center justify-center">
                        <User size={16} className="text-text-muted" />
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary text-sm">{app.applicant_name || 'Applicant'}</p>
                        <p className="text-xs text-text-muted">{app.applicant_email || '—'} · {timeAgo(app.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.ai_score !== null && app.ai_score !== undefined && (
                        <div className={cn('badge', app.ai_score >= 70 ? 'badge-success' : app.ai_score >= 40 ? 'badge-warning' : 'badge-error')}>
                          AI: {app.ai_score}/100
                        </div>
                      )}
                      <span className={cn('badge', statusColors[app.status] || 'badge-muted', 'capitalize')}>{app.status}</span>
                    </div>
                  </div>

                  {app.cover_letter && (
                    <p className="text-xs text-text-secondary bg-surface-2 rounded-lg p-3 mb-3 line-clamp-2">{app.cover_letter}</p>
                  )}

                  {/* AI Feedback Panel */}
                  {app.ai_score != null && (() => {
                    let fb = null
                    try { fb = app.ai_feedback ? JSON.parse(app.ai_feedback) : null } catch {}
                    if (!fb) return null
                    return (
                      <div className="bg-surface-2 border border-border rounded-xl p-4 mb-3 text-xs">
                        {/* Score bar */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className="font-bold text-text-primary text-sm">AI Match</span>
                          <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all', app.ai_score >= 70 ? 'bg-emerald-500' : app.ai_score >= 40 ? 'bg-amber-500' : 'bg-rose-500')}
                              style={{ width: `${app.ai_score}%` }}
                            />
                          </div>
                          <span className={cn('font-extrabold text-sm', app.ai_score >= 70 ? 'text-emerald-600' : app.ai_score >= 40 ? 'text-amber-600' : 'text-rose-600')}>
                            {app.ai_score}/100
                          </span>
                        </div>
                        {fb.summary && <p className="text-text-secondary mb-3 leading-relaxed">{fb.summary}</p>}
                        <div className="grid grid-cols-2 gap-3">
                          {fb.strengths?.length > 0 && (
                            <div>
                              <p className="font-bold text-emerald-600 mb-1.5">✓ Strengths</p>
                              <ul className="space-y-1">
                                {fb.strengths.map((s, i) => <li key={i} className="text-text-secondary">• {s}</li>)}
                              </ul>
                            </div>
                          )}
                          {fb.gaps?.length > 0 && (
                            <div>
                              <p className="font-bold text-rose-600 mb-1.5">✗ Gaps</p>
                              <ul className="space-y-1">
                                {fb.gaps.map((g, i) => <li key={i} className="text-text-secondary">• {g}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  <div className="flex flex-wrap items-center gap-2">
                    {app.resume_url && (
                      <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm text-xs">
                        <ExternalLink size={12} /> Resume
                      </a>
                    )}

                    <Link to={`/profiles/${app.applicant_user_id}`} className="btn-ghost btn-sm text-xs flex items-center gap-1">
                      <User size={12} /> Profile
                    </Link>

                    {/* AI Score button — visible to employer and recruiter */}
                    <button
                      id={`ai-score-btn-${app.id}`}
                      onClick={() => scoreResume(app.id)}
                      disabled={scoring[app.id]}
                      className="btn-secondary btn-sm text-xs"
                    >
                      {scoring[app.id] ? <Loader size={12} className="animate-spin" /> : <Zap size={12} />}
                      {app.ai_score != null ? 'Re-score' : 'AI Score'}
                    </button>

                    {/* Message applicant */}
                    <button
                      id={`msg-applicant-${app.id}`}
                      onClick={() => startChat(app)}
                      disabled={messaging === app.id}
                      className="btn-ghost btn-sm text-xs flex items-center gap-1"
                    >
                      {messaging === app.id
                        ? <Loader size={12} className="animate-spin" />
                        : <MessageSquare size={12} />}
                      Message
                    </button>

                    {/* Status update */}
                    <div className="ml-auto flex items-center gap-1">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(app.id, s)}
                          className={cn(
                            'text-[10px] px-2 py-1 rounded-lg border transition-all capitalize',
                            app.status === s
                              ? 'bg-primary/10 border-primary/30 text-primary-light'
                              : 'border-border text-text-muted hover:border-border-light hover:text-text-secondary'
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
