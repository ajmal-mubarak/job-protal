import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, BarChart2, ExternalLink, Clock, Pencil, Trash2, X, Check, Loader } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../../../components/layout/Navbar'
import Sidebar from '../../../components/layout/Sidebar'
import { applicationsApi } from '../../../api/applications'
import { useAuth } from '../../../hooks/useAuth'
import { cn, timeAgo } from '../../../lib/utils'

const SIDEBAR_ITEMS = [
  { href: '/dashboard/jobseeker', label: 'My Applications', icon: <BarChart2 size={16} /> },
  { href: '/jobs', label: 'Browse Jobs', icon: <Briefcase size={16} /> },
]

const STATUS_STYLE = {
  hired:       'bg-violet-50 text-violet-600 border-violet-100',
  shortlisted: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  rejected:    'bg-rose-50 text-rose-600 border-rose-100',
  reviewing:   'bg-amber-50 text-amber-600 border-amber-100',
  applied:     'bg-surface-2 text-text-muted border-border',
}

export default function JobSeekerDashboard() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  // Edit cover letter state
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)

  // Withdraw confirm state
  const [withdrawingId, setWithdrawingId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    applicationsApi.myApplications()
      .then((res) => setApplications(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total:       applications.length,
    pending:     applications.filter(a => ['applied', 'reviewing'].includes(a.status)).length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    hired:       applications.filter(a => a.status === 'hired').length,
  }

  // ── Edit cover letter ──────────────────────────────────────────────────────
  const startEdit = (app) => {
    setEditingId(app.id)
    setEditText(app.cover_letter || '')
    setConfirmId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEdit = async (appId) => {
    setSaving(true)
    try {
      await applicationsApi.updateCoverLetter(appId, editText)
      setApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, cover_letter: editText } : a)
      )
      toast.success('Cover letter updated!')
      setEditingId(null)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to update cover letter')
    } finally {
      setSaving(false)
    }
  }

  // ── Withdraw application ───────────────────────────────────────────────────
  const withdraw = async (appId) => {
    setWithdrawingId(appId)
    try {
      await applicationsApi.withdraw(appId)
      setApplications(prev => prev.filter(a => a.id !== appId))
      toast.success('Application withdrawn')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Cannot withdraw this application')
    } finally {
      setWithdrawingId(null)
      setConfirmId(null)
    }
  }

  const canEdit     = (app) => ['applied', 'reviewing'].includes(app.status)
  const canWithdraw = (app) => ['applied', 'reviewing'].includes(app.status)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex gap-8">
        <Sidebar items={SIDEBAR_ITEMS} />

        <main className="flex-1 min-w-0">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-text-primary">Hey, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-text-muted text-sm mt-1">Track your job applications</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Applied',     value: stats.total,       color: 'text-indigo-600 bg-indigo-50/50' },
              { label: 'In Review',   value: stats.pending,     color: 'text-amber-600 bg-amber-50/50' },
              { label: 'Shortlisted', value: stats.shortlisted, color: 'text-emerald-600 bg-emerald-50/50' },
              { label: 'Hired',       value: stats.hired,       color: 'text-violet-600 bg-violet-50/50' },
            ].map((s) => (
              <div key={s.label} className="card p-5 flex flex-col gap-1 hover:border-border-light transition-all duration-300 cursor-default">
                <span className={cn('w-max text-[10px] font-bold px-2 py-0.5 rounded-lg mb-1', s.color)}>{s.label}</span>
                <p className="text-2xl font-extrabold text-text-primary">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {!loading && applications.length === 0 && (
            <div className="card p-12 text-center mb-6">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-semibold text-text-primary mb-2">No applications yet</h3>
              <p className="text-text-muted text-sm mb-5">Browse jobs and apply to get started</p>
              <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {/* Applications list */}
          {applications.length > 0 && (
            <>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Your Applications</h2>
              <div className="flex flex-col gap-3">
                {applications.map((app) => (
                  <div key={app.id} className="card card-hover p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link to={`/jobs/${app.job_id}`} className="font-bold text-text-primary hover:text-primary transition-colors text-sm sm:text-base">
                          {app.job_title || 'Job'}
                        </Link>
                        <p className="text-xs text-text-muted font-semibold mt-0.5">{app.company_name || 'Company'}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                        {app.ai_score != null && (
                          <span className={cn('badge text-[10px] font-bold px-2 py-1 rounded-lg border',
                            app.ai_score >= 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            app.ai_score >= 40 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-rose-50 text-rose-600 border-rose-100'
                          )}>
                            AI: {app.ai_score}/100
                          </span>
                        )}
                        <span className={cn('badge capitalize text-[10px] font-bold px-2 py-1 rounded-lg border', STATUS_STYLE[app.status] || STATUS_STYLE.applied)}>
                          {app.status}
                        </span>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-text-muted font-semibold flex items-center gap-1">
                        <Clock size={12} className="text-border-light" /> Applied {timeAgo(app.created_at)}
                      </span>
                      {app.resume_url && (
                        <>
                          <span className="text-border-light text-xs">·</span>
                          <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-0.5 transition-colors">
                            <ExternalLink size={12} /> View Resume
                          </a>
                        </>
                      )}
                    </div>

                    {/* Cover letter — view / edit */}
                    {editingId === app.id ? (
                      <div className="mt-3">
                        <textarea
                          id={`edit-cover-${app.id}`}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={4}
                          placeholder="Update your cover letter..."
                          className="input resize-none text-xs w-full"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            id={`save-cover-${app.id}`}
                            onClick={() => saveEdit(app.id)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all"
                          >
                            {saving ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 text-text-secondary text-xs font-bold hover:bg-surface-3 border border-border transition-all"
                          >
                            <X size={12} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      app.cover_letter && (
                        <p className="text-xs text-text-secondary bg-surface-2 border border-border rounded-xl p-3 mt-3 line-clamp-2 italic leading-relaxed">
                          "{app.cover_letter}"
                        </p>
                      )
                    )}

                    {/* Action buttons */}
                    {(canEdit(app) || canWithdraw(app)) && editingId !== app.id && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                        {canEdit(app) && (
                          <button
                            id={`edit-cover-btn-${app.id}`}
                            onClick={() => startEdit(app)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 text-text-secondary text-xs font-bold hover:bg-surface-3 border border-border transition-all"
                          >
                            <Pencil size={12} /> Edit Cover Letter
                          </button>
                        )}
                        {canWithdraw(app) && (
                          confirmId === app.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-text-muted font-semibold">Confirm withdraw?</span>
                              <button
                                id={`confirm-withdraw-${app.id}`}
                                onClick={() => withdraw(app.id)}
                                disabled={withdrawingId === app.id}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all"
                              >
                                {withdrawingId === app.id ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                                Yes, Withdraw
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-2 text-text-secondary text-xs font-bold hover:bg-surface-3 border border-border transition-all"
                              >
                                <X size={12} /> Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`withdraw-btn-${app.id}`}
                              onClick={() => setConfirmId(app.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 border border-rose-100 transition-all"
                            >
                              <Trash2 size={12} /> Withdraw
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
