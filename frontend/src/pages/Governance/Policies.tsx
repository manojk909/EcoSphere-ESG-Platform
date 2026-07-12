import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Shield, CheckCircle, Plus } from 'lucide-react'

interface Policy {
  id: string
  title: string
  body: string
  version: number
  status: string
  acknowledgements: any[]
  _count: { acknowledgements: number }
  createdAt: string
}

export default function Policies() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({ title: '', body: '' })

  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    fetchPolicies()
  }, [])

  const fetchPolicies = async () => {
    try {
      const data = await api.get<Policy[]>('/governance/policies')
      setPolicies(data)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to fetch policies', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await api.post('/governance/policies', form)
      toast({ title: 'Success', description: 'Policy created' })
      setIsCreateOpen(false)
      setForm({ title: '', body: '' })
      fetchPolicies()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const handleAcknowledge = async (policyId: string) => {
    try {
      await api.post(`/governance/policies/${policyId}/acknowledge`, {})
      toast({ title: 'Success', description: 'Policy acknowledged!' })
      fetchPolicies()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  if (loading) return <div className="p-6">Loading policies...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ESG Policies</h1>
          <p className="text-text-secondary">View and acknowledge company ESG policies.</p>
        </div>
        {isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Create Policy</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Policy</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Policy title" />
                </div>
                <div className="space-y-2">
                  <Label>Body</Label>
                  <Textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Policy content" rows={5} />
                </div>
                <Button onClick={handleCreate} className="w-full">Create Policy</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6">
        {policies.map((policy) => {
          const alreadyAcked = policy.acknowledgements && policy.acknowledgements.length > 0

          return (
            <Card key={policy.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-gov-primary" />
                      {policy.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Version {policy.version} · {policy._count.acknowledgements} acknowledgements
                    </CardDescription>
                  </div>
                  {alreadyAcked ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="mr-1 h-3 w-3" /> Acknowledged
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={() => handleAcknowledge(policy.id)}>
                      Acknowledge
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm text-text-secondary">{policy.body}</div>
              </CardContent>
            </Card>
          )
        })}
        {policies.length === 0 && (
          <div className="text-center py-10 text-text-secondary">No policies found.</div>
        )}
      </div>
    </div>
  )
}
