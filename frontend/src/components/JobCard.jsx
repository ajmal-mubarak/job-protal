import { Link } from 'react-router-dom'
import { MapPin, Clock, Star, Briefcase, ChevronRight } from 'lucide-react'
import { cn, timeAgo, formatSalary, jobTypeLabels } from '../lib/utils'

export default function JobCard({ job, className }) {
  const isFeatured = job.is_featured

  return (
    <Link
      to={`/jobs/${job.id}`}
      className={cn(
        'group block relative overflow-hidden bg-white/90 border border-white hover:border-indigo-100/80 rounded-2xl p-5 shadow-[0_8px_24px_rgba(15,23,42,0.012)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.04)] transition-all duration-300 hover:-translate-y-1 backdrop-blur-md',
        isFeatured && 'bg-gradient-to-br from-amber-50/10 via-white to-white border-amber-200/50 hover:border-amber-300/80',
        className
      )}
    >
      {/* Featured Highlight Bar */}
      {isFeatured && (
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-amber-500 rounded-l-2xl" />
      )}

      {/* Top Section */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Logo Placeholder */}
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))', 
              border: '1px solid rgba(99,102,241,0.1)' 
            }}
          >
            <Briefcase size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1 text-[15px] tracking-tight leading-snug">
              {job.title}
            </h3>
            <p className="text-xs font-medium text-slate-400 mt-0.5">{job.company_name || 'Confidential'}</p>
          </div>
        </div>

        {isFeatured && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 uppercase tracking-wider flex-shrink-0">
            <Star size={10} fill="currentColor" className="text-amber-500" /> Featured
          </span>
        )}
      </div>

      {/* Meta Location / Type / Time */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-4 text-xs text-slate-500 font-medium">
        {job.location && (
          <span className="flex items-center gap-1 bg-slate-50/80 px-2 py-0.5 rounded-md border border-slate-100">
            <MapPin size={12} className="text-indigo-500/80" /> {job.location}
          </span>
        )}
        {job.job_type && (
          <span className="flex items-center gap-1 bg-slate-50/80 px-2 py-0.5 rounded-md border border-slate-100">
            <Briefcase size={12} className="text-violet-500/80" /> {jobTypeLabels[job.job_type] || job.job_type}
          </span>
        )}
        <span className="flex items-center gap-1 text-slate-400 ml-auto font-normal text-[11px]">
          <Clock size={11} /> {timeAgo(job.created_at)}
        </span>
      </div>

      {/* Skills Required */}
      {job.skills_required?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.skills_required.slice(0, 3).map(skill => (
            <span key={skill} className="px-2.5 py-0.5 rounded-lg bg-indigo-50/30 text-indigo-700 font-semibold text-[10px] border border-indigo-100/30">
              {skill}
            </span>
          ))}
          {job.skills_required.length > 3 && (
            <span className="px-2 py-0.5 rounded-lg bg-slate-50 text-slate-500 font-medium text-[10px] border border-slate-100">
              +{job.skills_required.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Salary Range</span>
          <span className="text-sm font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            {formatSalary(job.salary_min, job.salary_max)}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50/50 group-hover:bg-indigo-600 group-hover:text-white px-2.5 py-1.5 rounded-xl transition-all duration-300">
          Apply <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
