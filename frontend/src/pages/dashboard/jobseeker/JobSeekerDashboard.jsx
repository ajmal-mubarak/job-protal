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
    <div className="min-h-screen flex flex-col bg-background">
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
              { label: 'Applied', value: stats.total, color: 'text-primary-light' },
              { label: 'In Review', value: stats.pending, color: 'text-warning' },
              { label: 'Shortlisted', value: stats.shortlisted, color: 'text-success' },
              { label: 'Hired', value: stats.hired, color: 'text-success' },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <p className="text-xs text-text-muted mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
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
              <h2 className="font-semibold text-text-primary mb-4">Your Applications</h2>
              <div className="flex flex-col gap-3">
                {applications.map((app) => (
                  <div key={app.id} className="card p-5 hover:border-border-light transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link to={`/jobs/${app.job_id}`} className="font-semibold text-text-primary hover:text-primary-light transition-colors text-sm">
                          {app.job_title || 'Job'}
                        </Link>
                        <p className="text-xs text-text-muted mt-0.5">{app.company_name || 'Company'}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {app.ai_score != null && (
                          <span className={cn('badge', app.ai_score >= 70 ? 'badge-success' : app.ai_score >= 40 ? 'badge-warning' : 'badge-error')}>
                            AI: {app.ai_score}/100
                          </span>
                        )}
                        <span className={cn('badge capitalize', statusColors[app.status] || 'badge-muted')}>
                          {app.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Clock size={10} /> Applied {timeAgo(app.created_at)}
                      </span>
                      {app.resume_url && (
                        <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:text-primary-light flex items-center gap-0.5 transition-colors">
                          <ExternalLink size={11} /> View Resume
                        </a>
                      )}
                    </div>

                    {app.cover_letter && (
                      <p className="text-xs text-text-secondary bg-surface-2 rounded-lg p-2.5 mt-2 line-clamp-2">{app.cover_letter}</p>
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
