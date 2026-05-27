import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, BookmarkCheck, UserCircle, BarChart2, ExternalLink, Clock } from 'lucide-react'
import Navbar from '../../../components/layout/Navbar'
import Sidebar from '../../../components/layout/Sidebar'
import { applicationsApi } from '../../../api/applications'
import { useAuth } from '../../../hooks/useAuth'
import { cn, timeAgo, statusColors } from '../../../lib/utils'

const SIDEBAR_ITEMS = [
  { href: '/dashboard/jobseeker', label: 'My Applications', icon: <BarChart2 size={16} /> },
  { href: '/jobs', label: 'Browse Jobs', icon: <Briefcase size={16} /> },
]

export default function JobSeekerDashboard() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    applicationsApi.myApplications()
      .then((res) => setApplications(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: applications.length,
    pending: applications.filter(a => ['applied', 'reviewing'].includes(a.status)).length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    hired: applications.filter(a => a.status === 'hired').length,
  }

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
              { label: 'Applied', value: stats.total, color: 'text-indigo-600 bg-indigo-50/50' },
              { label: 'In Review', value: stats.pending, color: 'text-amber-600 bg-amber-50/50' },
              { label: 'Shortlisted', value: stats.shortlisted, color: 'text-emerald-600 bg-emerald-50/50' },
              { label: 'Hired', value: stats.hired, color: 'text-violet-600 bg-violet-50/50' },
            ].map((s) => (
              <div key={s.label} className="card p-5 flex flex-col gap-1 hover:border-border-light transition-all duration-300 cursor-default">
                <span className={cn('w-max text-[10px] font-bold px-2 py-0.5 rounded-lg mb-1', s.color)}>
                  {s.label}
                </span>
                <p className="text-2xl font-extrabold text-text-primary">{s.value}</p>
              </div>
            ))}
          </div>

          {/* CTA if no apps */}
          {!loading && applications.length === 0 && (
            <div className="card p-12 text-center mb-6">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-semibold text-text-primary mb-2">No applications yet</h3>
              <p className="text-text-muted text-sm mb-5">Browse jobs and apply to get started</p>
              <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
            </div>
          )}

          {/* Applications list */}
          {applications.length > 0 && (
            <>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Your Applications</h2>
              <div className="flex flex-col gap-3">
                {applications.map((app) => (
                  <div key={app.id} className="card card-hover p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link to={`/jobs/${app.job_id}`} className="font-bold text-text-primary hover:text-primary transition-colors text-sm sm:text-base">
                          {app.job_title || 'Job'}
                        </Link>
                        <p className="text-xs text-text-muted font-semibold mt-0.5">{app.company_name || 'Company'}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {app.ai_score != null && (
                          <span className={cn('badge text-[10px] font-bold px-2 py-1 rounded-lg border', 
                            app.ai_score >= 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            app.ai_score >= 40 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                            'bg-rose-50 text-rose-600 border-rose-100'
                          )}>
                            AI Match: {app.ai_score}/100
                          </span>
                        )}
                        <span className={cn('badge capitalize text-[10px] font-bold px-2 py-1 rounded-lg border', 
                          app.status === 'hired' ? 'bg-violet-50 text-violet-600 border-violet-100' :
                          app.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          app.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          app.status === 'reviewing' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-surface-2 text-text-muted border-border'
                        )}>
                          {app.status}
                        </span>
                      </div>
                    </div>

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

                    {app.cover_letter && (
                      <p className="text-xs text-text-secondary bg-surface-2 border border-border rounded-xl p-3 mt-3 line-clamp-2 italic leading-relaxed">
                        "{app.cover_letter}"
                      </p>
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
