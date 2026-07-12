import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Building2, Tags, Wrench, Bell, Plus, Pencil, Trash2, Save } from 'lucide-react'

// ─── Types ────────────────────────────────────────────
interface Department { id: string; name: string; code: string; headId: string | null; parentId: string | null; employeeCount: number; status: string; head?: { name: string } | null; parent?: { name: string } | null }
interface Category { id: string; name: string; type: string; status: string }
interface ESGConfig { id: string; envWeight: number; socialWeight: number; govWeight: number; autoEmissionCalcEnabled: boolean; evidenceRequiredEnabled: boolean; badgeAutoAwardEnabled: boolean }
interface Employee { id: string; name: string; email: string }

// ─── Departments Tab ──────────────────────────────────
function DepartmentsTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', code: '', parentId: '' })
  const isAdmin = user?.role === 'ADMIN'

  const fetchData = async () => {
    try {
      const [depts, emps] = await Promise.all([
        api.get<Department[]>('/departments'),
        api.get<Employee[]>('/employees')
      ])
      setDepartments(Array.isArray(depts) ? depts : [])
      setEmployees(Array.isArray(emps) ? emps : [])
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async () => {
    try {
      const payload: any = { name: form.name, code: form.code }
      if (form.parentId) payload.parentId = form.parentId
      if (editId) {
        await api.put(`/departments/${editId}`, payload)
        toast({ title: 'Updated', description: 'Department updated' })
      } else {
        await api.post('/departments', payload)
        toast({ title: 'Created', description: 'Department created' })
      }
      setIsOpen(false); setEditId(null); setForm({ name: '', code: '', parentId: '' }); fetchData()
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  const handleEdit = (d: Department) => { setEditId(d.id); setForm({ name: d.name, code: d.code, parentId: d.parentId || '' }); setIsOpen(true) }
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department?')) return
    try { await api.delete(`/departments/${id}`); toast({ title: 'Deleted' }); fetchData() } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  if (loading) return <div className="py-8 text-center text-text-secondary">Loading departments...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-text-secondary text-sm">Manage organizational departments and hierarchy.</p>
        {isAdmin && (
          <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) { setEditId(null); setForm({ name: '', code: '', parentId: '' }) } }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />{editId ? 'Edit' : 'Add'} Department</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? 'Edit Department' : 'Create Department'}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Operations" /></div>
                <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. OPS" /></div>
                <div className="space-y-2">
                  <Label>Parent Department (optional)</Label>
                  <Select value={form.parentId || 'none'} onValueChange={v => setForm({ ...form, parentId: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Root)</SelectItem>
                      {departments.filter(d => d.id !== editId).map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} className="w-full"><Save className="mr-2 h-4 w-4" />Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Parent</TableHead><TableHead>Employees</TableHead><TableHead>Status</TableHead>{isAdmin && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader>
          <TableBody>
            {departments.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell><Badge variant="outline">{d.code}</Badge></TableCell>
                <TableCell>{d.parent?.name || '—'}</TableCell>
                <TableCell>{d.employeeCount}</TableCell>
                <TableCell><Badge variant={d.status === 'ACTIVE' ? 'default' : 'secondary'}>{d.status}</Badge></TableCell>
                {isAdmin && <TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" onClick={() => handleEdit(d)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>}
              </TableRow>
            ))}
            {departments.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-text-secondary">No departments</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ─── Categories Tab ───────────────────────────────────
function CategoriesTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', type: 'CSR', status: 'ACTIVE' })
  const isAdmin = user?.role === 'ADMIN'

  const fetchCategories = async () => {
    try {
      const url = filter !== 'all' ? `/categories?type=${filter}` : '/categories'
      const data = await api.get<Category[]>(url)
      setCategories(Array.isArray(data) ? data : [])
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchCategories() }, [filter])

  const handleSave = async () => {
    try {
      if (editId) { await api.put(`/categories/${editId}`, form); toast({ title: 'Updated' }) }
      else { await api.post('/categories', form); toast({ title: 'Created' }) }
      setIsOpen(false); setEditId(null); setForm({ name: '', type: 'CSR', status: 'ACTIVE' }); fetchCategories()
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  const handleEdit = (c: Category) => { setEditId(c.id); setForm({ name: c.name, type: c.type, status: c.status }); setIsOpen(true) }
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    try { await api.delete(`/categories/${id}`); toast({ title: 'Deleted' }); fetchCategories() } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="CSR">CSR</SelectItem>
              <SelectItem value="CHALLENGE">Challenge</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) { setEditId(null); setForm({ name: '', type: 'CSR', status: 'ACTIVE' }) } }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Category</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? 'Edit Category' : 'Create Category'}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="CSR">CSR</SelectItem><SelectItem value="CHALLENGE">Challenge</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} className="w-full"><Save className="mr-2 h-4 w-4" />Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead>{isAdmin && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader>
          <TableBody>
            {categories.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell><Badge variant={c.type === 'CSR' ? 'default' : 'secondary'}>{c.type}</Badge></TableCell>
                <TableCell><Badge variant={c.status === 'ACTIVE' ? 'default' : 'secondary'}>{c.status}</Badge></TableCell>
                {isAdmin && <TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>}
              </TableRow>
            ))}
            {categories.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-text-secondary">No categories found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ─── ESG Configuration Tab ────────────────────────────
function ConfigTab() {
  const { toast } = useToast()
  const [config, setConfig] = useState<ESGConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get<{ config: ESGConfig }>('/config')
      .then(data => setConfig(data.config))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    try {
      const payload = {
        envWeight: Number(config.envWeight),
        socialWeight: Number(config.socialWeight),
        govWeight: Number(config.govWeight),
        autoEmissionCalcEnabled: config.autoEmissionCalcEnabled,
        evidenceRequiredEnabled: config.evidenceRequiredEnabled,
        badgeAutoAwardEnabled: config.badgeAutoAwardEnabled,
      }
      const res = await api.put<{ config: ESGConfig }>('/config', payload)
      setConfig(res.config)
      toast({ title: 'Saved', description: 'ESG Configuration updated' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally { setSaving(false) }
  }

  if (loading || !config) return <div className="py-8 text-center text-text-secondary">Loading configuration...</div>

  const weightSum = Number(config.envWeight) + Number(config.socialWeight) + Number(config.govWeight)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">ESG Score Weights</CardTitle><CardDescription>Configure how Environmental, Social, and Governance scores are weighted. Must sum to 1.0.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Environmental Weight</Label>
              <Input type="number" step="0.1" min="0" max="1" value={config.envWeight} onChange={e => setConfig({ ...config, envWeight: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Social Weight</Label>
              <Input type="number" step="0.1" min="0" max="1" value={config.socialWeight} onChange={e => setConfig({ ...config, socialWeight: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Governance Weight</Label>
              <Input type="number" step="0.1" min="0" max="1" value={config.govWeight} onChange={e => setConfig({ ...config, govWeight: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <p className={`text-sm font-medium ${Math.abs(weightSum - 1.0) > 0.001 ? 'text-red-500' : 'text-green-600'}`}>
            Sum: {weightSum.toFixed(2)} {Math.abs(weightSum - 1.0) > 0.001 ? '(must equal 1.0)' : '✓'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Business Rules</CardTitle><CardDescription>Enable or disable platform-wide features.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-bg transition-colors">
            <div><p className="font-medium text-sm">Auto Emission Calculation</p><p className="text-xs text-text-secondary">Automatically calculate CO₂ from purchase/manufacturing/expense/fleet records</p></div>
            <input type="checkbox" checked={config.autoEmissionCalcEnabled} onChange={e => setConfig({ ...config, autoEmissionCalcEnabled: e.target.checked })} className="h-5 w-5 accent-env-primary rounded" />
          </label>
          <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-bg transition-colors">
            <div><p className="font-medium text-sm">Evidence Required for CSR</p><p className="text-xs text-text-secondary">Require proof file before CSR participation can be approved</p></div>
            <input type="checkbox" checked={config.evidenceRequiredEnabled} onChange={e => setConfig({ ...config, evidenceRequiredEnabled: e.target.checked })} className="h-5 w-5 accent-social-primary rounded" />
          </label>
          <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-bg transition-colors">
            <div><p className="font-medium text-sm">Badge Auto-Award</p><p className="text-xs text-text-secondary">Automatically award badges when employees meet unlock criteria</p></div>
            <input type="checkbox" checked={config.badgeAutoAwardEnabled} onChange={e => setConfig({ ...config, badgeAutoAwardEnabled: e.target.checked })} className="h-5 w-5 accent-game-primary rounded" />
          </label>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving || Math.abs(weightSum - 1.0) > 0.001} className="w-full">
        <Save className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Save Configuration'}
      </Button>
    </div>
  )
}

// ─── Notification Settings Tab ────────────────────────
function NotificationTab() {
  const [settings, setSettings] = useState({
    badgeEarned: true, csrApproval: true, challengeApproval: true, policyReminder: true, complianceAlert: true,
  })

  const toggles = [
    { key: 'badgeEarned', label: 'Badge Earned', desc: 'Notify when an employee earns a new badge' },
    { key: 'csrApproval', label: 'CSR Participation Decisions', desc: 'Notify on approval or rejection of CSR participation' },
    { key: 'challengeApproval', label: 'Challenge Decisions', desc: 'Notify on challenge submission approval/rejection' },
    { key: 'policyReminder', label: 'Policy Acknowledgement Reminders', desc: 'Remind employees to acknowledge new policies' },
    { key: 'complianceAlert', label: 'Compliance Issue Alerts', desc: 'Alert when a compliance issue is raised or becomes overdue' },
  ]

  return (
    <div className="space-y-4">
      <p className="text-text-secondary text-sm">Configure which notifications are sent to employees.</p>
      <Card>
        <CardContent className="pt-6 space-y-3">
          {toggles.map(t => (
            <label key={t.key} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-bg transition-colors">
              <div><p className="font-medium text-sm">{t.label}</p><p className="text-xs text-text-secondary">{t.desc}</p></div>
              <input type="checkbox" checked={(settings as any)[t.key]} onChange={e => setSettings({ ...settings, [t.key]: e.target.checked })} className="h-5 w-5 accent-env-primary rounded" />
            </label>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Settings Page ───────────────────────────────
export default function Settings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-text-secondary">Manage platform configuration and administration.</p>
      </div>
      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="departments" className="flex items-center gap-2"><Building2 className="h-4 w-4" />Departments</TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2"><Tags className="h-4 w-4" />Categories</TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2"><Wrench className="h-4 w-4" />ESG Config</TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2"><Bell className="h-4 w-4" />Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="departments"><DepartmentsTab /></TabsContent>
        <TabsContent value="categories"><CategoriesTab /></TabsContent>
        <TabsContent value="config"><ConfigTab /></TabsContent>
        <TabsContent value="notifications"><NotificationTab /></TabsContent>
      </Tabs>
    </div>
  )
}
