import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Mail, Briefcase, ArrowLeft } from 'lucide-react'
import { authApi } from '../../api/auth'

const schema = z.object({ email: z.string().email('Invalid email') })

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email }) => {
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />
      <div className="w-full max-w-sm animate-slide-up">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-glow">
            <Briefcase size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl">Job<span className="text-primary">Portal</span></span>
        </Link>

        <div className="card p-8 shadow-glow-sm">
          {!sent ? (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Mail size={22} className="text-primary-light" />
                </div>
                <h1 className="text-2xl font-bold text-text-primary">Forgot password?</h1>
                <p className="text-text-muted text-sm mt-1">We'll send you a reset link</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="label">Email address</label>
                  <input id="forgot-email" {...register('email')} type="email" placeholder="you@example.com" className={`input ${errors.email ? 'input-error' : ''}`} />
                  {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
                </div>
                <button id="forgot-submit" type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-success" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Check your inbox</h2>
              <p className="text-text-muted text-sm">If this email is registered, you'll receive a reset link within a few minutes.</p>
            </div>
          )}

          <Link to="/auth/login" className="flex items-center justify-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mt-6">
            <ArrowLeft size={14} /> Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}


