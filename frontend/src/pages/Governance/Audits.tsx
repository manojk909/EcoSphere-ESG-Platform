import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function Audits() {
  const [audits, setAudits] = useState<any[]>([]);
  const [form, setForm] = useState({ scope: '', department: '', date: '', auditor: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      const res = await fetch('/api/governance/audits');
      if (!res.ok) throw new Error('Failed to fetch audits');
      const data = await res.json();
      setAudits(data);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/governance/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          date: new Date(form.date).toISOString()
        })
      });
      if (!res.ok) throw new Error('Failed to create audit');
      setForm({ scope: '', department: '', date: '', auditor: '' });
      fetchAudits();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audits</h1>
        <p className="text-muted-foreground">Manage and schedule compliance audits.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule New Audit</CardTitle>
          <CardDescription>Enter details for the upcoming audit.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                placeholder="Audit Scope" 
                value={form.scope}
                onChange={e => setForm({...form, scope: e.target.value})}
                required
              />
              <Input 
                placeholder="Department" 
                value={form.department}
                onChange={e => setForm({...form, department: e.target.value})}
                required
              />
              <Input 
                type="datetime-local" 
                value={form.date}
                onChange={e => setForm({...form, date: e.target.value})}
                required
              />
              <Input 
                placeholder="Auditor Name" 
                value={form.auditor}
                onChange={e => setForm({...form, auditor: e.target.value})}
                required
              />
            </div>
            <Button type="submit">Schedule Audit</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <h2 className="text-2xl font-semibold mt-4">Scheduled Audits</h2>
        {error && <div className="text-red-500">{error}</div>}
        {audits.map((audit: any) => (
          <Card key={audit.id}>
            <CardHeader>
              <CardTitle>{audit.scope}</CardTitle>
              <CardDescription>{audit.department}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div><strong>Date:</strong> {new Date(audit.date).toLocaleString()}</div>
              <div><strong>Auditor:</strong> {audit.auditor}</div>
            </CardContent>
          </Card>
        ))}
        {audits.length === 0 && !error && (
          <div className="text-center py-10 text-muted-foreground">No audits scheduled.</div>
        )}
      </div>
    </div>
  );
}
