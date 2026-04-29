import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'

export default function Sidebar({ items }) {
  const location = useLocation()

  return (
    <aside className="w-56 flex-shrink-0 hidden lg:flex flex-col gap-1 pt-2">
      {items.map((item) => {
        const active = location.pathname === item.href ||
          (item.href !== '/' && location.pathname.startsWith(item.href) && item.href !== '/dashboard')
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(active ? 'nav-item-active' : 'nav-item')}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto badge badge-primary text-[10px]">{item.badge}</span>
            )}
          </Link>
        )
      })}
    </aside>
  )
}
