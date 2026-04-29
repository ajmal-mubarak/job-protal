import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader, Briefcase } from 'lucide-react'
import { authApi } from '../../api/auth'

export default function VerifyPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token found.'); return }
    authApi.verifyEmail(token)
      .then((res) => { setStatus('success'); setMessage(res.data.message) })
      .catch((err) => { setStatus('error'); setMessage(err.response?.data?.detail || 'Verification failed') })
  }, [token])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />
      <div className="w-full max-w-sm text-center animate-slide-up">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-glow">
            <Briefcase size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl">Job<span className="text-primary-light">Portal</span></span>
        </Link>

        <div className="card p-8 shadow-glow-sm">
          {status === 'loading' && (
            <>
              <Loader size={48} className="text-primary mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-bold text-text-primary">Verifying your email...</h2>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle size={48} className="text-success mx-auto mb-4" />
              <h2 className="text-xl font-bold text-text-primary mb-2">Email Verified!</h2>
              <p className="text-text-muted text-sm mb-6">{message}</p>
              <Link to="/auth/login" className="btn-primary w-full">Continue to Login</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle size={48} className="text-error mx-auto mb-4" />
              <h2 className="text-xl font-bold text-text-primary mb-2">Verification Failed</h2>
              <p className="text-text-muted text-sm mb-6">{message}</p>
              <Link to="/auth/login" className="btn-secondary w-full">Back to Login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
