import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Users, Briefcase, Zap, BarChart2, TrendingUp, Clock } from 'lucide-react'
import Navbar from '../../../components/layout/Navbar'
import Sidebar from '../../../components/layout/Sidebar'
import { jobsApi } from '../../../api/jobs'
import { useAuth } from '../../../hooks/useAuth'
import { timeAgo } from '../../../lib/utils'

const SIDEBAR_ITEMS = [
  { href: '/dashboard/recruiter', label: 'Overview', icon: <BarChart2 size={16} /> },
  { href: '/dashboard/recruiter/post-job', label: 'Post a Job', icon: <PlusCircle size={16} /> },
  { href: '/payment/upgrade', label: 'Go Premium', icon: <Zap size={16} /> },
]

export default function RecruiterDashboard() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

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
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-text-primary">Welcome, {user?.name?.split(' ')[0]} 🎯</h1>
            <p className="text-text-muted text-sm mt-1">Manage your talent pipeline</p>
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

          {/* AI score callout */}
          <div className="card p-5 border-primary/20 bg-primary/5 mb-6 flex items-start gap-3">
            <Zap size={18} className="text-primary-light mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-text-primary">AI Resume Scoring Available</p>
              <p className="text-xs text-text-muted mt-0.5">Use AI scoring on applicants to surface the best candidates for your roles.</p>
              <Link to="/dashboard/recruiter/post-job" className="btn-primary btn-sm mt-3 text-xs">Post a Job to Get Applicants</Link>
            </div>
          </div>

          {/* Jobs */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-text-primary">Your Job Posts</h2>
            <Link to="/dashboard/recruiter/post-job" className="btn-primary btn-sm">
              <PlusCircle size={15} /> Post Job
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-semibold text-text-primary mb-2">No jobs posted yet</h3>
              <p className="text-text-muted text-sm mb-5">Post your first job to start building your talent pipeline</p>
              <Link to="/dashboard/recruiter/post-job" className="btn-primary">Post Your First Job</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {jobs.map((job) => (
                <div key={job.id} className="card p-4 flex items-center justify-between gap-4 hover:border-border-light transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-primary text-sm truncate">{job.title}</h3>
                      {job.is_featured && <span className="badge-featured text-[10px]">⭐ Featured</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-text-muted flex items-center gap-1"><Clock size={10} /> {timeAgo(job.created_at)}</span>
                      <span className="text-xs text-text-muted flex items-center gap-1"><Users size={10} /> {job.applicant_count || 0} applicants</span>
                    </div>
                  </div>
                  <Link to={`/dashboard/recruiter/jobs/${job.id}/applicants`} className="btn-secondary btn-sm flex-shrink-0 text-xs">
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
