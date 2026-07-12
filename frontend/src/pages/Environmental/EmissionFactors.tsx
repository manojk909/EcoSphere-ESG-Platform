import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface EmissionFactor {
  id: string;
  activityType: string;
  unit: string;
  co2PerUnit: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export function EmissionFactors() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activityType, setActivityType] = useState('');
  const [unit, setUnit] = useState('');
  const [co2PerUnit, setCo2PerUnit] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const fetchFactors = async () => {
    try {
      const data = await api.get<EmissionFactor[]>('/environmental/emission-factors');
      setFactors(data);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch emission factors', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactors();
  }, []);

  const resetForm = () => {
    setEditId(null);
    setActivityType('');
    setUnit('');
    setCo2PerUnit('');
    setStatus('ACTIVE');
  };

  const handleOpenDialog = (factor?: EmissionFactor) => {
    if (factor) {
      setEditId(factor.id);
      setActivityType(factor.activityType);
      setUnit(factor.unit);
      setCo2PerUnit(factor.co2PerUnit.toString());
      setStatus(factor.status);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        activityType,
        unit,
        co2PerUnit: parseFloat(co2PerUnit),
        status,
      };

      if (editId) {
        await api.put(`/environmental/emission-factors/${editId}`, payload);
        toast({ title: 'Success', description: 'Emission factor updated.' });
      } else {
        await api.post('/environmental/emission-factors', payload);
        toast({ title: 'Success', description: 'Emission factor created.' });
      }
      setIsDialogOpen(false);
      resetForm();
      fetchFactors();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save emission factor', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this emission factor?')) return;
    try {
      await api.delete(`/environmental/emission-factors/${id}`);
      toast({ title: 'Success', description: 'Emission factor deleted.' });
      fetchFactors();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete emission factor', variant: 'destructive' });
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Emission Factors</h1>
        {user?.role === 'admin' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>Add New Factor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? 'Edit Emission Factor' : 'Add Emission Factor'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>Activity Type</Label>
                  <Input value={activityType} onChange={e => setActivityType(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input value={unit} onChange={e => setUnit(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>CO2 per Unit (kg)</Label>
                  <Input type="number" step="0.0001" value={co2PerUnit} onChange={e => setCo2PerUnit(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(val: 'ACTIVE' | 'INACTIVE') => setStatus(val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity Type</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>CO2 per Unit (kg)</TableHead>
              <TableHead>Status</TableHead>
              {user?.role === 'admin' && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {factors.map(f => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.activityType}</TableCell>
                <TableCell>{f.unit}</TableCell>
                <TableCell>{f.co2PerUnit}</TableCell>
                <TableCell>{f.status}</TableCell>
                {user?.role === 'admin' && (
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(f)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(f.id)}>Delete</Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {factors.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No emission factors found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
