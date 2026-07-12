import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface EnvironmentalGoal {
  id: string;
  departmentId: string;
  metricName: string;
  targetValue: number;
  currentValue: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  department?: { name: string };
}

interface Department {
  id: string;
  name: string;
}

export default function Goals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<EnvironmentalGoal[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState(user?.departmentId || '');
  const [metricName, setMetricName] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const fetchData = async () => {
    try {
      const goalsData = await api.get<EnvironmentalGoal[]>('/environmental/goals');
      setGoals(goalsData);
      
      if (user?.role === 'admin') {
        const deptData = await api.get<Department[]>('/departments');
        setDepartments(deptData);
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch goals', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditId(null);
    setDepartmentId(user?.role === 'admin' ? '' : user?.departmentId || '');
    setMetricName('');
    setTargetValue('');
    setPeriodStart('');
    setPeriodEnd('');
  };

  const handleOpenDialog = (goal?: EnvironmentalGoal) => {
    if (goal) {
      setEditId(goal.id);
      setDepartmentId(goal.departmentId);
      setMetricName(goal.metricName);
      setTargetValue(goal.targetValue.toString());
      setPeriodStart(goal.periodStart.slice(0, 10));
      setPeriodEnd(goal.periodEnd.slice(0, 10));
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId) return toast({ title: 'Validation', description: 'Department is required', variant: 'destructive' });
    
    try {
      const payload = {
        departmentId,
        metricName,
        targetValue: parseFloat(targetValue),
        periodStart: new Date(periodStart).toISOString(),
        periodEnd: new Date(periodEnd).toISOString(),
      };

      if (editId) {
        await api.put(`/environmental/goals/${editId}`, payload);
        toast({ title: 'Success', description: 'Goal updated.' });
      } else {
        await api.post('/environmental/goals', payload);
        toast({ title: 'Success', description: 'Goal created.' });
      }
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save goal', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await api.delete(`/environmental/goals/${id}`);
      toast({ title: 'Success', description: 'Goal deleted.' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete goal', variant: 'destructive' });
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const canManage = user?.role === 'admin' || user?.role === 'manager'; // 'manager' is DEPT_HEAD typically in frontend AuthContext

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Environmental Goals</h1>
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>Set New Goal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? 'Edit Goal' : 'New Environmental Goal'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                {user?.role === 'admin' && (
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={departmentId} onValueChange={setDepartmentId}>
                      <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Metric Name (e.g. Reduce Energy CO2 by 10%)</Label>
                  <Input value={metricName} onChange={e => setMetricName(e.target.value)} required />
                </div>
                
                <div className="space-y-2">
                  <Label>Target Value (CO2 limit or goal)</Label>
                  <Input type="number" step="0.1" value={targetValue} onChange={e => setTargetValue(e.target.value)} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} required />
                  </div>
                </div>

                <Button type="submit" className="w-full">Save Goal</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map(goal => {
          const progressPct = Math.min(100, Math.max(0, (Number(goal.currentValue) / Number(goal.targetValue)) * 100));
          return (
            <Card key={goal.id}>
              <CardHeader>
                <CardTitle className="text-lg">{goal.metricName}</CardTitle>
                <CardDescription>
                  {goal.department?.name} • {new Date(goal.periodStart).toLocaleDateString()} - {new Date(goal.periodEnd).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{Number(goal.currentValue).toFixed(2)}</span>
                    <span className="text-muted-foreground">Target: {Number(goal.targetValue).toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${progressPct > 100 ? 'bg-red-500' : 'bg-env-primary'}`} 
                      style={{ width: `${progressPct}%` }} 
                    />
                  </div>
                </div>
                {canManage && (
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(goal)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(goal.id)}>Delete</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {goals.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No environmental goals have been set yet.
          </div>
        )}
      </div>
    </div>
  );
}
