import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

// Spinner shown while refresh check is in-flight
function Spinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-border-light border-t-primary rounded-full animate-spin" />
    </div>
  )
}

// Generic: must be logged in
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return <Spinner />
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  return children
}

// Must be logged in AND have a specific role
export function RoleRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  if (isLoading) return <Spinner />
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  if (!allowedRoles.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

// Redirect away if already logged in (for auth pages)
export function GuestRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  if (isLoading) return <Spinner />
  if (isAuthenticated) {
    const roleRoutes = {
      admin: '/dashboard/admin',
      employer: '/dashboard/employer',
      recruiter: '/dashboard/recruiter',
      jobseeker: '/dashboard/jobseeker',
    }
    return <Navigate to={roleRoutes[user?.role] || '/'} replace />
  }
  return children
}
