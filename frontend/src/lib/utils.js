// Utility: merge Tailwind classes safely
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Format date to readable string
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Time ago
export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000)
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ]
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`
  }
  return 'just now'
}

// Format salary
export function formatSalary(min, max) {
  if (!min && !max) return 'Not disclosed'
  const fmt = (n) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
    return `₹${n}`
  }
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  return `Up to ${fmt(max)}`
}

// Status badge color mapping
export const statusColors = {
  applied: 'badge-primary',
  reviewing: 'badge-warning',
  shortlisted: 'badge-success',
  rejected: 'badge-error',
  hired: 'badge-success',
  active: 'badge-success',
  inactive: 'badge-error',
  pending: 'badge-warning',
  completed: 'badge-success',
  failed: 'badge-error',
}

export const jobTypeLabels = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  remote: 'Remote',
}
