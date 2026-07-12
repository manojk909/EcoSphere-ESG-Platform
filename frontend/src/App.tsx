import { Navigate, Outlet } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import AppShell from '@/components/layout/AppShell'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Dashboard from '@/pages/Dashboard'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import Profile from '@/pages/Profile'
import { Loader2 } from 'lucide-react'

// Environmental Pages
import EmissionFactors from '@/pages/Environmental/EmissionFactors'
import CarbonTracking from '@/pages/Environmental/CarbonTracking'
import Goals from '@/pages/Environmental/Goals'
import EnvDashboard from '@/pages/Environmental/Dashboard'

// Social Pages
import CsrActivities from '@/pages/Social/CsrActivities'
import Approvals from '@/pages/Social/Approvals'
import Diversity from '@/pages/Social/Diversity'

// Governance Pages
import Policies from '@/pages/Governance/Policies'
import Audits from '@/pages/Governance/Audits'
import ComplianceIssues from '@/pages/Governance/ComplianceIssues'

// Gamification Pages
import Challenges from '@/pages/Gamification/Challenges'
import Leaderboard from '@/pages/Gamification/Leaderboard'
import Rewards from '@/pages/Gamification/Rewards'
import Badges from '@/pages/Gamification/Badges'

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-env-primary" />
          <p className="text-sm text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-env-primary" />
          <p className="text-sm text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />

          {/* Environmental */}
          <Route path="/environmental/dashboard" element={<EnvDashboard />} />
          <Route path="/environmental/emission-factors" element={<EmissionFactors />} />
          <Route path="/environmental/carbon-tracking" element={<CarbonTracking />} />
          <Route path="/environmental/goals" element={<Goals />} />

          {/* Social */}
          <Route path="/social/csr-activities" element={<CsrActivities />} />
          <Route path="/social/participation" element={<Approvals />} />
          <Route path="/social/diversity" element={<Diversity />} />

          {/* Governance */}
          <Route path="/governance/policies" element={<Policies />} />
          <Route path="/governance/audits" element={<Audits />} />
          <Route path="/governance/compliance" element={<ComplianceIssues />} />

          {/* Gamification */}
          <Route path="/gamification/challenges" element={<Challenges />} />
          <Route path="/gamification/leaderboard" element={<Leaderboard />} />
          <Route path="/gamification/rewards" element={<Rewards />} />
          <Route path="/gamification/badges" element={<Badges />} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
