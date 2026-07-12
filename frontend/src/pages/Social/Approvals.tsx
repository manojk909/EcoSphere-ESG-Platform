import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

interface Activity {
  id: string;
  title: string;
}

interface Participation {
  id: string;
  employee: { name: string; email: string };
  proofUrl: string | null;
  approvalStatus: string;
  createdAt: string;
}

export default function Approvals() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [pointsMap, setPointsMap] = useState<Record<string, number>>({});
  
  const { toast } = useToast();

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    if (selectedActivityId) {
      fetchParticipations(selectedActivityId);
    } else {
      setParticipations([]);
    }
  }, [selectedActivityId]);

  const fetchActivities = async () => {
    try {
      const data = await api.get<Activity[]>('/social/activities');
      setActivities(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch activities', variant: 'destructive' });
    }
  };

  const fetchParticipations = async (activityId: string) => {
    try {
      const data = await api.get<Participation[]>(`/social/activities/${activityId}/participations`);
      setParticipations(data.filter(p => p.approvalStatus === 'PENDING'));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch participations', variant: 'destructive' });
    }
  };

  const handleProcess = async (participationId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const pointsEarned = pointsMap[participationId] || 10;
      await api.put(`/social/participations/${participationId}/approve`, { status, pointsEarned });
      toast({ title: 'Success', description: `Participation ${status.toLowerCase()} successfully` });
      // Refresh list
      fetchParticipations(selectedActivityId);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to process participation', variant: 'destructive' });
    }
  };

  const handlePointsChange = (participationId: string, value: string) => {
    setPointsMap(prev => ({
      ...prev,
      [participationId]: parseInt(value) || 0
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Participation Approvals</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Select Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedActivityId} onValueChange={setSelectedActivityId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select an activity" />
            </SelectTrigger>
            <SelectContent>
              {activities.map(act => (
                <SelectItem key={act.id} value={act.id}>
                  {act.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedActivityId && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Participations</CardTitle>
          </CardHeader>
          <CardContent>
            {participations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Proof URL</TableHead>
                    <TableHead>Date Applied</TableHead>
                    <TableHead>Points to Award</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participations.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell>
                        <div className="font-medium">{part.employee.name}</div>
                        <div className="text-sm text-gray-500">{part.employee.email}</div>
                      </TableCell>
                      <TableCell>
                        {part.proofUrl ? (
                          <a href={part.proofUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                            View Proof
                          </a>
                        ) : (
                          <span className="text-gray-400">No Proof</span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(part.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min={0}
                          className="w-24"
                          value={pointsMap[part.id] !== undefined ? pointsMap[part.id] : 10}
                          onChange={(e) => handlePointsChange(part.id, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleProcess(part.id, 'APPROVED')}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleProcess(part.id, 'REJECTED')}>Reject</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-500">No pending participations for this activity.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
