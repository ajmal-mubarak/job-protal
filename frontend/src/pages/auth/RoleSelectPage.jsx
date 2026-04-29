import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Briefcase, ArrowRight } from 'lucide-react'
import { authApi } from '../../api/auth'
import useAuthStore from '../../store/useAuthStore'
import { cn } from '../../lib/utils'

const ROLES = [
  { value: 'jobseeker', label: 'Job Seeker', desc: 'Browse and apply to jobs', emoji: '🔍' },
  { value: 'employer', label: 'Employer', desc: 'Post jobs and hire talent', emoji: '🏢' },
  { value: 'recruiter', label: 'Recruiter', desc: 'Manage talent pipelines', emoji: '🎯' },
]

const roleRoutes = {
  employer: '/dashboard/employer',
  recruiter: '/dashboard/recruiter',
  jobseeker: '/dashboard/jobseeker',
}

export default function RoleSelectPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(false)

  if (!state?.google_id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted mb-4">Invalid session. Please sign in again.</p>
          <Link to="/auth/login" className="btn-primary">Back to Login</Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!selectedRole) { toast.error('Please select a role'); return }
    setLoading(true)
    try {
      const res = await authApi.googleCompleteSignup({ ...state, role: selectedRole })
      const { access_token, role, user_id, name, avatar_url } = res.data
      setAuth(access_token, { id: user_id, name, avatar_url, role })
      toast.success(`Welcome, ${name}!`)
      navigate(roleRoutes[role] || '/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />
      <div className="w-full max-w-sm animate-slide-up">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-glow">
            <Briefcase size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl">Job<span className="text-primary-light">Portal</span></span>
        </Link>

        <div className="card p-8 shadow-glow-sm">
          {state.avatar_url && (
            <img src={state.avatar_url} alt={state.name} className="w-14 h-14 rounded-full mx-auto mb-4 ring-2 ring-border" />
          )}
          <h1 className="text-2xl font-bold text-text-primary text-center">Welcome, {state.name}!</h1>
          <p className="text-text-muted text-sm text-center mt-1 mb-6">Choose how you'll use JobPortal</p>

          <div className="flex flex-col gap-3 mb-6">
            {ROLES.map((r) => (
              <button
                key={r.value}
                id={`role-select-${r.value}`}
                onClick={() => setSelectedRole(r.value)}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left',
                  selectedRole === r.value
                    ? 'border-primary bg-primary/10 shadow-glow-sm'
                    : 'border-border bg-surface-2 hover:border-border-light'
                )}
              >
                <span className="text-2xl">{r.emoji}</span>
                <div>
                  <p className="font-semibold text-text-primary text-sm">{r.label}</p>
                  <p className="text-xs text-text-muted">{r.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <button id="role-select-submit" onClick={handleSubmit} disabled={loading || !selectedRole} className="btn-primary w-full">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Continue <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
