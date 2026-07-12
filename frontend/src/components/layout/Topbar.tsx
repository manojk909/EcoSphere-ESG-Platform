import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/environmental/emission-factors': 'Emission Factors',
  '/environmental/carbon-tracking': 'Carbon Tracking',
  '/environmental/goals': 'Environmental Goals',
  '/social/csr-activities': 'CSR Activities',
  '/social/participation': 'Participation',
  '/social/diversity': 'Diversity & Inclusion',
  '/governance/policies': 'Policies',
  '/governance/audits': 'Audits',
  '/governance/compliance': 'Compliance',
  '/gamification/challenges': 'Challenges',
  '/gamification/leaderboard': 'Leaderboard',
  '/gamification/rewards': 'Rewards',
  '/gamification/badges': 'Badges',
  '/settings/departments': 'Departments',
  '/settings/categories': 'Categories',
  '/settings/configuration': 'Configuration',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path) && path !== '/') return title
  }
  return 'EcoSphere'
}

export default function Topbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [notificationCount] = useState(3)
  const pageTitle = getPageTitle(location.pathname)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/80 backdrop-blur-md px-6">
      {/* Left: Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">
          {pageTitle}
        </h1>
      </div>

      {/* Right: Search + Bell + User */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <Input
            placeholder="Search..."
            className="w-64 pl-9 h-9 bg-bg border-border text-sm"
            readOnly
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4 text-text-secondary" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
              {notificationCount}
            </span>
          )}
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 hover:bg-bg"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-env-primary to-social-primary text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium text-text-primary leading-tight">
                  {user?.name || 'User'}
                </span>
                <span className="text-[10px] text-text-secondary leading-tight capitalize">
                  {user?.role || 'employee'}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-text-secondary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                <p className="text-xs text-text-secondary">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user && (
              <>
                <div className="px-2 py-1.5 flex items-center gap-2">
                  <Badge variant="game" className="text-[10px]">
                    {user.xp} XP
                  </Badge>
                  <Badge variant="env" className="text-[10px]">
                    {user.pointsBalance} Points
                  </Badge>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-danger focus:text-danger" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
