import { Link } from 'react-router-dom'
import { Briefcase, Globe, Share2, ExternalLink, Mail } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function Footer() {
  const { user, isAuthenticated, canPostJob } = useAuth()

  const platformLinks = [
    { to: '/jobs', label: 'Browse Jobs', show: true },
    { to: '/seekers', label: 'Browse Seekers', show: true },
    { to: '/dashboard/employer', label: 'Post a Job', show: canPostJob },
    { to: '/dashboard/jobseeker', label: 'My Applications', show: isAuthenticated && user?.role === 'jobseeker' },
    { to: '/payment/upgrade', label: 'Go Premium ⚡', show: canPostJob },
    { to: '/auth/signup', label: 'Get Started Free', show: !isAuthenticated },
  ].filter(l => l.show)

  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'linear-gradient(135deg, #090d16 0%, #05070c 100%)' }} className="mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center animate-pulse" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                <Briefcase size={15} className="text-white" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">Job<span className="text-indigo-400">Portal</span></span>
            </Link>
            <p className="text-xs font-semibold text-slate-400 max-w-xs leading-relaxed mb-5">
              Connecting top employers, recruiters, and job seekers with AI‑powered resume scoring for smarter hiring decisions.
            </p>
            <div className="flex items-center gap-2">
              {[
                { icon: <Globe size={15} />, label: 'Website' },
                { icon: <Share2 size={15} />, label: 'Share' },
                { icon: <ExternalLink size={15} />, label: 'Link' },
                { icon: <Mail size={15} />, label: 'Email', href: 'mailto:hello@jobportal.com' },
              ].map(s => (
                <a key={s.label} href={s.href || '#'} aria-label={s.label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-600/20 transition-all duration-200 shadow-sm bg-white/[0.02]"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Platform</p>
            <ul className="flex flex-col gap-2.5">
              {platformLinks.map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Company</p>
            <ul className="flex flex-col gap-2.5">
              <li><a href="#about" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#how-it-works" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-[11px] font-bold text-slate-500">© {new Date().getFullYear()} JobPortal. All rights reserved.</p>
          <p className="text-[11px] font-bold text-slate-500">Built with ❤️ for job seekers & recruiters</p>
        </div>
      </div>
    </footer>
  )
}
