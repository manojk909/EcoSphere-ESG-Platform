import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface CarbonTransaction {
  id: string;
  sourceType: string;
  sourceRefId: string;
  emissionFactorId: string;
  quantity: number;
  co2Calculated: number;
  date: string;
  department?: { name: string };
  emissionFactor?: { activityType: string; unit: string };
}

interface EmissionFactor {
  id: string;
  activityType: string;
  unit: string;
}

export function CarbonTracking() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<CarbonTransaction[]>([]);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<{ autoEmissionCalcEnabled: boolean }>({ autoEmissionCalcEnabled: false });

  // Form State
  const [sourceType, setSourceType] = useState('EXPENSE');
  const [sourceRefId, setSourceRefId] = useState('');
  const [emissionFactorId, setEmissionFactorId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [co2Calculated, setCo2Calculated] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchData = async () => {
    try {
      const [txData, factorData, configData] = await Promise.all([
        api.get<CarbonTransaction[]>('/environmental/carbon-transactions'),
        api.get<EmissionFactor[]>('/environmental/emission-factors'),
        api.get<{ autoEmissionCalcEnabled: boolean }>('/environmental/config')
      ]);
      setTransactions(txData);
      setFactors(factorData);
      setConfig(configData);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emissionFactorId) {
      return toast({ title: 'Validation', description: 'Please select an emission factor', variant: 'destructive' });
    }
    
    try {
      await api.post('/environmental/carbon-transactions', {
        sourceType,
        sourceRefId,
        emissionFactorId,
        quantity: parseFloat(quantity),
        co2Calculated: !config.autoEmissionCalcEnabled ? parseFloat(co2Calculated) : undefined,
        date: new Date(date).toISOString(),
      });
      
      toast({ title: 'Success', description: 'Carbon transaction logged.' });
      setSourceRefId('');
      setQuantity('');
      setCo2Calculated('');
      setEmissionFactorId('');
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to log transaction', variant: 'destructive' });
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Carbon Tracking</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Log Carbon Emitting Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Source Type</Label>
                <Select value={sourceType} onValueChange={setSourceType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    <SelectItem value="FLEET">Fleet</SelectItem>
                    <SelectItem value="MANUFACTURING">Manufacturing</SelectItem>
                    <SelectItem value="PURCHASE">Purchase</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reference ID (e.g. Receipt #)</Label>
                <Input value={sourceRefId} onChange={e => setSourceRefId(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>Emission Factor</Label>
                <Select value={emissionFactorId} onValueChange={setEmissionFactorId}>
                  <SelectTrigger><SelectValue placeholder="Select a factor" /></SelectTrigger>
                  <SelectContent>
                    {factors.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.activityType} ({f.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} required />
              </div>

              {!config.autoEmissionCalcEnabled && (
                <div className="space-y-2">
                  <Label>CO2 Calculated (kg)</Label>
                  <Input type="number" step="0.01" value={co2Calculated} onChange={e => setCo2Calculated(e.target.value)} required />
                </div>
              )}

              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>

              <Button type="submit" className="w-full">Log Transaction</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">CO2 (kg)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                    <TableCell>{t.department?.name || 'N/A'}</TableCell>
                    <TableCell>{t.sourceType}</TableCell>
                    <TableCell>{t.emissionFactor?.activityType || 'N/A'}</TableCell>
                    <TableCell>{Number(t.quantity).toFixed(2)} {t.emissionFactor?.unit}</TableCell>
                    <TableCell className="text-right font-medium">{Number(t.co2Calculated).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No transactions logged yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
