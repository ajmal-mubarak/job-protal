import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { PlusCircle, X, ArrowLeft, BarChart2, Zap } from 'lucide-react'
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
})

const JOB_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' },
]

const EMPLOYER_SIDEBAR = [
  { href: '/dashboard/employer', label: 'Overview', icon: <BarChart2 size={16} /> },
  { href: '/dashboard/employer/post-job', label: 'Post a Job', icon: <PlusCircle size={16} /> },
  { href: '/payment/upgrade', label: 'Go Premium', icon: <Zap size={16} /> },
]

const RECRUITER_SIDEBAR = [
  { href: '/dashboard/recruiter', label: 'Overview', icon: <BarChart2 size={16} /> },
  { href: '/dashboard/recruiter/post-job', label: 'Post a Job', icon: <PlusCircle size={16} /> },
  { href: '/payment/upgrade', label: 'Go Premium', icon: <Zap size={16} /> },
]

export default function PostJobPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(false)

  const isRecruiter = user?.role === 'recruiter'
  const dashBase = isRecruiter ? '/dashboard/recruiter' : '/dashboard/employer'
  const sidebarItems = isRecruiter ? RECRUITER_SIDEBAR : EMPLOYER_SIDEBAR

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { job_type: 'full_time' },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await jobsApi.create({ ...data, skills_required: skills })
      toast.success('Job posted successfully!')
      navigate(dashBase)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to post job')
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-bold text-text-primary mb-6">Post a New Job</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="card p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-text-primary mb-1">Basic Info</h2>

              <div className="form-group">
                <label className="label">Job Title *</label>
                <input id="post-title" {...register('title')} placeholder="e.g. Senior React Developer" className={`input ${errors.title ? 'input-error' : ''}`} />
                {errors.title && <p className="text-xs text-error mt-1">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Location</label>
                  <input id="post-location" {...register('location')} placeholder="City or Remote" className="input" />
                </div>
                <div className="form-group">
                  <label className="label">Job Type *</label>
                  <select id="post-job-type" {...register('job_type')} className="input">
                    {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Min Salary (₹/yr)</label>
                  <input id="post-salary-min" {...register('salary_min')} type="number" placeholder="e.g. 500000" className="input" />
                </div>
                <div className="form-group">
                  <label className="label">Max Salary (₹/yr)</label>
                  <input id="post-salary-max" {...register('salary_max')} type="number" placeholder="e.g. 1200000" className="input" />
                </div>
              </div>
            </div>

            <div className="card p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-text-primary mb-1">Job Description *</h2>
              <textarea
                id="post-description"
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

            <button id="post-job-submit" type="submit" disabled={loading} className="btn-primary py-3 text-base">
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Post Job'}
            </button>
          </form>
        </main>
      </div>
    </div>
  )
}
