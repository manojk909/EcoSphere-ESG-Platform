import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download } from 'lucide-react'

export default function Reports() {
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    departmentId: 'all',
    startDate: '',
    endDate: '',
    module: 'all'
  })

  useEffect(() => {
    api.get<any[]>('/departments')
      .then(data => setDepartments(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [])

  const handleExport = async () => {
    setLoading(true)
    try {
      const payload: any = {}
      if (filters.departmentId !== 'all') payload.departmentId = filters.departmentId
      if (filters.startDate) payload.startDate = filters.startDate
      if (filters.endDate) payload.endDate = filters.endDate
      if (filters.module !== 'all') payload.module = filters.module

      const data = await api.post('/reports/custom', payload)
      
      // Convert JSON to CSV (Basic implementation)
      let csvContent = 'data:text/csv;charset=utf-8,\n'
      
      if (data.environmental) {
        csvContent += '--- Environmental ---\n'
        csvContent += 'Date,Department,Source,Quantity,CO2\n'
        data.environmental.forEach((row: any) => {
          csvContent += `${new Date(row.date).toLocaleDateString()},"${row.department.name}","${row.emissionFactor.activityType}",${row.quantity},${row.co2Calculated}\n`
        })
      }
      
      if (data.social) {
        csvContent += '\n--- Social ---\n'
        csvContent += 'Date,Department,Activity\n'
        data.social.forEach((row: any) => {
          csvContent += `${new Date(row.date).toLocaleDateString()},"${row.department.name}","${row.title}"\n`
        })
      }

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `EcoSphere_Report_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Custom Report Builder</h2>
        <p className="text-text-secondary">Generate and export ESG data across all modules.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select filters to narrow down the report data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={filters.departmentId} onValueChange={(v) => setFilters(f => ({ ...f, departmentId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={filters.module} onValueChange={(v) => setFilters(f => ({ ...f, module: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
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
              <Input type="date" value={filters.startDate} onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={filters.endDate} onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={handleExport} disabled={loading} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Generating...' : 'Export to CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
