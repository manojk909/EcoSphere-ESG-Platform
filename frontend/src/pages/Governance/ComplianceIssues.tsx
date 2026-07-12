import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ComplianceIssue {
  id: string
  description: string
  severity: string
  status: string
  dueDate: string
  isOverdue: boolean
  owner: { name: string; email: string }
  audit: { scope: string; department: { name: string } }
}

export default function ComplianceIssues() {
  const { toast } = useToast()
  const [issues, setIssues] = useState<ComplianceIssue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIssues()
  }, [])

  const fetchIssues = async () => {
    try {
      const data = await api.get<ComplianceIssue[]>('/governance/issues')
      setIssues(data)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to fetch issues', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (issueId: string, status: string) => {
    try {
      await api.put(`/governance/issues/${issueId}/status`, { status })
      toast({ title: 'Success', description: `Issue status updated to ${status}` })
      fetchIssues()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-600 hover:bg-red-700 text-white'
      case 'HIGH': return 'bg-orange-500 hover:bg-orange-600 text-white'
      case 'MEDIUM': return 'bg-yellow-500 hover:bg-yellow-600 text-black'
      case 'LOW': return 'bg-blue-500 hover:bg-blue-600 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  if (loading) return <div className="p-6">Loading compliance issues...</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance Issues</h1>
        <p className="text-text-secondary">Track and manage identified compliance issues.</p>
      </div>

      <div className="grid gap-4">
        {issues.map((issue) => (
          <Card key={issue.id} className={issue.isOverdue ? 'border-red-500 shadow-sm shadow-red-200' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {issue.isOverdue && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    {issue.description}
                  </CardTitle>
                  <p className="text-sm text-text-secondary mt-1">
                    Owner: {issue.owner.name} · Audit: {issue.audit.scope} · Dept: {issue.audit.department.name}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  {issue.isOverdue && (
                    <Badge variant="destructive" className="animate-pulse">OVERDUE</Badge>
                  )}
                  <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-text-secondary">Due Date: </span>
                  <span className={issue.isOverdue ? 'text-red-600 font-bold' : ''}>
                    {new Date(issue.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-text-secondary">Status: </span>
                  <Badge variant="outline">{issue.status}</Badge>
                </div>
              </div>
              {issue.status !== 'RESOLVED' && (
                <div className="flex gap-2">
                  {issue.status === 'OPEN' && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(issue.id, 'IN_PROGRESS')}>
                      Mark In Progress
                    </Button>
                  )}
                  <Button size="sm" onClick={() => handleStatusChange(issue.id, 'RESOLVED')}>
                    Resolve
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {issues.length === 0 && (
          <div className="text-center py-10 text-text-secondary">No compliance issues found.</div>
        )}
      </div>
    </div>
  )
}
