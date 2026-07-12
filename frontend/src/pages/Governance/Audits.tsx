import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, FileCheck } from 'lucide-react'

interface Audit {
  id: string
  scope: string
  date: string
  status: string
  department: { name: string }
  auditor: { name: string; email: string }
  _count: { issues: number }
}

interface Department {
  id: string
  name: string
}

interface Employee {
  id: string
  name: string
  email: string
}

export default function Audits() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [audits, setAudits] = useState<Audit[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({ scope: '', departmentId: '', date: '', auditorId: '' })

  const canManage = user?.role === 'ADMIN' || user?.role === 'DEPT_HEAD'

  useEffect(() => {
    fetchAudits()
    api.get<any>('/departments').then(res => setDepartments(Array.isArray(res) ? res : res.departments || [])).catch(console.error)
    api.get<any>('/employees').then(res => setEmployees(Array.isArray(res) ? res : res.employees || [])).catch(console.error)
  }, [])

  const fetchAudits = async () => {
    try {
      const data = await api.get<Audit[]>('/governance/audits')
      setAudits(data)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to fetch audits', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await api.post('/governance/audits', {
        ...form,
        date: new Date(form.date).toISOString()
      })
      toast({ title: 'Success', description: 'Audit scheduled' })
      setIsCreateOpen(false)
      setForm({ scope: '', departmentId: '', date: '', auditorId: '' })
      fetchAudits()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  if (loading) return <div className="p-6">Loading audits...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audits</h1>
          <p className="text-text-secondary">Manage and schedule compliance audits.</p>
        </div>
        {canManage && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Schedule Audit</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Audit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Scope</Label>
                  <Input value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} placeholder="e.g. Q3 Environmental Review" />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={form.departmentId} onValueChange={v => setForm({ ...form, departmentId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Auditor</Label>
                  <Select value={form.auditorId} onValueChange={v => setForm({ ...form, auditorId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select auditor" /></SelectTrigger>
                    <SelectContent>
                      {employees.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name} ({e.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full">Schedule Audit</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scope</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Auditor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Issues</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audits.map((audit) => (
              <TableRow key={audit.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-gov-primary" />
                    {audit.scope}
                  </div>
                </TableCell>
                <TableCell>{audit.department.name}</TableCell>
                <TableCell>{new Date(audit.date).toLocaleDateString()}</TableCell>
                <TableCell>{audit.auditor.name}</TableCell>
                <TableCell>
                  <Badge variant={audit.status === 'COMPLETED' ? 'default' : 'secondary'}>
                    {audit.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{audit._count.issues}</TableCell>
              </TableRow>
            ))}
            {audits.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-text-secondary">No audits scheduled.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
