import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Briefcase, ArrowRight, Mail, RefreshCw, Zap } from 'lucide-react'
import { authApi } from '../../api/auth'
import useAuthStore from '../../store/useAuthStore'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_REDIRECT_URI = `${import.meta.env.VITE_API_URL || 'https://job-protal-jbop.onrender.com'}/auth/google/callback`
const IS_DEV = import.meta.env.DEV

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState(null) // stores email when "not verified" error
  const [resending, setResending] = useState(false)
  const [devVerifying, setDevVerifying] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const roleRoutes = {
    admin: '/dashboard/admin',
    employer: '/dashboard/employer',
    recruiter: '/dashboard/recruiter',
    jobseeker: '/dashboard/jobseeker',
  }

  const onSubmit = async (data) => {
    setLoading(true)
    setUnverifiedEmail(null)
    try {
      const res = await authApi.login(data)
      const { access_token, role, user_id, name, avatar_url } = res.data
      setAuth(access_token, { id: user_id, name, avatar_url, role })
      toast.success(`Welcome back, ${name}!`)
      navigate(roleRoutes[role] || '/')
    } catch (err) {
      const detail = err.response?.data?.detail || 'Login failed'
      if (detail.toLowerCase().includes('verify')) {
        // Show inline unverified email UI instead of generic toast
        setUnverifiedEmail(data.email)
      } else {
        toast.error(detail)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return
    setResending(true)
    try {
      await authApi.resendVerification(unverifiedEmail)
      toast.success('Verification email sent!', {
        description: `Check your inbox at ${unverifiedEmail}`,
      })
    } catch {
      toast.error('Could not send verification email')
    } finally {
      setResending(false)
    }
  }

  const handleDevVerify = async () => {
    if (!unverifiedEmail) return
    setDevVerifying(true)
    try {
      const res = await authApi.devVerifyUser(unverifiedEmail)
      toast.success(res.data.message)
      setUnverifiedEmail(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Dev verify failed')
    } finally {
      setDevVerifying(false)
    }
  }

  const handleGoogle = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google OAuth not configured')
      return
    }
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
      {/* Background glow */}
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-glow">
            <Briefcase size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl text-text-primary">Job<span className="text-primary-light">Portal</span></span>
        </Link>

        <div className="card p-8 shadow-glow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
            <p className="text-text-muted text-sm mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="label">Email</label>
              <input
                id="login-email"
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className={`input ${errors.email ? 'input-error' : ''}`}
                autoComplete="email"
              />
              {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
            </div>

            <div className="form-group">
              <div className="flex items-center justify-between mb-1.5">
                <label className="label !mb-0">Password</label>
                <Link to="/auth/forgot-password" className="text-xs text-primary hover:text-primary-light transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  aria-label="Toggle password"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-error mt-1">{errors.password.message}</p>}
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Unverified email banner */}
          {unverifiedEmail && (
            <div className="mt-4 p-4 bg-warning/10 border border-warning/30 rounded-xl animate-in">
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-warning mb-0.5">Email not verified</p>
                  <p className="text-xs text-text-secondary mb-3">
                    We sent a link to <span className="font-medium text-text-primary">{unverifiedEmail}</span>.
                    Check your spam folder too.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleResendVerification}
                      disabled={resending}
                      className="btn-secondary btn-sm w-full text-xs"
                    >
                      {resending ? (
                        <span className="w-3 h-3 border-2 border-border-light border-t-text-primary rounded-full animate-spin" />
                      ) : (
                        <RefreshCw size={12} />
                      )}
                      Resend verification email
                    </button>
                    {IS_DEV && (
                      <button
                        onClick={handleDevVerify}
                        disabled={devVerifying}
                        className="btn-sm w-full text-xs bg-success/10 border border-success/30 text-success hover:bg-success/20 rounded-xl inline-flex items-center justify-center gap-1.5 transition-all"
                      >
                        {devVerifying ? (
                          <span className="w-3 h-3 border-2 border-success/30 border-t-success rounded-full animate-spin" />
                        ) : (
                          <Zap size={12} />
                        )}
                        DEV: Verify instantly (skip email)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {GOOGLE_CLIENT_ID && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-text-muted">or</span>
                <div className="flex-1 border-t border-border" />
              </div>

              <button
                id="google-login-btn"
                onClick={handleGoogle}
                className="btn-secondary w-full"
              >
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
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-primary hover:text-primary-light font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

