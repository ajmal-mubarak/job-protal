import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Clock, Briefcase, TrendingUp, Star, ArrowLeft, Send, Loader, AlertCircle, Upload } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { jobsApi } from '../../api/jobs'
import { applicationsApi } from '../../api/applications'
import { useAuth } from '../../hooks/useAuth'
import { cn, timeAgo, formatSalary, jobTypeLabels } from '../../lib/utils'

function ApplyModal({ job, onClose }) {
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!resumeUrl) { toast.error('Please provide your resume URL'); return }
    setLoading(true)
    try {
      await applicationsApi.apply({
        job_id: job.id,
        resume_url: resumeUrl,
        cover_letter: coverLetter,
      })
      toast.success('Application submitted successfully!')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Application failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-6 animate-slide-up shadow-glow">
        <h2 className="text-lg font-bold text-text-primary mb-1">Apply for: {job.title}</h2>
        <p className="text-sm text-text-muted mb-5">{job.company_name || 'Confidential'}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="label">Resume URL *</label>
            <input
              id="apply-resume-url"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              type="url"
              placeholder="https://drive.google.com/..."
              className="input"
            />
            <p className="text-xs text-text-muted mt-1">Paste a link to your resume (Google Drive, Dropbox, etc.)</p>
          </div>

          <div className="form-group">
            <label className="label">Cover Letter (optional)</label>
            <textarea
              id="apply-cover-letter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
              placeholder="Why are you a great fit for this role?"
              className="input resize-none"
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button id="apply-submit" type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <Loader size={16} className="animate-spin" /> : <><Send size={15} /> Submit</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, canApply, isJobSeeker } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showApply, setShowApply] = useState(false)

  useEffect(() => {
    jobsApi.get(id)
      .then((res) => setJob(res.data))
      .catch(() => navigate('/jobs'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader size={28} className="text-primary animate-spin" />
      </div>
    )
  }

  if (!job) return null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 section-sm">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm mb-5">
            <ArrowLeft size={15} /> Back
          </button>

          {/* Header card */}
          <div className={cn('card p-6 mb-4', job.is_featured && 'border-warning/30 bg-gradient-to-br from-warning/5 to-transparent')}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-surface-3 border border-border flex items-center justify-center">
                  <Briefcase size={22} className="text-text-muted" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-text-primary">{job.title}</h1>
                    {job.is_featured && <span className="badge-featured"><Star size={11} fill="currentColor" /> Featured</span>}
                  </div>
                  <p className="text-text-secondary mt-0.5">{job.company_name || 'Confidential'}</p>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 mb-5 text-sm text-text-secondary">
              {job.location && (
                <span className="flex items-center gap-1.5"><MapPin size={14} /> {job.location}</span>
              )}
              {job.job_type && (
                <span className="flex items-center gap-1.5"><TrendingUp size={14} /> {jobTypeLabels[job.job_type] || job.job_type}</span>
              )}
              <span className="flex items-center gap-1.5"><Clock size={14} /> Posted {timeAgo(job.created_at)}</span>
            </div>

            {/* Salary */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-text-muted mb-0.5">Salary</p>
                <p className="text-xl font-bold text-primary-light">{formatSalary(job.salary_min, job.salary_max)}</p>
              </div>
              {canApply ? (
                <button id="apply-btn" onClick={() => setShowApply(true)} className="btn-primary">
                  <Send size={15} /> Apply Now
                </button>
              ) : !isAuthenticated ? (
                <Link to="/auth/login" className="btn-primary">
                  Login to Apply
                </Link>
              ) : (
                <span className="text-xs text-text-muted bg-surface-2 border border-border px-3 py-2 rounded-xl">
                  {isJobSeeker ? 'Already a seeker' : 'Not eligible to apply'}
                </span>
              )}
            </div>
          </div>

          {/* Skills */}
          {job.skills_required?.length > 0 && (
            <div className="card p-5 mb-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills_required.map((skill) => (
                  <span key={skill} className="badge badge-primary">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="card p-5 mb-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Job Description</h2>
            <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
              {job.description || 'No description provided.'}
            </div>
          </div>

          {/* Bottom apply */}
          {canApply && (
            <div className="card p-5 flex items-center justify-between gap-4">
              <p className="text-sm text-text-muted">Interested in this role? Don't miss out.</p>
              <button onClick={() => setShowApply(true)} className="btn-primary">
                Apply Now <Send size={15} />
              </button>
            </div>
          )}

          {!isAuthenticated && (
            <div className="card p-5 flex items-center gap-3 border-primary/20 bg-primary/5">
              <AlertCircle size={18} className="text-primary-light flex-shrink-0" />
              <p className="text-sm text-text-secondary">
                <Link to="/auth/login" className="text-primary hover:text-primary-light font-medium">Sign in</Link> or{' '}
                <Link to="/auth/signup" className="text-primary hover:text-primary-light font-medium">create an account</Link> to apply.
              </p>
            </div>
          )}
        </div>
      </main>

      {showApply && <ApplyModal job={job} onClose={() => setShowApply(false)} />}
      <Footer />
    </div>
  )
}
