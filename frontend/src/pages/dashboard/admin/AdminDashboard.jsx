import { useState, useEffect } from 'react'
import { Users, BarChart2, Shield, AlertCircle, Search, Loader } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../../../components/layout/Navbar'
import Sidebar from '../../../components/layout/Sidebar'
import { adminApi } from '../../../api/admin'
import { cn, timeAgo } from '../../../lib/utils'

const SIDEBAR_ITEMS = [
  { href: '/dashboard/admin', label: 'Users', icon: <Users size={16} /> },
]

const ROLE_COLORS = {
  admin: 'badge-error',
  employer: 'badge-primary',
  recruiter: 'badge-warning',
  jobseeker: 'badge-success',
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toggling, setToggling] = useState({})

  useEffect(() => {
    Promise.all([
      adminApi.listUsers(),
      adminApi.stats(),
    ]).then(([userRes, statsRes]) => {
      setUsers(userRes.data?.items || userRes.data || [])
      setStats(statsRes.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const toggleActive = async (userId, currentActive) => {
    setToggling((t) => ({ ...t, [userId]: true }))
    try {
      await adminApi.toggleUserActive(userId)
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !u.is_active } : u))
      toast.success(currentActive ? 'User deactivated' : 'User activated')
    } catch { toast.error('Failed to toggle user') }
    finally { setToggling((t) => ({ ...t, [userId]: false })) }
  }

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex gap-8">
        <Sidebar items={SIDEBAR_ITEMS} />

        <main className="flex-1 min-w-0">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Shield size={22} className="text-primary-light" /> Admin Dashboard
            </h1>
            <p className="text-text-muted text-sm mt-1">Manage users and platform health</p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Users',  value: stats.total_users ?? 0 },
                { label: 'Employers',    value: stats.users_by_role?.employer ?? 0 },
                { label: 'Recruiters',   value: stats.users_by_role?.recruiter ?? 0 },
                { label: 'Job Seekers',  value: stats.users_by_role?.jobseeker ?? 0 },
                { label: 'Total Jobs',   value: stats.total_jobs ?? 0 },
                { label: 'Active Jobs',  value: stats.active_jobs ?? 0 },
                { label: 'Featured',     value: stats.featured_jobs ?? 0 },
                { label: 'Applications', value: stats.total_applications ?? 0 },
              ].map((s) => (
                <div key={s.label} className="stat-card">
                  <p className="text-xs text-text-muted mb-1">{s.label}</p>
                  <p className="text-2xl font-bold text-text-primary">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-5">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              id="admin-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search users by name or email..."
              className="input pl-10"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader size={24} className="text-primary animate-spin" />
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 border-b border-border">
                  <tr>
                    {['User', 'Role', 'Verified', 'Status', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-text-muted px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-text-primary text-sm">{u.name}</p>
                          <p className="text-xs text-text-muted">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('badge capitalize', ROLE_COLORS[u.role] || 'badge-muted')}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={u.is_verified ? 'text-success text-xs' : 'text-error text-xs'}>
                          {u.is_verified ? '✓ Yes' : '✗ No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={u.is_active ? 'badge-success badge' : 'badge-error badge'}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">{timeAgo(u.created_at)}</td>
                      <td className="px-4 py-3">
                        {u.role !== 'admin' && (
                          <button
                            id={`toggle-user-${u.id}`}
                            onClick={() => toggleActive(u.id, u.is_active)}
                            disabled={toggling[u.id]}
                            className={cn('text-xs px-3 py-1.5 rounded-lg border transition-all', u.is_active ? 'border-error/30 text-error hover:bg-error/10' : 'border-success/30 text-success hover:bg-success/10')}
                          >
                            {toggling[u.id] ? '...' : u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-8 text-text-muted text-sm">No users found</div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
