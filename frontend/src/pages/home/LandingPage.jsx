import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Zap, Shield, MessageSquare, TrendingUp, Users, Briefcase, Star } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import JobCard from '../../components/JobCard'
import { jobsApi } from '../../api/jobs'

const STATS = [
  { label: 'Active Jobs', value: '2,400+', icon: <Briefcase size={20} className="text-primary-light" /> },
  { label: 'Companies', value: '800+', icon: <Users size={20} className="text-accent-light" /> },
  { label: 'Placements', value: '12K+', icon: <TrendingUp size={20} className="text-success" /> },
  { label: 'Avg. Time to Hire', value: '5 days', icon: <Zap size={20} className="text-warning" /> },
]

const FEATURES = [
  {
    icon: <Zap size={22} className="text-primary-light" />,
    title: 'AI-Powered Matching',
    desc: 'Our Gemini-powered AI scores resumes against job requirements for smarter hiring decisions.',
  },
  {
    icon: <MessageSquare size={22} className="text-accent-light" />,
    title: 'Real-Time Chat',
    desc: 'Connect instantly with candidates and recruiters via built-in live messaging.',
  },
  {
    icon: <Shield size={22} className="text-success" />,
    title: 'Verified Listings',
    desc: 'Every job post is reviewed. No spam, no ghost jobs — only real opportunities.',
  },
  {
    icon: <Star size={22} className="text-warning" />,
    title: 'Featured Visibility',
    desc: 'Premium jobs get priority placement in search results and on the homepage.',
  },
]

function HeroSearch() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/jobs?q=${encodeURIComponent(query)}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mt-8">
      <div className="relative flex-1">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          id="hero-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          placeholder="Job title, skills, or company..."
          className="input pl-10 h-12 text-sm"
        />
      </div>
      <button type="submit" className="btn-primary h-12 px-7 flex-shrink-0">
        Search Jobs
      </button>
    </form>
  )
}

export default function LandingPage() {
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    jobsApi.featured()
      .then((res) => setFeatured(res.data || []))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        {/* Decorative blobs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 right-1/4 w-56 h-56 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary-light mb-6">
            <Zap size={13} fill="currentColor" />
            AI-Powered Job Matching
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-text-primary leading-tight text-balance">
            Find Your Next <br />
            <span className="gradient-text">Dream Job</span>
          </h1>
          <p className="text-text-secondary text-lg mt-5 max-w-xl mx-auto leading-relaxed">
            Connect with top employers and recruiters. AI resume scoring, real-time chat, and thousands of verified opportunities.
          </p>
          <HeroSearch />

          <p className="text-xs text-text-muted mt-5">
            Trusted by <span className="text-text-secondary font-medium">12,000+ professionals</span> · No spam, no ghost jobs
          </p>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <section className="py-10 px-4 border-y border-border bg-surface/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 bg-surface-2 border border-border rounded-xl flex items-center justify-center">
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Jobs ──────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="section">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Star size={20} className="text-warning" fill="currentColor" />
                Featured Jobs
              </h2>
              <p className="text-text-muted text-sm mt-1">Premium opportunities from top companies</p>
            </div>
            <Link to="/jobs?featured=true" className="btn-ghost text-sm">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.slice(0, 6).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="section border-t border-border">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-primary">Why JobPortal?</h2>
          <p className="text-text-muted mt-2 max-w-md mx-auto">Everything you need to hire smarter or land your next role faster.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 hover:border-border-light transition-all duration-200">
              <div className="w-11 h-11 bg-surface-2 border border-border rounded-xl flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-text-primary mb-1.5">{f.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center card p-12 bg-gradient-to-br from-primary/10 via-surface to-accent/10 border-primary/20 shadow-glow">
          <h2 className="text-3xl font-bold text-text-primary mb-3">Ready to get started?</h2>
          <p className="text-text-muted mb-8">Join thousands of professionals already using JobPortal.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth/signup" className="btn-primary px-8 py-3">
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link to="/jobs" className="btn-secondary px-8 py-3">
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
