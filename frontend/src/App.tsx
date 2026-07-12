import { Navigate, Outlet } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import AppShell from '@/components/layout/AppShell'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Dashboard from '@/pages/Dashboard'
import { Loader2 } from 'lucide-react'

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

          {/* Environmental */}
          <Route path="/environmental/emission-factors" element={<ModulePlaceholder title="Emission Factors" color="bg-env-light" />} />
          <Route path="/environmental/carbon-tracking" element={<ModulePlaceholder title="Carbon Tracking" color="bg-env-light" />} />
          <Route path="/environmental/goals" element={<ModulePlaceholder title="Environmental Goals" color="bg-env-light" />} />

          {/* Social */}
          <Route path="/social/csr-activities" element={<ModulePlaceholder title="CSR Activities" color="bg-social-light" />} />
          <Route path="/social/participation" element={<ModulePlaceholder title="Participation" color="bg-social-light" />} />
          <Route path="/social/diversity" element={<ModulePlaceholder title="Diversity & Inclusion" color="bg-social-light" />} />

          {/* Governance */}
          <Route path="/governance/policies" element={<ModulePlaceholder title="Policies" color="bg-gov-light" />} />
          <Route path="/governance/audits" element={<ModulePlaceholder title="Audits" color="bg-gov-light" />} />
          <Route path="/governance/compliance" element={<ModulePlaceholder title="Compliance" color="bg-gov-light" />} />

          {/* Gamification */}
          <Route path="/gamification/challenges" element={<ModulePlaceholder title="Challenges" color="bg-game-light" />} />
          <Route path="/gamification/leaderboard" element={<ModulePlaceholder title="Leaderboard" color="bg-game-light" />} />
          <Route path="/gamification/rewards" element={<ModulePlaceholder title="Rewards" color="bg-game-light" />} />
          <Route path="/gamification/badges" element={<ModulePlaceholder title="Badges" color="bg-game-light" />} />

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
