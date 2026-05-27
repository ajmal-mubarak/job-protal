import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Loader } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '../../api/auth'
import useAuthStore from '../../store/useAuthStore'

const roleRoutes = {
  admin: '/dashboard/admin',
  employer: '/dashboard/employer',
  recruiter: '/dashboard/recruiter',
  jobseeker: '/dashboard/jobseeker',
}

export default function GoogleCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const code = params.get('code')
    if (!code) { navigate('/auth/login'); return }

    authApi.googleCallback(code)
      .then((res) => {
        const data = res.data
        if (data.status === 'login') {
          setAuth(data.access_token, {
            id: data.user_id,
            name: data.name,
            avatar_url: data.avatar_url,
            role: data.role,
          })
          toast.success(`Welcome back, ${data.name}!`)
          navigate(roleRoutes[data.role] || '/')
        } else {
          // New user — go to role selection with partial profile
          navigate('/auth/role-select', {
            state: {
              google_id: data.google_id,
              email: data.email,
              name: data.name,
              avatar_url: data.avatar_url,
            },
          })
        }
      })
      .catch(() => {
        toast.error('Google sign-in failed. Please try again.')
        navigate('/auth/login')
      })
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <Loader size={36} className="text-primary animate-spin" />
      <p className="text-text-muted text-sm">Signing you in with Google...</p>
    </div>
  )
}


