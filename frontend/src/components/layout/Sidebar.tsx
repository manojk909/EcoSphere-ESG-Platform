import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import {
  Leaf,
  LayoutDashboard,
  Factory,
  Footprints,
  Target,
  Heart,
  Users,
  PieChart,
  Shield,
  FileCheck,
  ClipboardCheck,
  Trophy,
  Medal,
  Gift,
  Award,
  Settings,
  Building2,
  Tags,
  Wrench,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

interface NavGroup {
  title: string
  color: string
  textColor: string
  bgColor: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: '',
    color: 'text-text-secondary',
    textColor: 'text-text-primary',
    bgColor: 'bg-bg',
    items: [
      { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: 'Reports', path: '/reports', icon: <FileText className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Environmental',
    color: 'text-env-primary',
    textColor: 'text-env-primary',
    bgColor: 'bg-env-light',
    items: [
      { label: 'Emission Factors', path: '/environmental/emission-factors', icon: <Factory className="h-4 w-4" /> },
      { label: 'Carbon Tracking', path: '/environmental/carbon-tracking', icon: <Footprints className="h-4 w-4" /> },
      { label: 'Goals', path: '/environmental/goals', icon: <Target className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Social',
    color: 'text-social-primary',
    textColor: 'text-social-primary',
    bgColor: 'bg-social-light',
    items: [
      { label: 'CSR Activities', path: '/social/csr-activities', icon: <Heart className="h-4 w-4" /> },
      { label: 'Participation', path: '/social/participation', icon: <Users className="h-4 w-4" /> },
      { label: 'Diversity', path: '/social/diversity', icon: <PieChart className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Governance',
    color: 'text-gov-primary',
    textColor: 'text-gov-primary',
    bgColor: 'bg-gov-light',
    items: [
      { label: 'Policies', path: '/governance/policies', icon: <Shield className="h-4 w-4" /> },
      { label: 'Audits', path: '/governance/audits', icon: <FileCheck className="h-4 w-4" /> },
      { label: 'Compliance', path: '/governance/compliance', icon: <ClipboardCheck className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Gamification',
    color: 'text-game-primary',
    textColor: 'text-game-primary',
    bgColor: 'bg-game-light',
    items: [
      { label: 'Challenges', path: '/gamification/challenges', icon: <Trophy className="h-4 w-4" /> },
      { label: 'Leaderboard', path: '/gamification/leaderboard', icon: <Medal className="h-4 w-4" /> },
      { label: 'Rewards', path: '/gamification/rewards', icon: <Gift className="h-4 w-4" /> },
      { label: 'Badges', path: '/gamification/badges', icon: <Award className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Settings',
    color: 'text-text-secondary',
    textColor: 'text-text-primary',
    bgColor: 'bg-bg',
    items: [
      { label: 'Departments', path: '/settings/departments', icon: <Building2 className="h-4 w-4" /> },
      { label: 'Categories', path: '/settings/categories', icon: <Tags className="h-4 w-4" /> },
      { label: 'Configuration', path: '/settings/configuration', icon: <Wrench className="h-4 w-4" /> },
    ],
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-surface border-r border-border flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-env-primary to-emerald-600 shadow-md">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-base font-bold text-text-primary tracking-tight">
              EcoSphere
            </span>
            <span className="text-[10px] font-medium text-text-secondary uppercase tracking-widest">
              ESG Platform
            </span>
          </div>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-2">
            {group.title && !collapsed && (
              <p className={cn('text-[11px] font-semibold uppercase tracking-wider mb-2 px-3', group.color)}>
                {group.title}
              </p>
            )}
            {group.title && collapsed && <Separator className="my-2" />}
            {group.items.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path)

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group relative',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? cn(group.bgColor, group.textColor, 'shadow-sm')
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg'
                  )}
                >
                  <span
                    className={cn(
                      'shrink-0 transition-colors duration-200',
                      isActive ? group.textColor : 'text-text-secondary group-hover:text-text-primary'
                    )}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-text-primary text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <Separator />

      {/* User role + collapse */}
      <div className="p-3 shrink-0">
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-bg">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-env-primary to-social-primary flex items-center justify-center text-white text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-text-primary truncate">{user.name}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 w-fit capitalize">
                {user.role}
              </Badge>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors duration-200"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2 text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
