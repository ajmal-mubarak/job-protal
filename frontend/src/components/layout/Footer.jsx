import { Link } from 'react-router-dom'
import { Briefcase, Globe, Share2, ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-glow-sm">
                <Briefcase size={14} className="text-white" />
              </div>
              <span className="font-bold text-text-primary">Job<span className="text-primary-light">Portal</span></span>
            </Link>
            <p className="text-sm text-text-muted max-w-xs leading-relaxed">
              The premium platform connecting top employers, recruiters, and job seekers. AI-powered matching for your next career move.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="btn-icon" aria-label="Website"><Globe size={16} /></a>
              <a href="#" className="btn-icon" aria-label="Share"><Share2 size={16} /></a>
              <a href="#" className="btn-icon" aria-label="More"><ExternalLink size={16} /></a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-text-primary mb-4">Platform</p>
            <ul className="flex flex-col gap-2.5">
              <li><Link to="/jobs" className="text-sm text-text-muted hover:text-text-primary transition-colors">Browse Jobs</Link></li>
              <li><Link to="/auth/signup" className="text-sm text-text-muted hover:text-text-primary transition-colors">Post a Job</Link></li>
              <li><Link to="/payment/upgrade" className="text-sm text-text-muted hover:text-text-primary transition-colors">Go Premium</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-text-primary mb-4">Company</p>
            <ul className="flex flex-col gap-2.5">
              <li><a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">About</a></li>
              <li><a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="divider mt-8" />
        <p className="text-xs text-text-muted text-center">
          © {new Date().getFullYear()} JobPortal. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
