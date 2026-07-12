import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Leaf, Users, Shield, Target, AlertTriangle, CheckCircle, RefreshCcw, Trophy, Bell, ArrowRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useAuth } from '@/context/AuthContext'

const COLORS = ['#059669', '#2563EB', '#7C3AED', '#F59E0B']

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [recalcLoading, setRecalcLoading] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [dashRes, notifRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get<any[]>('/notifications').catch(() => [])
      ])
      setData(dashRes)
      setNotifications(Array.isArray(notifRes) ? notifRes.slice(0, 5) : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleRecalculate = async () => {
    setRecalcLoading(true)
    try {
      await api.post('/scores/recalculate', { period: '2024-Q2' })
      await fetchData()
    } catch (e) { console.error(e) }
    finally { setRecalcLoading(false) }
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-env-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">Loading dashboard...</p>
      </div>
    </div>
  )

  const { overallESG, scores, metrics } = data || {}

  const chartData = (scores || []).map((s: any) => ({
    name: s.department?.name || 'Unknown',
    Environmental: Number(s.envScore),
    Social: Number(s.socialScore),
    Governance: Number(s.govScore),
    Total: Number(s.totalScore)
  }))

  const pieData = [
    { name: 'Environmental', value: scores?.[0] ? Number(scores[0].envScore) : 40 },
    { name: 'Social', value: scores?.[0] ? Number(scores[0].socialScore) : 30 },
    { name: 'Governance', value: scores?.[0] ? Number(scores[0].govScore) : 30 },
  ]

  const quickActions = [
    { label: 'Log Emissions', path: '/environmental/carbon-tracking', color: 'bg-env-light text-env-primary', icon: <Leaf className="h-4 w-4" /> },
    { label: 'Join Challenge', path: '/gamification/challenges', color: 'bg-game-light text-game-primary', icon: <Trophy className="h-4 w-4" /> },
    { label: 'View Policies', path: '/governance/policies', color: 'bg-gov-light text-gov-primary', icon: <Shield className="h-4 w-4" /> },
    { label: 'CSR Activities', path: '/social/csr-activities', color: 'bg-social-light text-social-primary', icon: <Users className="h-4 w-4" /> },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">EcoSphere Dashboard</h2>
          <p className="text-text-secondary">Welcome back, {user?.name}. Here's your ESG overview.</p>
        </div>
        {user?.role === 'ADMIN' && (
          <Button onClick={handleRecalculate} disabled={recalcLoading} variant="outline">
            <RefreshCcw className={`mr-2 h-4 w-4 ${recalcLoading ? 'animate-spin' : ''}`} />
            Recalculate Scores
          </Button>
        )}
      </div>

      {/* Score Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-env-light to-white border-env-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall ESG Score</CardTitle>
            <Target className="h-4 w-4 text-env-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-env-primary">{overallESG ? Number(overallESG).toFixed(1) : '--'}</div>
            <p className="text-xs text-text-secondary mt-1">out of 100</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-social-light to-white border-social-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <CheckCircle className="h-4 w-4 text-social-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-social-primary">{metrics?.pendingApprovals || 0}</div>
            <p className="text-xs text-text-secondary mt-1">CSR + Challenges</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Compliance Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{metrics?.openIssues || 0}</div>
            <p className="text-xs text-text-secondary mt-1">requires attention</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-game-light to-white border-game-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
            <Trophy className="h-4 w-4 text-game-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-game-primary">{metrics?.activeChallenges || 0}</div>
            <p className="text-xs text-text-secondary mt-1">join to earn XP</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Department ESG Comparison</CardTitle>
            <CardDescription>Breakdown of scores by department</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Environmental" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Social" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Governance" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-text-secondary">
                No scores calculated yet. Click "Recalculate Scores".
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ESG Distribution</CardTitle>
            <CardDescription>Score weight breakdown</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions + Notifications */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickActions.map(a => (
              <button key={a.path} onClick={() => navigate(a.path)}
                className={`flex items-center gap-3 p-3 rounded-lg ${a.color} hover:shadow-md transition-all text-left`}>
                {a.icon}
                <span className="text-sm font-medium">{a.label}</span>
                <ArrowRight className="h-3 w-3 ml-auto opacity-50" />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Notifications</CardTitle>
            <Bell className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-4">No recent notifications</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((n: any) => (
                  <div key={n.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-bg transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 ${n.isRead ? 'bg-gray-300' : 'bg-env-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary line-clamp-2">{n.message}</p>
                      <p className="text-xs text-text-secondary mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{n.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Department Scores Table */}
      {(scores || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Department ESG Rankings</CardTitle>
            <CardDescription>Detailed score breakdown by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-bg/50">
                    <th className="text-left p-3 font-medium">Department</th>
                    <th className="text-center p-3 font-medium text-env-primary">Environmental</th>
                    <th className="text-center p-3 font-medium text-social-primary">Social</th>
                    <th className="text-center p-3 font-medium text-gov-primary">Governance</th>
                    <th className="text-center p-3 font-medium">Total Score</th>
                  </tr>
                </thead>
                <tbody>
                  {(scores || []).map((s: any) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{s.department?.name}</td>
                      <td className="p-3 text-center"><Badge variant="outline" className="bg-env-light/50">{Number(s.envScore).toFixed(1)}</Badge></td>
                      <td className="p-3 text-center"><Badge variant="outline" className="bg-social-light/50">{Number(s.socialScore).toFixed(1)}</Badge></td>
                      <td className="p-3 text-center"><Badge variant="outline" className="bg-gov-light/50">{Number(s.govScore).toFixed(1)}</Badge></td>
                      <td className="p-3 text-center font-bold">{Number(s.totalScore).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
