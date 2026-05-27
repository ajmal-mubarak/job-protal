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
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 animate-pulse">
            <div className="h-3 bg-slate-100 rounded w-3/4 mb-2" />
            <div className="h-2 bg-slate-100 rounded w-1/2 mb-3" />
            <div className="h-2 bg-slate-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
        <Briefcase size={24} className="text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-400">No other jobs found</p>
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
            className="bg-white border border-slate-100 hover:border-indigo-100 rounded-2xl p-4 shadow-[0_4px_12px_rgba(15,23,42,0.01)] hover:shadow-[0_8px_24px_rgba(99,102,241,0.04)] hover:-translate-y-0.5 transition-all duration-200 group block"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}>
                <Briefcase size={15} className="text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {job.title}
                  </p>
                  <ChevronRight size={13} className="text-slate-400 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">{job.company_name || 'Confidential'}</p>

                {/* Salary */}
                <p className="text-xs font-bold text-indigo-600 mt-2">
                  {formatSalary(job.salary_min, job.salary_max)}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {hasSkillMatch && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100/50">
                      <Sparkles size={8} /> Match
                    </span>
                  )}
                  {job.job_type && (
                    <span className="text-[9px] font-semibold text-slate-500 bg-slate-100/60 px-1.5 py-0.5 rounded border border-slate-200/20">
                      {jobTypeLabels[job.job_type] || job.job_type}
                    </span>
                  )}
                  {job.is_featured && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )
      })}

      <Link to="/jobs" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 text-center flex items-center justify-center gap-1 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl transition-colors mt-1">
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
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-3">
        <Loader size={32} className="text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-400 font-medium animate-pulse">Loading detailed description...</p>
      </div>
    )
  }

  if (!job) return null

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-10 animate-fade-in">
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl transition-all mb-6 shadow-sm"
        >
          <ArrowLeft size={13} /> Back to jobs
        </button>

        {/* Two-column layout: related sidebar LEFT, main detail RIGHT */}
        <div className="flex flex-col-reverse lg:flex-row gap-6 items-start">

          {/* ── LEFT: Related Jobs Sidebar ─────────────────────────────────── */}
          <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="flex items-center gap-2 mb-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                {sidebarIsRandom
                  ? <span className="text-sm">🎲</span>
                  : <Sparkles size={14} className="text-indigo-500" />}
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {sidebarIsRandom ? 'You Might Like' : 'Related Jobs'}
                </h2>
                {sidebarIsRandom && (
                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-auto">Random</span>
                )}
              </div>
              <RelatedJobsSidebar currentJob={job} onModeChange={setSidebarIsRandom} />
            </div>
          </aside>

          {/* ── RIGHT: Main Job Detail ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0 w-full">

            {/* Header card */}
            <div className={cn(
              'bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 mb-6 shadow-[0_8px_30px_rgba(15,23,42,0.015)] relative overflow-hidden',
              job.is_featured && 'border-amber-200 bg-gradient-to-br from-amber-50/10 via-white to-white'
            )}>
              {job.is_featured && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-amber-500" />
              )}

              <div className="flex items-start gap-4 sm:gap-5 mb-6">
                {/* Company Logo placeholder */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/30 border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Briefcase size={28} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight leading-tight">
                        {job.title}
                      </h1>
                      <p className="text-sm text-slate-500 mt-1 font-semibold">{job.company_name || 'Confidential Company'}</p>
                    </div>
                    {job.is_featured && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0 uppercase tracking-wider">
                        <Star size={11} fill="currentColor" className="text-amber-500" /> Featured
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Meta info row */}
              <div className="flex flex-wrap gap-2.5 mb-6">
                {job.location && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600">
                    <MapPin size={13} className="text-indigo-500" /> {job.location}
                  </div>
                )}
                {job.job_type && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600">
                    <Briefcase size={13} className="text-violet-500" /> {jobTypeLabels[job.job_type] || job.job_type}
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-400">
                  <Clock size={13} /> Posted {timeAgo(job.created_at)}
                </div>
              </div>

              {/* Salary + CTA */}
              <div className="flex items-center justify-between flex-wrap gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">Offered Salary</p>
                  <p className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{formatSalary(job.salary_min, job.salary_max)}</p>
                </div>
                {canApply ? (
                  <button
                    id="apply-btn"
                    onClick={() => setShowApply(true)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center gap-1.5"
                  >
                    <Send size={15} /> Apply Now
                  </button>
                ) : !isAuthenticated ? (
                  <Link 
                    to="/auth/login" 
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center gap-1.5"
                  >
                    Login to Apply
                  </Link>
                ) : (
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200/50 px-4 py-2.5 rounded-xl">
                    Not eligible to apply
                  </span>
                )}
              </div>
            </div>

            {/* Skills */}
            {job.skills_required?.length > 0 && (
              <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 mb-6 shadow-[0_8px_30px_rgba(15,23,42,0.015)]">
                <h2 className="font-extrabold text-slate-800 text-[15px] mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-4.5 bg-indigo-600 rounded-full inline-block" />
                  Required Professional Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required.map((skill) => (
                    <span key={skill} className="px-3.5 py-1.5 rounded-xl bg-indigo-50/50 text-indigo-700 font-bold text-xs border border-indigo-100/50">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 mb-6 shadow-[0_8px_30px_rgba(15,23,42,0.015)]">
              <h2 className="font-extrabold text-slate-800 text-[15px] mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4.5 bg-violet-600 rounded-full inline-block" />
                Role Description & Specifications
              </h2>
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line prose-sm font-medium">
                {job.description || 'No description provided.'}
              </div>
            </div>

            {/* Poster Info */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 mb-6 shadow-[0_8px_30px_rgba(15,23,42,0.015)]">
              <h2 className="font-extrabold text-slate-800 text-[15px] mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4.5 bg-emerald-500 rounded-full inline-block" />
                About the Organization
              </h2>
              <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200/60">
                    <Briefcase size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 text-sm">{job.company_name || 'Hiring Team'}</p>
                    <p className="text-xs text-slate-400 font-medium">Interested in learning more?</p>
                  </div>
                </div>
                <Link to={`/profiles/${job.posted_by_user_id}`} className="px-4 py-2 border border-indigo-200/80 text-indigo-600 bg-white hover:bg-indigo-50/50 font-bold text-xs rounded-xl transition-all flex items-center gap-1 shadow-sm">
                  <Users size={13} /> View Company
                </Link>
              </div>
            </div>

            {/* Sign-in nudge */}
            {!isAuthenticated && (
              <div className="bg-amber-50/30 border border-amber-200 rounded-2xl p-5 flex items-center gap-3 animate-pulse">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
                <p className="text-xs font-bold text-amber-800">
                  Please{' '}
                  <Link to="/auth/login" className="text-indigo-600 hover:underline">Sign In</Link> or{' '}
                  <Link to="/auth/signup" className="text-indigo-600 hover:underline">Create an Account</Link> to apply and send your credentials.
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
