import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, FileText, Leaf, Users, Shield, BarChart3 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Department { id: string; name: string }

// ─── Pre-built Report Cards ─────────────────────────
function PreBuiltReports() {
  const { toast } = useToast()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    api.get<any>('/departments')
      .then(res => setDepartments(Array.isArray(res) ? res : res.departments || []))
      .catch(console.error)
  }, [])

  const exportReport = async (module: string, label: string) => {
    setLoading(module)
    try {
      const payload: any = module !== 'all' ? { module } : {}
      const data = await api.post<any>('/reports/custom', payload)
      downloadCSV(data, `EcoSphere_${label}_${new Date().toISOString().split('T')[0]}`)
      toast({ title: 'Success', description: `${label} report downloaded` })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally { setLoading(null) }
  }

  const reports = [
    { key: 'Environmental', label: 'Environmental Report', desc: 'Carbon transactions, emission data, and sustainability metrics', icon: <Leaf className="h-6 w-6" />, color: 'from-env-light to-white text-env-primary' },
    { key: 'Social', label: 'Social Report', desc: 'CSR activities, employee participation, and diversity data', icon: <Users className="h-6 w-6" />, color: 'from-social-light to-white text-social-primary' },
    { key: 'Governance', label: 'Governance Report', desc: 'Compliance issues, audit results, and policy acknowledgements', icon: <Shield className="h-6 w-6" />, color: 'from-gov-light to-white text-gov-primary' },
    { key: 'all', label: 'ESG Summary Report', desc: 'Combined overview of all ESG modules in a single report', icon: <BarChart3 className="h-6 w-6" />, color: 'from-game-light to-white text-game-primary' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {reports.map(r => (
        <Card key={r.key} className={`bg-gradient-to-br ${r.color} border`}>
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="p-2 rounded-lg bg-white/80 shadow-sm">{r.icon}</div>
            <div className="flex-1">
              <CardTitle className="text-lg">{r.label}</CardTitle>
              <CardDescription className="mt-1 text-xs">{r.desc}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="outline" className="w-full" onClick={() => exportReport(r.key, r.label)} disabled={loading === r.key}>
              <Download className="mr-2 h-4 w-4" />{loading === r.key ? 'Generating...' : 'Download CSV'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Custom Report Builder ──────────────────────────
function CustomReportBuilder() {
  const { toast } = useToast()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [filters, setFilters] = useState({
    departmentId: 'all', startDate: '', endDate: '', module: 'all', format: 'csv'
  })

  useEffect(() => {
    api.get<any>('/departments')
      .then(res => setDepartments(Array.isArray(res) ? res : res.departments || []))
      .catch(console.error)
  }, [])

  const handlePreview = async () => {
    setLoading(true)
    try {
      const payload: any = {}
      if (filters.departmentId !== 'all') payload.departmentId = filters.departmentId
      if (filters.startDate) payload.startDate = filters.startDate
      if (filters.endDate) payload.endDate = filters.endDate
      if (filters.module !== 'all') payload.module = filters.module
      const data = await api.post<any>('/reports/custom', payload)
      setPreviewData(data)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally { setLoading(false) }
  }

  const handleExport = () => {
    if (!previewData) return
    downloadCSV(previewData, `EcoSphere_Custom_${new Date().toISOString().split('T')[0]}`)
    toast({ title: 'Exported', description: 'Report downloaded as CSV' })
  }

  const envRows = previewData?.environmental || []
  const socialRows = previewData?.social || []
  const govRows = previewData?.governance || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Custom Report Builder</CardTitle>
          <CardDescription>Filter and combine data from any module. Preview before exporting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={filters.departmentId} onValueChange={v => setFilters(f => ({ ...f, departmentId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={filters.module} onValueChange={v => setFilters(f => ({ ...f, module: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="Environmental">Environmental</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                  <SelectItem value="Governance">Governance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handlePreview} disabled={loading} className="flex-1">
              {loading ? 'Loading...' : 'Preview Report'}
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={!previewData}>
              <Download className="mr-2 h-4 w-4" />Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Tables */}
      {previewData && (
        <div className="space-y-4">
          {envRows.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Leaf className="h-4 w-4 text-env-primary" />Environmental Data ({envRows.length} records)</CardTitle></CardHeader>
              <CardContent>
                <div className="border rounded-md max-h-64 overflow-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Department</TableHead><TableHead>Source</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Quantity</TableHead><TableHead className="text-right">CO₂ (kg)</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {envRows.map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                          <TableCell>{r.department?.name}</TableCell>
                          <TableCell>{r.sourceRefId}</TableCell>
                          <TableCell><Badge variant="outline">{r.sourceType}</Badge></TableCell>
                          <TableCell className="text-right">{Number(r.quantity).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">{Number(r.co2Calculated).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {socialRows.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-social-primary" />Social Data ({socialRows.length} records)</CardTitle></CardHeader>
              <CardContent>
                <div className="border rounded-md max-h-64 overflow-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Department</TableHead><TableHead>Activity</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {socialRows.map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                          <TableCell>{r.department?.name}</TableCell>
                          <TableCell className="font-medium">{r.title}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {govRows.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-gov-primary" />Governance Data ({govRows.length} records)</CardTitle></CardHeader>
              <CardContent>
                <div className="border rounded-md max-h-64 overflow-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Severity</TableHead><TableHead>Description</TableHead><TableHead>Status</TableHead><TableHead>Due Date</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {govRows.map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell><Badge variant={r.severity === 'CRITICAL' ? 'destructive' : 'outline'}>{r.severity}</Badge></TableCell>
                          <TableCell className="max-w-xs truncate">{r.description}</TableCell>
                          <TableCell>{r.status}</TableCell>
                          <TableCell>{new Date(r.dueDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {envRows.length === 0 && socialRows.length === 0 && govRows.length === 0 && (
            <div className="text-center py-8 text-text-secondary border-2 border-dashed rounded-lg">No data found for the selected filters.</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── CSV Download Helper ────────────────────────────
function downloadCSV(data: any, filename: string) {
  let csv = ''

  if (data.environmental?.length > 0) {
    csv += '--- Environmental ---\n'
    csv += 'Date,Department,Source Type,Source Ref,Quantity,CO2 (kg)\n'
    data.environmental.forEach((r: any) => {
      csv += `${new Date(r.date).toLocaleDateString()},"${r.department?.name || ''}","${r.sourceType}","${r.sourceRefId}",${r.quantity},${r.co2Calculated}\n`
    })
    csv += '\n'
  }

  if (data.social?.length > 0) {
    csv += '--- Social ---\n'
    csv += 'Date,Department,Activity,Description\n'
    data.social.forEach((r: any) => {
      csv += `${new Date(r.date).toLocaleDateString()},"${r.department?.name || ''}","${r.title}","${(r.description || '').replace(/"/g, '""')}"\n`
    })
    csv += '\n'
  }

  if (data.governance?.length > 0) {
    csv += '--- Governance ---\n'
    csv += 'Severity,Description,Status,Due Date\n'
    data.governance.forEach((r: any) => {
      csv += `${r.severity},"${(r.description || '').replace(/"/g, '""')}",${r.status},${new Date(r.dueDate).toLocaleDateString()}\n`
    })
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ─── Main Reports Page ──────────────────────────────
export default function Reports() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-text-secondary">Generate, preview, and export ESG data reports.</p>
      </div>

      <Tabs defaultValue="prebuilt">
        <TabsList>
          <TabsTrigger value="prebuilt">Pre-built Reports</TabsTrigger>
          <TabsTrigger value="custom">Custom Report Builder</TabsTrigger>
        </TabsList>
        <TabsContent value="prebuilt" className="mt-4"><PreBuiltReports /></TabsContent>
        <TabsContent value="custom" className="mt-4"><CustomReportBuilder /></TabsContent>
      </Tabs>
    </div>
  )
}
