import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusCircle, Users, Briefcase, Eye, BarChart2, Zap, TrendingUp, Clock } from 'lucide-react'
import Navbar from '../../../components/layout/Navbar'
import Sidebar from '../../../components/layout/Sidebar'
import JobCard from '../../../components/JobCard'
import { jobsApi } from '../../../api/jobs'
import { useAuth } from '../../../hooks/useAuth'
import { timeAgo } from '../../../lib/utils'

const SIDEBAR_ITEMS = [
  { href: '/dashboard/employer', label: 'Overview', icon: <BarChart2 size={16} /> },
  { href: '/dashboard/employer/post-job', label: 'Post a Job', icon: <PlusCircle size={16} /> },
  { href: '/payment/upgrade', label: 'Go Premium', icon: <Zap size={16} /> },
]

export default function EmployerDashboard() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    jobsApi.myJobs()
      .then((res) => setJobs(res.data?.items || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicant_count || 0), 0)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex gap-8">
        <Sidebar items={SIDEBAR_ITEMS} />

        <main className="flex-1 min-w-0">
          {/* Welcome */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-text-primary">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-text-muted text-sm mt-1">Manage your job postings and applicants</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Posts', value: jobs.length, icon: <Briefcase size={18} className="text-primary-light" /> },
              { label: 'Active Jobs', value: jobs.filter(j => j.is_active).length, icon: <TrendingUp size={18} className="text-success" /> },
              { label: 'Total Applicants', value: totalApplicants, icon: <Users size={18} className="text-accent-light" /> },
              { label: 'Featured', value: jobs.filter(j => j.is_featured).length, icon: <Zap size={18} className="text-warning" /> },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-text-muted">{s.label}</p>
                  <div className="w-8 h-8 bg-surface-2 rounded-lg flex items-center justify-center">{s.icon}</div>
                </div>
                <p className="text-2xl font-bold text-text-primary">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Action row */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-text-primary">Your Job Posts</h2>
            <Link to="/dashboard/employer/post-job" className="btn-primary btn-sm">
              <PlusCircle size={15} /> Post Job
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="font-semibold text-text-primary mb-2">No jobs posted yet</h3>
              <p className="text-text-muted text-sm mb-5">Start attracting talent by posting your first job</p>
              <Link to="/dashboard/employer/post-job" className="btn-primary">Post Your First Job</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {jobs.map((job) => (
                <div key={job.id} className="card p-4 flex items-center justify-between gap-4 hover:border-border-light transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-text-primary text-sm truncate">{job.title}</h3>
                      {job.is_featured && <span className="badge-featured text-[10px]">⭐ Featured</span>}
                      {!job.is_active && <span className="badge-error text-[10px]">Closed</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-text-muted flex items-center gap-1"><Clock size={10} /> {timeAgo(job.created_at)}</span>
                      <span className="text-xs text-text-muted flex items-center gap-1"><Users size={10} /> {job.applicant_count || 0} applicants</span>
                      <span className="text-xs text-text-muted flex items-center gap-1"><Eye size={10} /> {job.view_count || 0} views</span>
                    </div>
                  </div>
                  <Link
                    to={`/dashboard/employer/jobs/${job.id}/applicants`}
                    className="btn-secondary btn-sm flex-shrink-0 text-xs"
                  >
                    View Applicants
                  </Link>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
