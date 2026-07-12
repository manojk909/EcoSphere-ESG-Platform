import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function Policies() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false); // Simulated admin toggle
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await fetch('/api/governance/policies');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPolicies(data);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleAcknowledge = async (id: number) => {
    try {
      const res = await fetch(`/api/governance/policies/${id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: 'emp-1' })
      });
      if (!res.ok) throw new Error('Failed to acknowledge');
      alert('Policy successfully acknowledged!');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleEdit = (policy: any) => {
    setEditingId(policy.id);
    setEditForm({ title: policy.title, content: policy.content });
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/governance/policies/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Failed to update');
      setEditingId(null);
      fetchPolicies();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ESG Policies</h1>
          <p className="text-muted-foreground">View and acknowledge company ESG policies.</p>
        </div>
        <Button variant="outline" onClick={() => setIsAdmin(!isAdmin)}>
          {isAdmin ? 'Switch to Employee View' : 'Switch to Admin View'}
        </Button>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="grid gap-6">
        {policies.map((policy: any) => (
          <Card key={policy.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{policy.title}</CardTitle>
                  <CardDescription>Version: {policy.version}</CardDescription>
                </div>
                {isAdmin ? (
                  <Button onClick={() => handleEdit(policy)} variant="secondary">Edit Policy</Button>
                ) : (
                  <Button onClick={() => handleAcknowledge(policy.id)}>Acknowledge</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingId === policy.id ? (
                <div className="space-y-4">
                  <Input 
                    value={editForm.title} 
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    placeholder="Policy Title"
                  />
                  <Textarea 
                    value={editForm.content}
                    onChange={e => setEditForm({...editForm, content: e.target.value})}
                    placeholder="Policy Content"
                    rows={5}
                  />
                  <div className="space-x-2">
                    <Button onClick={handleUpdate}>Save Changes</Button>
                    <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm text-gray-700">{policy.content}</div>
              )}
            </CardContent>
          </Card>
        ))}
        {policies.length === 0 && !error && (
          <div className="text-center py-10 text-muted-foreground">No policies found.</div>
        )}
      </div>
    </div>
  );
}
