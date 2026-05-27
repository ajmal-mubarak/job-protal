import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { authApi } from './api/auth'
import useAuthStore from './store/useAuthStore'
import { useSocket } from './hooks/useSocket'
import { ProtectedRoute, RoleRoute, GuestRoute } from './components/ProtectedRoute'

// Pages — Auth
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import VerifyPage from './pages/auth/VerifyPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage'
import RoleSelectPage from './pages/auth/RoleSelectPage'

// Pages — Public
import LandingPage from './pages/home/LandingPage'
import JobsListPage from './pages/jobs/JobsListPage'
import JobDetailPage from './pages/jobs/JobDetailPage'

// Pages — Dashboards
import AdminDashboard from './pages/dashboard/admin/AdminDashboard'
import EmployerDashboard from './pages/dashboard/employer/EmployerDashboard'
import PostJobPage from './pages/dashboard/employer/PostJobPage'
import ApplicantsPage from './pages/dashboard/employer/ApplicantsPage'
import RecruiterDashboard from './pages/dashboard/recruiter/RecruiterDashboard'
import JobSeekerDashboard from './pages/dashboard/jobseeker/JobSeekerDashboard'
import EditJobPage from './pages/dashboard/employer/EditJobPage'

// Pages — Profile
import ProfilePage from './pages/profile/ProfilePage'
import SeekersPage from './pages/profile/SeekersPage'
import PublicProfilePage from './pages/profile/PublicProfilePage'

// Pages — Other
import ChatPage from './pages/chat/ChatPage'
import UpgradePage from './pages/payment/UpgradePage'
import PaymentSuccess from './pages/payment/PaymentSuccess'
import PaymentFailed from './pages/payment/PaymentFailed'
import NotFoundPage from './pages/NotFoundPage'

// ── Socket connector (runs when logged in) ────────────────────────────────────
function SocketConnector() {
  useSocket()
  return null
}

// ── Auth initializer: tries silent refresh on mount ───────────────────────────
function AuthInitializer() {
  const { setAuth, clearAuth, setLoading } = useAuthStore()

  useEffect(() => {
    setLoading(true)
    authApi.refresh()
      .then((res) => {
        const { access_token, role, user_id, name, avatar_url } = res.data
        setAuth(access_token, { id: user_id, name, avatar_url, role })
      })
      .catch(() => {
        clearAuth()
      })
  }, [])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthInitializer />
      <SocketConnector />
      <Toaster position="top-right" richColors closeButton />

      <Routes>
        {/* ── Public ─────────────────────────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />

        {/* ── Jobs (public — apply/message requires login) ───────────────── */}
        <Route path="/jobs" element={<JobsListPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />

        {/* ── Auth (guest only) ───────────────────────────────────────── */}
        <Route path="/auth/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/auth/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/auth/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
        <Route path="/auth/role-select" element={<RoleSelectPage />} />

        {/* ── Admin ───────────────────────────────────────────────────── */}
        <Route path="/dashboard/admin" element={<RoleRoute allowedRoles={['admin']}><AdminDashboard /></RoleRoute>} />

        {/* ── Employer ────────────────────────────────────────────── */}
        <Route path="/dashboard/employer" element={<RoleRoute allowedRoles={['employer']}><EmployerDashboard /></RoleRoute>} />
        <Route path="/dashboard/employer/post-job" element={<RoleRoute allowedRoles={['employer']}><PostJobPage /></RoleRoute>} />
        <Route path="/dashboard/employer/jobs/:jobId/edit" element={<RoleRoute allowedRoles={['employer']}><EditJobPage /></RoleRoute>} />
        <Route path="/dashboard/employer/jobs/:jobId/applicants" element={<RoleRoute allowedRoles={['employer']}><ApplicantsPage /></RoleRoute>} />

        {/* ── Recruiter ───────────────────────────────────────────── */}
        <Route path="/dashboard/recruiter" element={<RoleRoute allowedRoles={['recruiter']}><RecruiterDashboard /></RoleRoute>} />
        <Route path="/dashboard/recruiter/post-job" element={<RoleRoute allowedRoles={['recruiter']}><PostJobPage /></RoleRoute>} />
        <Route path="/dashboard/recruiter/jobs/:jobId/edit" element={<RoleRoute allowedRoles={['recruiter']}><EditJobPage /></RoleRoute>} />
        <Route path="/dashboard/recruiter/jobs/:jobId/applicants" element={<RoleRoute allowedRoles={['recruiter']}><ApplicantsPage /></RoleRoute>} />

        {/* ── Job Seeker ──────────────────────────────────────────────── */}
        <Route path="/dashboard/jobseeker" element={<RoleRoute allowedRoles={['jobseeker']}><JobSeekerDashboard /></RoleRoute>} />

        {/* ── Profile ─────────────────────────────────────────────────────── */}
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        {/* Seekers & public profiles — anyone can browse */}
        <Route path="/seekers" element={<SeekersPage />} />
        <Route path="/profiles/:userId" element={<PublicProfilePage />} />

        {/* ── Chat ────────────────────────────────────────────────────── */}
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

        {/* ── Payments ────────────────────────────────────────────────── */}
        <Route path="/payment/upgrade" element={<ProtectedRoute><UpgradePage /></ProtectedRoute>} />
        <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
        <Route path="/payment/failed" element={<ProtectedRoute><PaymentFailed /></ProtectedRoute>} />

        {/* ── Catch-all → 404 ─────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
