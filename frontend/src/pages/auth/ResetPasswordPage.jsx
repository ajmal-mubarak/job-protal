import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, Briefcase } from 'lucide-react'
import { authApi } from '../../api/auth'

const schema = z.object({
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.new_password === d.confirm, { message: "Passwords don't match", path: ['confirm'] })

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ new_password }) => {
    if (!token) { toast.error('Invalid reset link'); return }
    setLoading(true)
    try {
      await authApi.resetPassword({ token, new_password })
      toast.success('Password reset successfully!')
      navigate('/auth/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Reset failed')
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
          <div className="mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Lock size={22} className="text-primary-light" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Set new password</h1>
            <p className="text-text-muted text-sm mt-1">Choose a strong password</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="label">New password</label>
              <div className="relative">
                <input id="reset-password" {...register('new_password')} type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" className={`input pr-10 ${errors.new_password ? 'input-error' : ''}`} />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.new_password && <p className="text-xs text-error mt-1">{errors.new_password.message}</p>}
            </div>

            <div className="form-group">
              <label className="label">Confirm password</label>
              <input id="reset-confirm" {...register('confirm')} type="password" placeholder="Repeat password" className={`input ${errors.confirm ? 'input-error' : ''}`} />
              {errors.confirm && <p className="text-xs text-error mt-1">{errors.confirm.message}</p>}
            </div>

            <button id="reset-submit" type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
