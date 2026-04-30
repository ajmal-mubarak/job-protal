import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Briefcase, Bell, MessageSquare, LogOut, ChevronDown, Zap, User } from 'lucide-react'
import { toast } from 'sonner'
import useAuthStore from '../../store/useAuthStore'
import useNotificationStore from '../../store/useNotificationStore'
import { authApi } from '../../api/auth'
import { cn } from '../../lib/utils'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function Avatar({ user, size = 'sm' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm' }
  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt={user.name} className={cn('rounded-full object-cover ring-2 ring-border', sizes[size])} />
  }
  return (
    <div className={cn('rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-semibold text-primary-light', sizes[size])}>
      {user?.name?.[0]?.toUpperCase() || 'U'}
    </div>
  )
}

function NotificationDropdown({ onClose }) {
  const { notifications, unreadCount, markAllRead, markRead } = useNotificationStore()

  return (
    <div className="absolute right-0 top-12 w-80 card border border-border shadow-glow z-50 animate-in">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <span className="font-semibold text-text-primary text-sm">Notifications</span>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary hover:text-primary-light">Mark all read</button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-text-muted text-sm">No notifications yet</div>
        ) : (
          notifications.slice(0, 15).map((n) => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={cn(
                'px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-surface-2 transition-colors',
                !n.is_read && 'bg-primary/5'
              )}
            >
              <div className="flex items-start gap-2">
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                <div className={!n.is_read ? '' : 'ml-4'}>
                  <p className="text-sm font-medium text-text-primary">{n.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{n.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function Navbar() {
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const userMenuRef = useRef(null)
  const notifRef = useRef(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {}
    clearAuth()
    navigate('/')
    toast.success('Logged out successfully')
  }

  const dashboardLink = {
    admin: '/dashboard/admin',
    employer: '/dashboard/employer',
    recruiter: '/dashboard/recruiter',
    jobseeker: '/dashboard/jobseeker',
  }[user?.role] || '/'

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)] supports-[backdrop-filter]:bg-background/40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-glow-sm">
            <Briefcase size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg text-text-primary">Job<span className="text-primary-light">Portal</span></span>
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/jobs" className={cn('btn-ghost text-sm', isActive('/jobs') && 'text-primary-light bg-primary/10')}>
            Browse Jobs
          </Link>
          {isAuthenticated && (
            <Link to={dashboardLink} className={cn('btn-ghost text-sm', location.pathname.startsWith('/dashboard') && 'text-primary-light bg-primary/10')}>
              Dashboard
            </Link>
          )}
          {isAuthenticated && ['employer', 'recruiter', 'jobseeker'].includes(user?.role) && (
            <Link to="/chat" className={cn('btn-ghost text-sm', location.pathname.startsWith('/chat') && 'text-primary-light bg-primary/10')}>
              Messages
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Browse Seekers — employer/recruiter only */}
              {['employer', 'recruiter'].includes(user?.role) && (
                <Link to="/seekers" className={cn('btn-ghost text-sm hidden md:flex', location.pathname.startsWith('/seekers') && 'text-primary-light bg-primary/10')}>
                  Browse Seekers
                </Link>
              )}
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  id="notif-btn"
                  className="btn-icon relative"
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
              </div>

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  id="user-menu-btn"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface-2 transition-colors"
                >
                  <Avatar user={user} />
                  <span className="hidden md:block text-sm font-medium text-text-primary max-w-[100px] truncate">{user?.name}</span>
                  <ChevronDown size={14} className="text-text-muted hidden md:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-52 card border border-border shadow-glow z-50 animate-in py-1">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold text-text-primary truncate">{user?.name}</p>
                      <p className="text-xs text-text-muted capitalize mt-0.5">{user?.role}</p>
                    </div>
                    <Link to={dashboardLink} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors">
                      <User size={14} /> Dashboard
                    </Link>
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors">
                      <User size={14} /> My Profile
                    </Link>
                    {['employer', 'recruiter'].includes(user?.role) && (
                      <Link to="/payment/upgrade" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-warning hover:bg-surface-2 transition-colors">
                        <Zap size={14} /> Upgrade to Premium
                      </Link>
                    )}
                    <button
                      id="logout-btn"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/auth/login" className="btn-ghost text-sm hidden md:flex">Log in</Link>
              <Link to="/auth/signup" className="btn-primary btn-sm text-sm">Get Started</Link>
            </>
          )}

          {/* Mobile menu toggle — animated hamburger */}
          <button
            className="btn-icon md:hidden flex flex-col justify-center items-center w-9 h-9 gap-0"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span className={cn(
              'block w-5 h-0.5 bg-current transition-all duration-300 origin-center',
              mobileOpen ? 'rotate-45 translate-y-[3px]' : 'translate-y-0'
            )} />
            <span className={cn(
              'block w-5 h-0.5 bg-current transition-all duration-300 mt-1',
              mobileOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
            )} />
            <span className={cn(
              'block w-5 h-0.5 bg-current transition-all duration-300 origin-center mt-1',
              mobileOpen ? '-rotate-45 -translate-y-[7px]' : 'translate-y-0'
            )} />
          </button>
        </div>
      </div>

      {/* Mobile nav — smooth slide down */}
      <div
        className={cn(
          'md:hidden border-t border-border bg-background/80 backdrop-blur-2xl overflow-hidden transition-all duration-300 ease-in-out supports-[backdrop-filter]:bg-background/60',
          mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 py-4 flex flex-col gap-1">
          <Link to="/jobs" onClick={() => setMobileOpen(false)} className="nav-item">Browse Jobs</Link>
          {isAuthenticated && ['employer', 'recruiter'].includes(user?.role) && (
            <Link to="/seekers" onClick={() => setMobileOpen(false)} className="nav-item">Browse Seekers</Link>
          )}
          {isAuthenticated && <Link to={dashboardLink} onClick={() => setMobileOpen(false)} className="nav-item">Dashboard</Link>}
          {isAuthenticated && <Link to="/profile" onClick={() => setMobileOpen(false)} className="nav-item">My Profile</Link>}
          {isAuthenticated && ['employer', 'recruiter', 'jobseeker'].includes(user?.role) && (
            <Link to="/chat" onClick={() => setMobileOpen(false)} className="nav-item">Messages</Link>
          )}
          {!isAuthenticated && (
            <>
              <Link to="/auth/login" onClick={() => setMobileOpen(false)} className="nav-item">Log in</Link>
              <Link to="/auth/signup" onClick={() => setMobileOpen(false)} className="btn-primary mt-1">Get Started</Link>
            </>
          )}
          {isAuthenticated && (
            <button onClick={handleLogout} className="nav-item text-error hover:text-error mt-1">
              <LogOut size={16} /> Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
