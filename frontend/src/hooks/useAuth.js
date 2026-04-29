import useAuthStore from '../store/useAuthStore'

export function useAuth() {
  const { user, isAuthenticated, isLoading, accessToken } = useAuthStore()

  return {
    user,
    isAuthenticated,
    isLoading,
    accessToken,
    role: user?.role,
    isAdmin: user?.role === 'admin',
    isEmployer: user?.role === 'employer',
    isRecruiter: user?.role === 'recruiter',
    isJobSeeker: user?.role === 'jobseeker',
    canChat: ['employer', 'recruiter', 'jobseeker'].includes(user?.role),
    canPostJob: ['employer', 'recruiter'].includes(user?.role),
    canApply: user?.role === 'jobseeker',
  }
}
