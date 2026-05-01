import { Link } from 'react-router-dom'
import { MapPin, Clock, Star, Briefcase, TrendingUp } from 'lucide-react'
import { cn, timeAgo, formatSalary, jobTypeLabels } from '../lib/utils'

export default function JobCard({ job, className }) {
  const isFeatured = job.is_featured

  return (
    <Link
      to={`/jobs/${job.id}`}
      className={cn(
        'card-hover block p-5 group relative overflow-hidden transition-all duration-300',
        isFeatured ? 'border-warning/50 bg-gradient-to-br from-warning/10 via-surface to-surface shadow-[0_0_15px_rgba(234,179,8,0.1)]' : '',
        className
      )}
    >
      {/* Featured Accent Bar */}
      {isFeatured && (
        <div className="absolute top-0 left-0 w-1 h-full bg-warning/80" />
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-3 border border-border flex items-center justify-center flex-shrink-0">
            <Briefcase size={18} className="text-text-muted" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary text-sm group-hover:text-primary-light transition-colors line-clamp-1">
              {job.title}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {job.company_name || 'Confidential'}
            </p>
          </div>
        </div>
        {isFeatured && (
          <span className="badge-featured flex-shrink-0">
            <Star size={10} fill="currentColor" /> Featured
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {job.location && (
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <MapPin size={11} /> {job.location}
          </span>
        )}
        {job.job_type && (
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <TrendingUp size={11} /> {jobTypeLabels[job.job_type] || job.job_type}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-text-muted ml-auto">
          <Clock size={11} /> {timeAgo(job.created_at)}
        </span>
      </div>

      {/* Skills */}
      {job.skills_required?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.skills_required.slice(0, 4).map((skill) => (
            <span key={skill} className="badge-muted text-[11px]">{skill}</span>
          ))}
          {job.skills_required.length > 4 && (
            <span className="badge-muted text-[11px]">+{job.skills_required.length - 4}</span>
          )}
        </div>
      )}

      {/* Salary */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-primary-light">
          {formatSalary(job.salary_min, job.salary_max)}
        </span>
        <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          View Details →
        </span>
      </div>
    </Link>
  )
}
