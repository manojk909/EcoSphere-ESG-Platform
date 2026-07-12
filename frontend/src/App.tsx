import { Navigate, Outlet } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import AppShell from '@/components/layout/AppShell'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Dashboard from '@/pages/Dashboard'
import Reports from '@/pages/Reports'
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

// Placeholder component for module pages not yet built
function ModulePlaceholder({ title, color }: { title: string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mb-4`}>
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-xl font-semibold text-text-primary mb-2">{title}</h2>
      <p className="text-text-secondary max-w-md">
        This module is under construction. Check back soon for exciting ESG management features!
      </p>
    </div>
  )
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

          {/* Settings */}
          <Route path="/settings/departments" element={<ModulePlaceholder title="Departments" color="bg-bg" />} />
          <Route path="/settings/categories" element={<ModulePlaceholder title="Categories" color="bg-bg" />} />
          <Route path="/settings/configuration" element={<ModulePlaceholder title="Configuration" color="bg-bg" />} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
