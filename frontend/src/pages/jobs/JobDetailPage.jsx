import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  MapPin, Clock, Briefcase, TrendingUp, Star, ArrowLeft,
  Send, Loader, AlertCircle, Upload, FileText, CheckCircle,
  DollarSign, Users, ChevronRight, Sparkles,
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
      toast.success('Application submitted! 🎉')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Application failed')
    } finally {
      setSubmitting(false)
    }
  }

  const busy = uploading || submitting

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-lg p-6 animate-slide-up shadow-glow">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Apply for this role</h2>
            <p className="text-sm text-text-muted mt-0.5">{job.title} · {job.company_name || 'Confidential'}</p>
          </div>
          <button onClick={onClose} className="btn-icon ml-2"><span className="text-lg">✕</span></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <div className="flex gap-3 mt-1">
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

// ── Relevance scoring for related jobs ────────────────────────────────────────
function scoreRelevance(candidate, current) {
  let score = 0
  // Skill overlap
  const currentSkills = new Set((current.skills_required || []).map(s => s.toLowerCase()))
  const matchedSkills = (candidate.skills_required || []).filter(s => currentSkills.has(s.toLowerCase()))
  score += matchedSkills.length * 10

  // Title word overlap
  const currentWords = new Set(current.title.toLowerCase().split(/\s+/))
  const titleWords = candidate.title.toLowerCase().split(/\s+/)
  titleWords.forEach(w => { if (currentWords.has(w) && w.length > 2) score += 5 })

  // Salary range overlap
  if (current.salary_min && candidate.salary_min) {
    const diff = Math.abs((candidate.salary_min || 0) - (current.salary_min || 0))
    if (diff < 20000) score += 8
    else if (diff < 50000) score += 4
  }

  // Same job type
  if (candidate.job_type && candidate.job_type === current.job_type) score += 3

  // Same location
  if (candidate.location && current.location &&
    candidate.location.toLowerCase().includes(current.location.toLowerCase().split(',')[0])) {
    score += 4
  }

  return score
}

// ── Related Jobs Sidebar ──────────────────────────────────────────────────────
function RelatedJobsSidebar({ currentJob, onModeChange }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRandom, setIsRandom] = useState(false)

  useEffect(() => {
    if (!currentJob) return
    setLoading(true)
    setIsRandom(false)
    onModeChange?.(false)

    const searchTerm = currentJob.title.split(' ').slice(0, 2).join(' ')

    jobsApi.list({ search: searchTerm, limit: 20 })
      .then(async (res) => {
        const all = res.data?.jobs || []
        const others = all
          .filter(j => j.id !== currentJob.id)
          .map(j => ({ ...j, _score: scoreRelevance(j, currentJob) }))
          .filter(j => j._score > 0)
          .sort((a, b) => b._score - a._score)
          .slice(0, 6)

        if (others.length > 0) {
          setJobs(others)
          onModeChange?.(false)
        } else {
          // ── Fallback: random recent jobs ──────────────────────────────────
          setIsRandom(true)
          onModeChange?.(true)
          try {
            const fallback = await jobsApi.list({ limit: 10 })
            const rand = (fallback.data?.jobs || [])
              .filter(j => j.id !== currentJob.id)
              .sort(() => Math.random() - 0.5)
              .slice(0, 6)
            setJobs(rand)
          } catch {
            setJobs([])
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentJob?.id])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-3 bg-surface-3 rounded w-3/4 mb-2" />
            <div className="h-2 bg-surface-3 rounded w-1/2 mb-3" />
            <div className="h-2 bg-surface-3 rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="card p-5 text-center">
        <Briefcase size={24} className="text-text-muted mx-auto mb-2" />
        <p className="text-xs text-text-muted">No other jobs found</p>
      </div>
    )
  }


  return (
    <div className="flex flex-col gap-3">
      {jobs.map((job) => {
        const hasSkillMatch = currentJob.skills_required?.some(s =>
          job.skills_required?.includes(s)
        )
        return (
          <Link
            key={job.id}
            to={`/jobs/${job.id}`}
            className="card p-4 hover:border-border-light hover:shadow-card-hover hover:translate-y-[-1px] transition-all duration-200 group block"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-3 border border-border flex items-center justify-center flex-shrink-0">
                <Briefcase size={14} className="text-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <p className="text-sm font-semibold text-text-primary group-hover:text-primary-light transition-colors line-clamp-1">
                    {job.title}
                  </p>
                  <ChevronRight size={13} className="text-text-muted flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-text-muted mt-0.5 truncate">{job.company_name || 'Confidential'}</p>

                {/* Salary */}
                <p className="text-xs font-semibold text-primary-light mt-2">
                  {formatSalary(job.salary_min, job.salary_max)}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {hasSkillMatch && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 bg-primary/10 text-primary-light rounded-full border border-primary/20">
                      <Sparkles size={8} /> Skill match
                    </span>
                  )}
                  {job.job_type && (
                    <span className="text-[10px] text-text-muted bg-surface-3 px-1.5 py-0.5 rounded-full">
                      {jobTypeLabels[job.job_type] || job.job_type}
                    </span>
                  )}
                  {job.is_featured && (
                    <span className="text-[10px] text-warning bg-warning/10 px-1.5 py-0.5 rounded-full border border-warning/20">
                      ★ Featured
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )
      })}

      <Link to="/jobs" className="text-xs text-primary hover:text-primary-light text-center flex items-center justify-center gap-1 py-1 transition-colors">
        Browse all jobs <ChevronRight size={12} />
      </Link>
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
  const [sidebarIsRandom, setSidebarIsRandom] = useState(false)

  useEffect(() => {
    setLoading(true)
    jobsApi.get(id)
      .then((res) => setJob(res.data))
      .catch(() => navigate('/jobs'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader size={32} className="text-primary animate-spin" />
      </div>
    )
  }

  if (!job) return null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <button onClick={() => navigate(-1)} className="btn-ghost text-sm mb-6">
          <ArrowLeft size={15} /> Back to jobs
        </button>

        {/* Two-column layout: related sidebar LEFT, main detail RIGHT */}
        <div className="flex flex-col-reverse lg:flex-row gap-6 items-start">

          {/* ── LEFT: Related Jobs Sidebar ─────────────────────────────────── */}
          <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="flex items-center gap-2 mb-3">
                {sidebarIsRandom
                  ? <span className="text-sm">🎲</span>
                  : <Sparkles size={14} className="text-primary-light" />}
                <h2 className="text-sm font-semibold text-text-primary">
                  {sidebarIsRandom ? 'You Might Like' : 'Related Jobs'}
                </h2>
                {sidebarIsRandom && (
                  <span className="text-[10px] text-text-muted bg-surface-3 px-1.5 py-0.5 rounded-full ml-auto">Random picks</span>
                )}
              </div>
              <RelatedJobsSidebar currentJob={job} onModeChange={setSidebarIsRandom} />
            </div>
          </aside>

          {/* ── RIGHT: Main Job Detail ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Header card */}
            <div className={cn(
              'card p-7 mb-5',
              job.is_featured && 'border-warning/30 bg-gradient-to-br from-warning/5 via-transparent to-transparent'
            )}>
              <div className="flex items-start gap-5 mb-6">
                {/* Company Logo placeholder */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-surface-2 to-surface-3 border border-border flex items-center justify-center flex-shrink-0 shadow-card">
                  <Briefcase size={28} className="text-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl sm:text-3xl font-black text-text-primary leading-tight">
                        {job.title}
                      </h1>
                      <p className="text-base text-text-secondary mt-1 font-medium">{job.company_name || 'Confidential Company'}</p>
                    </div>
                    {job.is_featured && (
                      <span className="badge-featured flex-shrink-0 mt-1">
                        <Star size={11} fill="currentColor" /> Featured
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Meta info row */}
              <div className="flex flex-wrap gap-3 mb-6">
                {job.location && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-border rounded-xl text-sm text-text-secondary">
                    <MapPin size={13} className="text-primary-light" /> {job.location}
                  </div>
                )}
                {job.job_type && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-border rounded-xl text-sm text-text-secondary">
                    <TrendingUp size={13} className="text-accent-light" /> {jobTypeLabels[job.job_type] || job.job_type}
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-border rounded-xl text-sm text-text-secondary">
                  <Clock size={13} className="text-text-muted" /> Posted {timeAgo(job.created_at)}
                </div>
              </div>

              {/* Salary + CTA */}
              <div className="flex items-center justify-between flex-wrap gap-4 p-5 bg-surface-2 border border-border rounded-2xl">
                <div>
                  <p className="text-xs text-text-muted mb-1 font-medium uppercase tracking-wide">Salary</p>
                  <p className="text-2xl font-black text-primary-light">{formatSalary(job.salary_min, job.salary_max)}</p>
                </div>
                {canApply ? (
                  <button
                    id="apply-btn"
                    onClick={() => setShowApply(true)}
                    className="btn-primary px-8 py-3 text-base shadow-glow"
                  >
                    <Send size={17} /> Apply Now
                  </button>
                ) : !isAuthenticated ? (
                  <Link to="/auth/login" className="btn-primary px-8 py-3 text-base shadow-glow">
                    Login to Apply
                  </Link>
                ) : (
                  <span className="text-xs text-text-muted bg-surface-3 border border-border px-4 py-2.5 rounded-xl">
                    Not eligible to apply
                  </span>
                )}
              </div>
            </div>

            {/* Skills */}
            {job.skills_required?.length > 0 && (
              <div className="card p-6 mb-5">
                <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                  Required Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required.map((skill) => (
                    <span key={skill} className="badge badge-primary text-sm px-3 py-1">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="card p-6 mb-5">
              <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-accent rounded-full inline-block" />
                Job Description
              </h2>
              <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line prose-sm">
                {job.description || 'No description provided.'}
              </div>
            </div>

            {/* Bottom Apply CTA */}
            {canApply && (
              <div className="card p-5 flex items-center justify-between gap-4 bg-gradient-to-r from-primary/10 to-accent/5 border-primary/20">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Ready to apply?</p>
                  <p className="text-xs text-text-muted mt-0.5">Your profile resume will be auto-attached</p>
                </div>
                <button onClick={() => setShowApply(true)} className="btn-primary flex-shrink-0">
                  <Send size={15} /> Apply Now
                </button>
              </div>
            )}

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
        </div>
      </main>

      {showApply && <ApplyModal job={job} onClose={() => setShowApply(false)} />}
      <Footer />
    </div>
  )
}
