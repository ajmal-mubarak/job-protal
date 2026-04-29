import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  MapPin, Clock, Briefcase, TrendingUp, Star, ArrowLeft,
  Send, Loader, AlertCircle, Upload, FileText, CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { jobsApi } from '../../api/jobs'
import { applicationsApi } from '../../api/applications'
import { profilesApi } from '../../api/profiles'
import { useAuth } from '../../hooks/useAuth'
import { cn, timeAgo, formatSalary, jobTypeLabels } from '../../lib/utils'

// ── Apply Modal ───────────────────────────────────────────────────────────────
function ApplyModal({ job, onClose }) {
  const [coverLetter, setCoverLetter] = useState('')
  const [profileResume, setProfileResume] = useState(null)
  const [newFile, setNewFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const fileRef = useRef()

  // Pre-load stored resume from profile
  useEffect(() => {
    profilesApi.getMe()
      .then((res) => setProfileResume(res.data?.resume_url || null))
      .catch(() => {})
      .finally(() => setLoadingProfile(false))
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are accepted')
      return
    }
    setNewFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    let finalResumeUrl = profileResume

    if (newFile) {
      setUploading(true)
      try {
        const upRes = await profilesApi.uploadResume(newFile)
        finalResumeUrl = upRes.data.url
      } catch {
        toast.error('Resume upload failed')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    if (!finalResumeUrl) {
      toast.error('Please upload a PDF resume to apply')
      return
    }

    setSubmitting(true)
    try {
      await applicationsApi.apply({
        job_id: job.id,
        resume_url: finalResumeUrl,
        cover_letter: coverLetter,
      })
      toast.success('Application submitted!')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Application failed')
    } finally {
      setSubmitting(false)
    }
  }

  const busy = uploading || submitting

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-6 animate-slide-up shadow-glow">
        <h2 className="text-lg font-bold text-text-primary mb-1">Apply for: {job.title}</h2>
        <p className="text-sm text-text-muted mb-5">{job.company_name || 'Confidential'}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Resume */}
          <div className="form-group">
            <label className="label">Resume (PDF)</label>

            {loadingProfile ? (
              <div className="flex items-center gap-2 text-sm text-text-muted py-2">
                <Loader size={14} className="animate-spin" /> Loading your profile resume...
              </div>
            ) : profileResume && !newFile ? (
              <div className="flex items-center justify-between bg-surface-2 border border-border rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <CheckCircle size={14} className="text-success flex-shrink-0" />
                  <a href={profileResume} target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:text-primary-light truncate max-w-[200px]">
                    Profile resume
                  </a>
                  <span className="text-text-muted text-xs">(auto-attached)</span>
                </div>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors flex-shrink-0 ml-2">
                  Replace
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'w-full border-2 border-dashed rounded-xl px-4 py-5 flex flex-col items-center gap-2 transition-colors',
                  newFile ? 'border-success/40 bg-success/5' : 'border-border hover:border-border-light'
                )}
              >
                {newFile ? (
                  <>
                    <FileText size={20} className="text-success" />
                    <p className="text-sm text-text-primary font-medium">{newFile.name}</p>
                    <p className="text-xs text-text-muted">Click to change</p>
                  </>
                ) : (
                  <>
                    <Upload size={20} className="text-text-muted" />
                    <p className="text-sm text-text-muted">Click to upload a PDF resume</p>
                  </>
                )}
              </button>
            )}

            <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Cover letter */}
          <div className="form-group">
            <label className="label">Cover Letter <span className="text-text-muted">(optional)</span></label>
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
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={busy}>Cancel</button>
            <button id="apply-submit" type="submit" disabled={busy} className="btn-primary flex-1">
              {uploading
                ? <><Loader size={14} className="animate-spin" /> Uploading...</>
                : submitting
                  ? <><Loader size={14} className="animate-spin" /> Submitting...</>
                  : <><Send size={15} /> Submit Application</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Job Detail Page ───────────────────────────────────────────────────────────
export default function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, canApply } = useAuth()
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

            {/* Salary + single Apply button */}
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
                <Link to="/auth/login" className="btn-primary">Login to Apply</Link>
              ) : (
                <span className="text-xs text-text-muted bg-surface-2 border border-border px-3 py-2 rounded-xl">
                  Not eligible to apply
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

          {/* Sign-in nudge */}
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
