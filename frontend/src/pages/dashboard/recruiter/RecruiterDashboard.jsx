import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Users, Briefcase, Zap, BarChart2, TrendingUp, Clock, Eye, Pencil } from 'lucide-react'
import Navbar from '../../../components/layout/Navbar'
import Sidebar from '../../../components/layout/Sidebar'
import { jobsApi } from '../../../api/jobs'
import { useAuth } from '../../../hooks/useAuth'
import { cn, timeAgo } from '../../../lib/utils'

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
    <div className="min-h-screen flex flex-col">
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
              { label: 'Total Posts', value: jobs.length, bg: 'bg-indigo-50/50', text: 'text-indigo-600', icon: <Briefcase size={16} /> },
              { label: 'Active Jobs', value: jobs.filter(j => j.is_active).length, bg: 'bg-emerald-50/50', text: 'text-emerald-600', icon: <TrendingUp size={16} /> },
              { label: 'Total Applicants', value: totalApplicants, bg: 'bg-violet-50/50', text: 'text-violet-600', icon: <Users size={16} /> },
              { label: 'Featured', value: jobs.filter(j => j.is_featured).length, bg: 'bg-amber-50/50', text: 'text-amber-600', icon: <Zap size={16} /> },
            ].map((s) => (
              <div key={s.label} className="card p-5 flex flex-col gap-2 hover:border-border-light transition-all duration-300 cursor-default">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted font-bold">{s.label}</span>
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', s.bg, s.text)}>
                    {s.icon}
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-text-primary">{s.value}</p>
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
                <div key={job.id} className="card card-hover p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h3 className="font-bold text-text-primary text-sm sm:text-base truncate">{job.title}</h3>
                      {job.is_featured && (
                        <span className="badge text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">
                          ⭐ Featured
                        </span>
                      )}
                      {!job.is_active && (
                        <span className="badge text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100">
                          Closed
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-xs text-text-muted font-semibold flex items-center gap-1">
                        <Clock size={12} className="text-border-light" /> {timeAgo(job.created_at)}
                      </span>
                      <span className="text-border-light text-xs hidden sm:inline">·</span>
                      <span className="text-xs text-text-muted font-semibold flex items-center gap-1">
                        <Users size={12} className="text-border-light" /> {job.applicant_count || 0} applicants
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                    <Link
                      to={`/dashboard/recruiter/jobs/${job.id}/edit`}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-text-secondary bg-surface-2 hover:bg-surface-3 border border-border transition-colors flex items-center gap-1"
                      title="Edit job"
                    >
                      <Pencil size={13} /> Edit
                    </Link>
                    <Link
                      to={`/jobs/${job.id}`}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-text-secondary bg-surface-2 hover:bg-surface-3 border border-border transition-colors flex items-center gap-1"
                      title="View public job detail"
                    >
                      <Eye size={13} /> View
                    </Link>
                    <Link
                      to={`/dashboard/recruiter/jobs/${job.id}/applicants`}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-primary bg-primary-muted hover:bg-primary hover:text-white border border-border-light transition-all flex items-center gap-1"
                    >
                      <Users size={13} /> Applicants ({job.applicant_count || 0})
                    </Link>
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
