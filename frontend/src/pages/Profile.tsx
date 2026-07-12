import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Award, Coins, Trophy, Shield, Mail, Building2, Briefcase } from 'lucide-react'

interface BadgeItem {
  id: string; awardedAt: string
  badge: { id: string; name: string; description: string; icon: string }
}

export default function Profile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [badges, setBadges] = useState<BadgeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<BadgeItem[]>('/gamification/badges')
      .then(setBadges)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (!user) return null

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-env-primary via-social-primary to-gov-primary" />
        <CardContent className="relative pt-0 pb-6 -mt-10">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-env-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold text-text-primary">{user.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className="capitalize">{user.role.replace('_', ' ')}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-env-light"><Mail className="h-5 w-5 text-env-primary" /></div>
            <div><p className="text-xs text-text-secondary">Email</p><p className="font-medium text-sm">{user.email}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-social-light"><Building2 className="h-5 w-5 text-social-primary" /></div>
            <div><p className="text-xs text-text-secondary">Department</p><p className="font-medium text-sm">{user.departmentId?.substring(0, 8) || 'N/A'}...</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gov-light"><Briefcase className="h-5 w-5 text-gov-primary" /></div>
            <div><p className="text-xs text-text-secondary">Role</p><p className="font-medium text-sm capitalize">{user.role.replace('_', ' ').toLowerCase()}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* XP & Points */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-game-light">
          <CardContent className="pt-6 text-center">
            <Trophy className="h-8 w-8 text-game-primary mx-auto mb-2" />
            <p className="text-3xl font-bold text-game-primary">{user.xp}</p>
            <p className="text-sm text-text-secondary">Total XP</p>
          </CardContent>
        </Card>
        <Card className="border-social-light">
          <CardContent className="pt-6 text-center">
            <Coins className="h-8 w-8 text-social-primary mx-auto mb-2" />
            <p className="text-3xl font-bold text-social-primary">{user.pointsBalance}</p>
            <p className="text-sm text-text-secondary">Points Balance</p>
          </CardContent>
        </Card>
        <Card className="border-env-light">
          <CardContent className="pt-6 text-center">
            <Award className="h-8 w-8 text-env-primary mx-auto mb-2" />
            <p className="text-3xl font-bold text-env-primary">{badges.length}</p>
            <p className="text-sm text-text-secondary">Badges Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />My Badges</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-text-secondary text-center py-4">Loading...</p> : badges.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Award className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-text-secondary">No badges earned yet. Keep participating!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {badges.map(eb => (
                <div key={eb.id} className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-2">{eb.badge.icon || '🏅'}</div>
                  <p className="font-semibold text-sm">{eb.badge.name}</p>
                  <p className="text-xs text-text-secondary mt-1">{eb.badge.description}</p>
                  <p className="text-[10px] text-game-primary mt-2">Earned {new Date(eb.awardedAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
