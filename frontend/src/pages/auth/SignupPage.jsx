import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Briefcase, ArrowRight } from 'lucide-react'
import { authApi } from '../../api/auth'
import { cn } from '../../lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
  role: z.enum(['employer', 'recruiter', 'jobseeker'], { required_error: 'Select a role' }),
})

const ROLES = [
  { value: 'jobseeker', label: 'Job Seeker', desc: 'Find your next opportunity', emoji: '🔍' },
  { value: 'employer', label: 'Employer', desc: 'Post jobs & hire talent', emoji: '🏢' },
  { value: 'recruiter', label: 'Recruiter', desc: 'Build your talent pipeline', emoji: '🎯' },
]

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_REDIRECT_URI = `${import.meta.env.VITE_API_URL || 'https://job-protal-jbop.onrender.com'}/auth/google/callback`

export default function SignupPage() {
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })
  const selectedRole = watch('role')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authApi.signup(data)
      toast.success('Account created! Check your email to verify your account.', {
        description: 'A verification link has been sent to ' + data.email,
        duration: 6000,
      })
      navigate('/auth/login')
    } catch (err) {
      // Pydantic 422 errors return detail as an array of objects
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        // Show the first validation error message
        const msg = detail[0]?.msg || 'Validation error'
        toast.error(msg.replace('Value error, ', ''))
      } else {
        toast.error(typeof detail === 'string' ? detail : 'Signup failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    if (!GOOGLE_CLIENT_ID) { toast.error('Google OAuth not configured'); return }
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-glow">
            <Briefcase size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl">Job<span className="text-primary-light">Portal</span></span>
        </Link>

        <div className="card p-8 shadow-glow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Create account</h1>
            <p className="text-text-muted text-sm mt-1">Join thousands of professionals</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Role selector */}
            <div className="form-group">
              <label className="label">I am a...</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    id={`role-${r.value}`}
                    onClick={() => setValue('role', r.value, { shouldValidate: true })}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 text-center',
                      selectedRole === r.value
                        ? 'border-primary bg-primary/10 shadow-glow-sm'
                        : 'border-border bg-surface-2 hover:border-border-light'
                    )}
                  >
                    <span className="text-xl">{r.emoji}</span>
                    <span className="text-xs font-semibold text-text-primary">{r.label}</span>
                  </button>
                ))}
              </div>
              {errors.role && <p className="text-xs text-error mt-1">{errors.role.message}</p>}
            </div>

            <div className="form-group">
              <label className="label">Full name</label>
              <input id="signup-name" {...register('name')} type="text" placeholder="John Doe" className={`input ${errors.name ? 'input-error' : ''}`} />
              {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
            </div>

            <div className="form-group">
              <label className="label">Email</label>
              <input id="signup-email" {...register('email')} type="email" placeholder="you@example.com" className={`input ${errors.email ? 'input-error' : ''}`} />
              {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-error mt-1">{errors.password.message}</p>}
              <p className="text-[11px] text-text-muted mt-1">Must have 8+ chars, 1 uppercase letter &amp; 1 number</p>
            </div>

            <button id="signup-submit" type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <ArrowRight size={16} /></>}
            </button>
          </form>

          {GOOGLE_CLIENT_ID && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-text-muted">or</span>
                <div className="flex-1 border-t border-border" />
              </div>
              <button id="google-signup-btn" onClick={handleGoogle} className="btn-secondary w-full">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}

          <p className="text-center text-sm text-text-muted mt-6">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary hover:text-primary-light font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
