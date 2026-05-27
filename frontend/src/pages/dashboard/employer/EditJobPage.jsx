import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, BarChart2, PlusCircle, Zap, Save, Loader, ToggleLeft, ToggleRight } from 'lucide-react'
import Navbar from '../../../components/layout/Navbar'
import Sidebar from '../../../components/layout/Sidebar'
import { jobsApi } from '../../../api/jobs'
import { useAuth } from '../../../hooks/useAuth'
import SkillInput from '../../../components/ui/SkillInput'

const schema = z.object({
  title: z.string().min(3, 'Title required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  location: z.string().optional(),
  job_type: z.enum(['full_time', 'part_time', 'contract', 'internship', 'remote']),
  salary_min: z.coerce.number().optional(),
  salary_max: z.coerce.number().optional(),
  is_active: z.boolean().optional(),
})

const JOB_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' },
]

export default function EditJobPage() {
  const { user } = useAuth()
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [isActive, setIsActive] = useState(true)

  const isRecruiter = user?.role === 'recruiter'
  const dashBase = isRecruiter ? '/dashboard/recruiter' : '/dashboard/employer'

  const sidebarItems = [
    { href: dashBase, label: 'Overview', icon: <BarChart2 size={16} /> },
    { href: `${dashBase}/post-job`, label: 'Post a Job', icon: <PlusCircle size={16} /> },
    { href: '/payment/upgrade', label: 'Go Premium', icon: <Zap size={16} /> },
  ]

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  // Load existing job data
  useEffect(() => {
    if (!jobId) return
    jobsApi.get(jobId)
      .then((res) => {
        const job = res.data
        reset({
          title: job.title,
          description: job.description,
          location: job.location || '',
          job_type: job.job_type,
          salary_min: job.salary_min || '',
          salary_max: job.salary_max || '',
        })
        setSkills(job.skills_required || [])
        setIsActive(job.is_active ?? true)
      })
      .catch(() => {
        toast.error('Failed to load job details')
        navigate(dashBase)
      })
      .finally(() => setFetching(false))
  }, [jobId])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await jobsApi.update(jobId, {
        ...data,
        skills_required: skills,
        is_active: isActive,
        salary_min: data.salary_min || null,
        salary_max: data.salary_max || null,
      })
      toast.success('Job updated successfully!')
      navigate(dashBase)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to update job')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader size={32} className="animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex gap-8">
        <Sidebar items={sidebarItems} />

        <main className="flex-1 min-w-0 max-w-2xl">
          <Link to={dashBase} className="btn-ghost text-sm mb-5 inline-flex">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mb-6">Edit Job Listing</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Status toggle */}
            <div className="card p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-text-primary text-sm">Job Status</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {isActive ? 'Active — visible to job seekers' : 'Closed — hidden from listings'}
                </p>
              </div>
              <button
                type="button"
                id="toggle-job-active"
                onClick={() => setIsActive((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
              >
                {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                {isActive ? 'Active' : 'Closed'}
              </button>
            </div>

            <div className="card p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-text-primary mb-1">Basic Info</h2>

              <div className="form-group">
                <label className="label">Job Title *</label>
                <input id="edit-title" {...register('title')} placeholder="e.g. Senior React Developer" className={`input ${errors.title ? 'input-error' : ''}`} />
                {errors.title && <p className="text-xs text-error mt-1">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Location</label>
                  <input id="edit-location" {...register('location')} placeholder="City or Remote" className="input" />
                </div>
                <div className="form-group">
                  <label className="label">Job Type *</label>
                  <select id="edit-job-type" {...register('job_type')} className="input">
                    {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Min Salary (₹/yr)</label>
                  <input id="edit-salary-min" {...register('salary_min')} type="number" placeholder="e.g. 500000" className="input" />
                </div>
                <div className="form-group">
                  <label className="label">Max Salary (₹/yr)</label>
                  <input id="edit-salary-max" {...register('salary_max')} type="number" placeholder="e.g. 1200000" className="input" />
                </div>
              </div>
            </div>

            <div className="card p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-text-primary mb-1">Job Description *</h2>
              <textarea
                id="edit-description"
                {...register('description')}
                rows={8}
                placeholder="Describe responsibilities, requirements, benefits..."
                className={`input resize-none ${errors.description ? 'input-error' : ''}`}
              />
              {errors.description && <p className="text-xs text-error">{errors.description.message}</p>}
            </div>

            <div className="card p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-text-primary mb-1">Required Skills</h2>
              <SkillInput skills={skills} onChange={setSkills} />
            </div>

            <div className="flex gap-3">
              <Link to={dashBase} className="btn-ghost flex-1 py-3 text-base text-center">
                Cancel
              </Link>
              <button id="edit-job-submit" type="submit" disabled={loading} className="btn-primary flex-1 py-3 text-base flex items-center justify-center gap-2">
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Save size={16} /> Save Changes</>
                }
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
