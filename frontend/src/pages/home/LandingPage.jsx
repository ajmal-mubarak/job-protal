import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, ArrowRight, Zap, Shield, MessageSquare, TrendingUp,
  Users, Briefcase, Star, CheckCircle, Building2, UserCheck,
  Target, ChevronRight, MapPin, Clock
} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import JobCard from '../../components/JobCard'
import { jobsApi } from '../../api/jobs'

// ── Scroll reveal hook ────────────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) }
      }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { label: 'Active Jobs', value: '2,400+', icon: <Briefcase size={20} /> },
  { label: 'Companies Hiring', value: '800+', icon: <Building2 size={20} /> },
  { label: 'Professionals Placed', value: '12K+', icon: <TrendingUp size={20} /> },
  { label: 'Avg. Time to Hire', value: '5 days', icon: <Zap size={20} /> },
]

// ── Features (Why us) ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <Zap size={22} className="text-indigo-600" />,
    bg: 'bg-indigo-50 border border-indigo-100/30',
    title: 'AI-Powered Resume Scoring',
    desc: 'Gemini AI scores every resume against real job requirements — giving recruiters instant signal and seekers honest feedback.',
  },
  {
    icon: <MessageSquare size={22} className="text-sky-600" />,
    bg: 'bg-sky-50 border border-sky-100/30',
    title: 'Real-Time Messaging',
    desc: 'Connect instantly with candidates and employers via built-in live chat. No more email threads.',
  },
  {
    icon: <Shield size={22} className="text-emerald-600" />,
    bg: 'bg-emerald-50 border border-emerald-100/30',
    title: 'Verified Listings Only',
    desc: 'Every job post is reviewed before going live. Zero ghost jobs, zero spam — only real opportunities.',
  },
  {
    icon: <Star size={22} className="text-amber-600" />,
    bg: 'bg-amber-50 border border-amber-100/30',
    title: 'Featured Visibility',
    desc: 'Premium jobs get priority placement in search results and on the homepage for maximum exposure.',
  },
  {
    icon: <Target size={22} className="text-violet-600" />,
    bg: 'bg-violet-50 border border-violet-100/30',
    title: 'Smart Job Matching',
    desc: 'Our relevance engine shows seekers the most fitting jobs and shows recruiters the best-matched candidates.',
  },
  {
    icon: <UserCheck size={22} className="text-pink-600" />,
    bg: 'bg-pink-50 border border-pink-100/30',
    title: 'Talent Discovery',
    desc: 'Employers and recruiters can browse verified job seekers by skills, location, and open-to-work status.',
  },
]

// ── How It Works steps ────────────────────────────────────────────────────────
const HOW_STEPS = [
  {
    step: '01',
    title: 'Create Your Account',
    desc: 'Sign up as a Job Seeker, Employer, or Recruiter. Complete your profile with skills, experience, and a PDF resume.',
    icon: <Users size={22} />,
  },
  {
    step: '02',
    title: 'Explore Opportunities',
    desc: 'Browse thousands of verified job listings — no login required to view. Filter by type, location, and skills.',
    icon: <Search size={22} />,
  },
  {
    step: '03',
    title: 'Apply with AI Support',
    desc: 'Submit your application with a PDF resume. Our AI instantly scores your resume against the job requirements.',
    icon: <Zap size={22} />,
  },
  {
    step: '04',
    title: 'Connect & Get Hired',
    desc: 'Chat live with recruiters, track your application status, and land your dream job — all in one place.',
    icon: <CheckCircle size={22} />,
  },
]

// ── Hero Search ───────────────────────────────────────────────────────────────
function HeroSearch() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/jobs?q=${encodeURIComponent(query)}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mt-8">
      <div className="relative flex-1">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id="hero-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          placeholder="Job title, skills, or company..."
          className="w-full h-[54px] pl-11 pr-4 bg-white border border-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-2xl text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition-all duration-200 text-sm font-semibold"
        />
      </div>
      <button type="submit" className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm flex-shrink-0 shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95">
        Search Jobs <ArrowRight size={16} />
      </button>
    </form>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [featured, setFeatured] = useState([])
  useReveal()

  useEffect(() => {
    jobsApi.featured()
      .then((res) => setFeatured(res.data || []))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden bg-mesh bg-hero-glow">
        {/* User-supplied background image texture overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.30] pointer-events-none"
          style={{ backgroundImage: 'url(/homebg.jpg)' }}
        />
        {/* Floating gradient blur background shapes for a dynamic, futuristic feel */}
        <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-indigo-200/20 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-violet-200/20 rounded-full blur-[90px] pointer-events-none translate-x-1/2 translate-y-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 w-full z-10">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-white text-xs text-indigo-600 font-bold mb-7 animate-fade-in shadow-sm">
              <Zap size={12} fill="currentColor" />
              AI-Powered Job Matching Platform
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-800 leading-[1.08] tracking-tight mb-6 animate-slide-up">
              Find Your Next<br />
              <span className="gradient-text">Dream Career</span>
            </h1>

            <p className="text-slate-500 text-base md:text-lg leading-relaxed mb-2 max-w-lg animate-slide-up font-medium" style={{ animationDelay: '0.08s' }}>
              Connect with top employers and recruiters. AI resume scoring, real-time chat, and thousands of verified opportunities.
            </p>

            <div className="animate-slide-up" style={{ animationDelay: '0.12s' }}>
              <HeroSearch />
            </div>

            {/* Trust chips */}
            <div className="flex flex-wrap items-center gap-3 mt-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {[
                { icon: <CheckCircle size={14} className="text-emerald-500" />, text: 'No ghost jobs' },
                { icon: <Users size={14} className="text-indigo-500" />, text: '12K+ professionals' },
                { icon: <Shield size={14} className="text-violet-500" />, text: 'Verified listings' },
              ].map(chip => (
                <span key={chip.text} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-white border border-white rounded-full px-3 py-1 shadow-sm">
                  {chip.icon} {chip.text}
                </span>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 mt-8 animate-fade-in" style={{ animationDelay: '0.25s' }}>
              <Link to="/auth/signup" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95">
                Get Started Free <ArrowRight size={16} />
              </Link>
              <Link to="/jobs" className="px-6 py-3 bg-white hover:bg-slate-50 border border-white text-slate-600 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm">
                Browse Jobs
              </Link>
            </div>
          </div>
        </div>

        {/* Floating stat cards — desktop only */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {STATS.slice(0, 3).map((stat, idx) => (
            <div key={stat.label} className="bg-white border border-white shadow-[0_8px_32px_rgba(15,23,42,0.02)] rounded-2xl px-5 py-4 flex items-center gap-3.5 min-w-[210px] hover:border-indigo-100 transition-all duration-300">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-600">
                {idx === 0 ? <Briefcase size={18} /> : idx === 1 ? <Building2 size={18} /> : <TrendingUp size={18} />}
              </div>
              <div>
                <p className="text-xl font-black text-slate-800 leading-none mb-1">{stat.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats row — mobile/tablet view only */}
      <section className="py-10 px-4 border-y border-slate-100 bg-gradient-to-b from-sky-50/20 via-white to-white xl:hidden">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <div key={stat.label} className={`reveal reveal-delay-${i + 1} flex flex-col items-center gap-2 text-center`}>
              <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-white shadow-sm">
                {stat.icon}
              </div>
              <p className="text-2xl font-black text-slate-800">{stat.value}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED JOBS ─────────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-b from-sky-50/20 via-white to-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div className="reveal">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-white mb-3 shadow-sm">
                  <Star size={12} fill="currentColor" /> Featured
                </div>
                <h2 className="text-3xl font-black text-slate-800">Top Opportunities</h2>
                <p className="text-slate-400 text-sm font-semibold mt-1">Premium listings from leading companies</p>
              </div>
              <Link to="/jobs?featured=true" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors reveal">
                View all <ChevronRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.slice(0, 6).map((job, i) => (
                <div key={job.id} className={`reveal reveal-delay-${(i % 3) + 1}`}>
                  <JobCard job={job} />
                </div>
              ))}
            </div>
            <div className="text-center mt-10 reveal">
              <Link to="/jobs" className="px-6 py-3 bg-white hover:bg-slate-50 border border-white text-slate-600 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm">
                Browse All Jobs <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-b from-white via-sky-50/25 to-white border-y border-slate-100/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 reveal">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-white mb-3 shadow-sm">Simple Process</div>
            <h2 className="text-4xl font-black text-slate-800 mb-3">How JobPortal Works</h2>
            <p className="text-slate-500 text-sm font-semibold max-w-xl mx-auto leading-relaxed">
              From profile creation to getting hired — a seamless journey in 4 easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_STEPS.map((step, i) => (
              <div
                key={step.step}
                className={`reveal reveal-delay-${i + 1} bg-white/90 border border-white rounded-3xl p-6 shadow-[0_8px_24px_rgba(15,23,42,0.012)] hover:shadow-[0_16px_40px_rgba(99,102,241,0.04)] hover:border-indigo-100/50 hover:-translate-y-1 transition-all duration-300 flex flex-col relative backdrop-blur-md`}
              >
                {/* Connector arrow — desktop */}
                {i < HOW_STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-indigo-50 border border-white rounded-full items-center justify-center shadow-sm">
                    <ChevronRight size={12} className="text-indigo-600" />
                  </div>
                )}

                {/* Step number */}
                <div className="text-4xl font-black text-indigo-500/10 mb-4 leading-none">{step.step}</div>

                {/* Icon */}
                <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 text-indigo-600 border border-white shadow-sm">
                  {step.icon}
                </div>

                <h3 className="font-bold text-slate-800 mb-2 text-sm">{step.title}</h3>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 reveal">
            <Link to="/auth/signup" className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95">
              Start Your Journey <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-tr from-sky-50/20 via-white to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 reveal">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-white mb-3 shadow-sm">Platform Features</div>
            <h2 className="text-4xl font-black text-slate-800 mb-3">Why Choose JobPortal?</h2>
            <p className="text-slate-500 text-sm font-semibold max-w-lg mx-auto leading-relaxed">
              Everything you need to hire smarter or land your next role faster.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`reveal reveal-delay-${(i % 3) + 1} bg-white/90 border border-white rounded-3xl p-6 shadow-[0_8px_24px_rgba(15,23,42,0.012)] hover:shadow-[0_16px_40px_rgba(99,102,241,0.04)] hover:border-indigo-100/50 hover:-translate-y-1 transition-all duration-300 backdrop-blur-md`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${f.bg} border border-white shadow-sm`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-800 mb-2 text-sm">{f.title}</h3>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────────────────────────── */}
      <section id="about" className="py-20 px-4 bg-gradient-to-b from-white via-indigo-50/10 to-white border-t border-slate-100/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            {/* Left: text content */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-white mb-5 reveal shadow-sm">About Us</div>
              <h2 className="text-4xl font-black text-slate-800 mb-5 reveal">
                Connecting Talent with<br />
                <span className="gradient-text">Real Opportunity</span>
              </h2>
              <p className="text-slate-500 text-sm font-semibold leading-relaxed mb-5 reveal">
                JobPortal was built out of a simple frustration: the job market is full of noise. Ghost jobs, ignored applications, and slow hiring processes. We set out to fix that.
              </p>
              <p className="text-slate-500 text-sm font-semibold leading-relaxed mb-7 reveal">
                By combining verified job listings, AI-powered resume scoring (using Google Gemini), and real-time messaging, we've created a platform where every interaction is meaningful — whether you're a fresh graduate or a seasoned recruiter.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8 reveal">
                {[
                  { label: 'Founded', value: '2024' },
                  { label: 'Users', value: '12,000+' },
                  { label: 'Jobs Posted', value: '4,800+' },
                  { label: 'Success Rate', value: '94%' },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white/90 border border-white rounded-2xl p-5 shadow-[0_8px_24px_rgba(15,23,42,0.012)] backdrop-blur-md">
                    <p className="text-2xl font-black text-indigo-600">{kpi.value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{kpi.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 reveal">
                <Link to="/auth/signup" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95">
                  Join JobPortal <ArrowRight size={16} />
                </Link>
                <Link to="/jobs" className="px-6 py-3 bg-white hover:bg-slate-50 border border-white text-slate-600 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm">
                  Explore Jobs
                </Link>
              </div>
            </div>

            {/* Right: team / values cards */}
            <div className="flex flex-col gap-4 reveal">
              {[
                {
                  icon: <Zap size={20} className="text-indigo-600" />,
                  bg: 'bg-indigo-50 border border-white/50',
                  title: 'AI-First Approach',
                  desc: 'We use Google Gemini to analyse resumes and job descriptions with human-level nuance, giving both sides better decisions.'
                },
                {
                  icon: <Shield size={20} className="text-emerald-600" />,
                  bg: 'bg-emerald-50 border border-white/50',
                  title: 'Trust & Transparency',
                  desc: 'No hidden algorithms pushing sponsored results. Every job is reviewed, every score explained, every message encrypted.'
                },
                {
                  icon: <Users size={20} className="text-violet-600" />,
                  bg: 'bg-violet-50 border border-white/50',
                  title: 'Community-Driven',
                  desc: 'Built for everyone — from first-time applicants to executive recruiters — with tools scaled to each role.'
                },
              ].map((v, i) => (
                <div key={v.title} className={`reveal reveal-delay-${i + 1} flex items-start gap-4 bg-white/90 border border-white rounded-3xl p-5 shadow-[0_8px_24px_rgba(15,23,42,0.012)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.03)] hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-md`}>
                  <div className={`w-11 h-11 ${v.bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-white`}>
                    {v.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1 text-sm">{v.title}</h4>
                    <p className="text-xs font-semibold text-slate-400 leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM BANNER ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 relative overflow-hidden border-t border-slate-100/50 bg-gradient-to-br from-sky-50/30 via-white to-white">
        {/* decorative blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center reveal bg-white/90 border border-white rounded-3xl shadow-[0_16px_48px_rgba(15,23,42,0.015)] p-10 md:p-16 overflow-hidden backdrop-blur-md">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-white text-indigo-600 text-xs font-bold mb-6 shadow-sm">
              <Zap size={12} fill="currentColor" /> Free to join · No credit card needed
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 leading-tight">
              Ready to Transform<br />Your Career?
            </h2>
            <p className="text-slate-500 text-sm font-semibold mb-10 max-w-xl mx-auto leading-relaxed">
              Join 12,000+ professionals already using JobPortal. Create your free account and get matched to your next opportunity today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
              <Link to="/auth/signup" className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95">
                Create Free Account <ArrowRight size={16} />
              </Link>
              <Link to="/jobs" className="px-8 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                Browse Jobs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
