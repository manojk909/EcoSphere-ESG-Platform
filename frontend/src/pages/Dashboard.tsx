import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Leaf,
  Users,
  Shield,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  accentColor: string
  lightColor: string
  badgeVariant: 'env' | 'social' | 'gov' | 'game'
}

function KPICard({ title, value, change, changeType, icon, accentColor, lightColor, badgeVariant }: KPICardProps) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${lightColor} -mr-8 -mt-8 opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-text-secondary">
          {title}
        </CardTitle>
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${lightColor}`}>
          <span className={accentColor}>{icon}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-text-primary mb-1">{value}</div>
        <div className="flex items-center gap-2">
          <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0">
            {changeType === 'positive' && <ArrowUpRight className="h-3 w-3 mr-0.5" />}
            {change}
          </Badge>
          <span className="text-xs text-text-secondary">vs last month</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  const kpiCards: KPICardProps[] = [
    {
      title: 'Environmental Score',
      value: '78',
      change: '+5.2%',
      changeType: 'positive',
      icon: <Leaf className="h-4 w-4" />,
      accentColor: 'text-env-primary',
      lightColor: 'bg-env-light',
      badgeVariant: 'env',
    },
    {
      title: 'Social Score',
      value: '82',
      change: '+3.8%',
      changeType: 'positive',
      icon: <Users className="h-4 w-4" />,
      accentColor: 'text-social-primary',
      lightColor: 'bg-social-light',
      badgeVariant: 'social',
    },
    {
      title: 'Governance Score',
      value: '91',
      change: '+1.2%',
      changeType: 'positive',
      icon: <Shield className="h-4 w-4" />,
      accentColor: 'text-gov-primary',
      lightColor: 'bg-gov-light',
      badgeVariant: 'gov',
    },
    {
      title: 'Overall ESG',
      value: '84',
      change: '+3.4%',
      changeType: 'positive',
      icon: <TrendingUp className="h-4 w-4" />,
      accentColor: 'text-game-primary',
      lightColor: 'bg-game-light',
      badgeVariant: 'game',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-env-primary via-emerald-600 to-teal-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full -mb-24" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-emerald-200" />
            <span className="text-emerald-200 text-sm font-medium">
              Welcome back
            </span>
          </div>
          <h2 className="text-3xl font-bold mb-2">
            Hello, {user?.name || 'there'}! 👋
          </h2>
          <p className="text-emerald-100 max-w-lg">
            Track your organization&apos;s sustainability metrics, manage ESG compliance, and drive positive environmental impact — all in one place.
          </p>
          {user && (
            <div className="flex items-center gap-3 mt-4">
              <div className="px-3 py-1.5 bg-white/15 rounded-lg backdrop-blur-sm text-sm font-medium">
                🏆 {user.xp} XP
              </div>
              <div className="px-3 py-1.5 bg-white/15 rounded-lg backdrop-blur-sm text-sm font-medium">
                💰 {user.pointsBalance} Points
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <KPICard key={card.title} {...card} />
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Carbon emission logged', module: 'Environmental', time: '2 hours ago', color: 'bg-env-primary' },
                { action: 'CSR activity completed', module: 'Social', time: '5 hours ago', color: 'bg-social-primary' },
                { action: 'Policy review submitted', module: 'Governance', time: '1 day ago', color: 'bg-gov-primary' },
                { action: 'Challenge milestone reached', module: 'Gamification', time: '2 days ago', color: 'bg-game-primary' },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 py-2">
                  <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{item.action}</p>
                    <p className="text-xs text-text-secondary">{item.module}</p>
                  </div>
                  <span className="text-xs text-text-secondary whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'CO₂ Reduced', value: '12.4t', color: 'text-env-primary', bg: 'bg-env-light' },
                { label: 'CSR Hours', value: '248h', color: 'text-social-primary', bg: 'bg-social-light' },
                { label: 'Policies Active', value: '15', color: 'text-gov-primary', bg: 'bg-gov-light' },
                { label: 'Challenges Won', value: '8', color: 'text-game-primary', bg: 'bg-game-light' },
              ].map((stat) => (
                <div key={stat.label} className={`${stat.bg} rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-text-secondary mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
