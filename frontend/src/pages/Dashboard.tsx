import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Leaf, Users, Shield, Target, AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAuth } from '@/context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [recalcLoading, setRecalcLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/dashboard')
      setData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRecalculate = async () => {
    setRecalcLoading(true)
    try {
      // In a real app we'd ask for the period, hardcoding 2026-Q3 for demo
      await api.post('/scores/recalculate', { period: '2026-Q3' })
      await fetchData()
    } catch (e) {
      console.error(e)
    } finally {
      setRecalcLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading dashboard...</div>

  const { overallESG, scores, metrics } = data || {}

  const chartData = (scores || []).map((s: any) => ({
    name: s.department.name,
    Environmental: Number(s.envScore).toFixed(1),
    Social: Number(s.socialScore).toFixed(1),
    Governance: Number(s.govScore).toFixed(1),
    Total: Number(s.totalScore).toFixed(1)
  }))

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organization Dashboard</h2>
          <p className="text-text-secondary">Welcome back, {user?.name}. Here's your ESG overview.</p>
        </div>
        {user?.role === 'ADMIN' && (
          <Button onClick={handleRecalculate} disabled={recalcLoading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${recalcLoading ? 'animate-spin' : ''}`} />
            Recalculate Scores
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-env-light to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall ESG Score</CardTitle>
            <Target className="h-4 w-4 text-env-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallESG ? Number(overallESG).toFixed(1) : '--'} / 100</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-social-light to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <CheckCircle className="h-4 w-4 text-social-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.pendingApprovals || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gov-light to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Compliance Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{metrics?.openIssues || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-game-light to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
            <Users className="h-4 w-4 text-game-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeChallenges || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Comparison</CardTitle>
          <CardDescription>Breakdown of ESG scores by department (Period: 2026-Q3)</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Environmental" fill="#059669" />
                <Bar dataKey="Social" fill="#2563EB" />
                <Bar dataKey="Governance" fill="#7C3AED" />
                <Bar dataKey="Total" fill="#0F172A" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-text-secondary">
              No scores calculated yet. Click "Recalculate Scores".
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
