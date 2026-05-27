import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Briefcase, Bell, LogOut, ChevronDown, Zap, User, Menu, X } from 'lucide-react'
import { toast } from 'sonner'
import useAuthStore from '../../store/useAuthStore'
import useNotificationStore from '../../store/useNotificationStore'
import { authApi } from '../../api/auth'
import { profilesApi } from '../../api/profiles'
import { cn } from '../../lib/utils'

function Avatar({ user, size = 'sm' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm' }
  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt={user.name} className={cn('rounded-full object-cover ring-2 ring-white/20', sizes[size])} />
  }
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold text-white', sizes[size])}
      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
      {user?.name?.[0]?.toUpperCase() || 'U'}
    </div>
  )
}

function NotificationDropdown() {
  const { notifications, unreadCount, markAllRead, markRead } = useNotificationStore()
  return (
    <div className="absolute right-0 top-12 w-80 z-50 animate-in"
      style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(99,102,241,0.08)', borderRadius: '1rem', boxShadow: '0 16px 48px rgba(0,0,0,0.1)' }}>
      <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <span className="font-semibold text-slate-900 text-sm">Notifications</span>
        {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-500">Mark all read</button>}
      </div>
      <div className="max-h-80 overflow-y-auto scrollbar-thin">
        {notifications.length === 0
          ? <div className="p-6 text-center text-slate-400 text-sm">No notifications yet</div>
          : notifications.slice(0, 15).map(n => (
            <div key={n.id} onClick={() => markRead(n.id)}
              className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex items-start gap-2">
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />}
                <div className={!n.is_read ? '' : 'ml-4'}>
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                </div>
              </div>
            </div>
          ))}
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
  const [isPremium, setIsPremium] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const userMenuRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    const h = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    if (isAuthenticated && ['employer', 'recruiter'].includes(user?.role)) {
      profilesApi.getMe().then(r => setIsPremium(r.data?.is_premium || false)).catch(() => { })
    }
  }, [isAuthenticated, user?.role])

  const handleLogout = async () => {
    try { await authApi.logout() } catch { }
    clearAuth(); navigate('/'); toast.success('Logged out')
  }

  const dashboardLink = { admin: '/dashboard/admin', employer: '/dashboard/employer', recruiter: '/dashboard/recruiter', jobseeker: '/dashboard/jobseeker' }[user?.role] || '/'
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const navLinkClass = (active) => cn(
    'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
    active
      ? 'text-indigo-600 bg-indigo-50 border border-indigo-100'
      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
  )

  return (
    <nav className={cn(
      'sticky top-0 z-50 transition-all duration-300',
      scrolled
        ? 'shadow-[0_4px_24px_rgba(0,0,0,0.04)] bg-white/85'
        : 'bg-white/60'
    )} style={{
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(99,102,241,0.08)',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-all"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <Briefcase size={17} className="text-white" />
          </div>
          <span className="font-bold text-lg text-slate-800">Job<span className="text-indigo-600">Portal</span></span>
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/" className={navLinkClass(isActive('/'))}>Home</Link>
          <Link to="/jobs" className={navLinkClass(isActive('/jobs'))}>Browse Jobs</Link>
          <Link to="/seekers" className={navLinkClass(isActive('/seekers'))}>Browse Seekers</Link>
          {isAuthenticated && <Link to={dashboardLink} className={navLinkClass(isActive('/dashboard'))}>Dashboard</Link>}
          {isAuthenticated && ['employer', 'recruiter', 'jobseeker'].includes(user?.role) && (
            <Link to="/chat" className={navLinkClass(isActive('/chat'))}>Messages</Link>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button id="notif-btn" onClick={() => setNotifOpen(v => !v)} className="btn-icon relative" aria-label="Notifications">
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                      style={{ background: '#6366f1' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && <NotificationDropdown />}
              </div>

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button id="user-menu-btn" onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/8 transition-colors">
                  <Avatar user={user} />
                  <span className="hidden md:block text-sm font-medium text-slate-700 max-w-[100px] truncate">{user?.name}</span>
                  <ChevronDown size={14} className="text-slate-500 hidden md:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-52 z-50 animate-in py-1"
                    style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(99,102,241,0.08)', borderRadius: '1rem', boxShadow: '0 16px 48px rgba(0,0,0,0.1)' }}>
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 capitalize mt-0.5">{user?.role}</p>
                    </div>
                    <Link to={dashboardLink} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"><User size={14} /> Dashboard</Link>
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"><User size={14} /> My Profile</Link>
                    {['employer', 'recruiter'].includes(user?.role) && (
                      <Link to="/payment/upgrade" onClick={() => setUserMenuOpen(false)} className={cn('flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors', isPremium ? 'text-indigo-600' : 'text-amber-600')}>
                        <Zap size={14} /> {isPremium ? 'Premium Active' : 'Go Premium'}
                      </Link>
                    )}
                    <button id="logout-btn" onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/auth/login" className="hidden md:flex px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all duration-200">Log in</Link>
              <Link to="/auth/signup" className="btn-primary btn-sm text-sm">Get Started</Link>
            </>
          )}

          <button className="btn-icon md:hidden" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div className={cn('md:hidden overflow-hidden transition-all duration-300', mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0')}
        style={{ borderTop: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)' }}>
        <div className="px-4 py-4 flex flex-col gap-1">
          <Link to="/jobs" onClick={() => setMobileOpen(false)} className="nav-item">Browse Jobs</Link>
          <Link to="/seekers" onClick={() => setMobileOpen(false)} className="nav-item">Browse Seekers</Link>
          {isAuthenticated && <Link to={dashboardLink} onClick={() => setMobileOpen(false)} className="nav-item">Dashboard</Link>}
          {isAuthenticated && <Link to="/profile" onClick={() => setMobileOpen(false)} className="nav-item">My Profile</Link>}
          {isAuthenticated && ['employer', 'recruiter', 'jobseeker'].includes(user?.role) && <Link to="/chat" onClick={() => setMobileOpen(false)} className="nav-item">Messages</Link>}
          {!isAuthenticated && <>
            <Link to="/auth/login" onClick={() => setMobileOpen(false)} className="nav-item">Log in</Link>
            <Link to="/auth/signup" onClick={() => setMobileOpen(false)} className="btn-primary mt-2">Get Started</Link>
          </>}
          {isAuthenticated && <button onClick={handleLogout} className="nav-item text-red-400 hover:text-red-300 mt-1"><LogOut size={16} /> Logout</button>}
        </div>
      </div>
    </nav>
  )
}
