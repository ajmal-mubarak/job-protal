import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()

  const roleRoutes = {
    admin: '/dashboard/admin',
    employer: '/dashboard/employer',
    recruiter: '/dashboard/recruiter',
    jobseeker: '/dashboard/jobseeker',
  }

  const homeRoute = isAuthenticated ? (roleRoutes[user?.role] || '/') : '/'

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 text-center max-w-lg mx-auto">

        {/* 404 glowing number */}
        <div className="relative mb-6 select-none">
          <h1
            className="text-[9rem] sm:text-[12rem] font-black leading-none tracking-tighter"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 50%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(99,102,241,0.4))',
            }}
          >
            404
          </h1>
          {/* Subtle reflection */}
          <h1
            className="text-[9rem] sm:text-[12rem] font-black leading-none tracking-tighter absolute top-0 left-0 w-full"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 50%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              opacity: 0.1,
              transform: 'scaleY(-1) translateY(-4px)',
              maskImage: 'linear-gradient(to bottom, transparent 50%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 50%, black 100%)',
            }}
            aria-hidden="true"
          >
            404
          </h1>
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 shadow-glow">
          <Search size={28} className="text-primary-light" />
        </div>

        {/* Text */}
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
          Page Not Found
        </h2>
        <p className="text-text-muted text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(homeRoute)}
            className="btn-primary gap-2 w-full sm:w-auto"
            id="not-found-home-btn"
          >
            <Home size={16} />
            Go to Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary gap-2 w-full sm:w-auto"
            id="not-found-back-btn"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        {/* Helpful links */}
        <div className="mt-10 pt-8 border-t border-border/50">
          <p className="text-xs text-text-muted mb-3">Quick links</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { label: 'Browse Jobs', href: '/jobs' },
              { label: 'Login', href: '/auth/login' },
              { label: 'Sign Up', href: '/auth/signup' },
            ].map(link => (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                className="text-xs text-text-secondary hover:text-primary-light transition-colors underline underline-offset-4 decoration-border hover:decoration-primary/50"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
