import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Plus } from 'lucide-react';

interface CsrActivity {
  id: string; title: string; description: string; date: string;
  categoryId: string; departmentId: string;
  category?: { name: string }; department?: { name: string };
}
interface Category { id: string; name: string }
interface Department { id: string; name: string }

export default function CsrActivities() {
  const [activities, setActivities] = useState<CsrActivity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [proofUrl, setProofUrl] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', date: '', categoryId: '', departmentId: '' });

  const { toast } = useToast();
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'DEPT_HEAD';

  useEffect(() => {
    fetchActivities();
    api.get<Category[]>('/categories?type=CSR').then(d => setCategories(Array.isArray(d) ? d : [])).catch(console.error);
    api.get<Department[]>('/departments').then(d => setDepartments(Array.isArray(d) ? d : [])).catch(console.error);
  }, []);

  const fetchActivities = async () => {
    try {
      const data = await api.get<CsrActivity[]>('/social/activities');
      setActivities(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch activities', variant: 'destructive' });
    }
  };

  const handleApply = async () => {
    if (!selectedActivity) return;
    try {
      await api.post(`/social/activities/${selectedActivity}/participate`, { proofUrl: proofUrl || undefined });
      toast({ title: 'Success', description: 'Successfully applied for participation' });
      setIsApplyOpen(false); setProofUrl(''); setSelectedActivity(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to apply', variant: 'destructive' });
    }
  };

  const handleCreateActivity = async () => {
    try {
      await api.post('/social/activities', { ...formData, date: new Date(formData.date).toISOString() });
      toast({ title: 'Success', description: 'Activity created' });
      setIsCreateOpen(false);
      setFormData({ title: '', description: '', date: '', categoryId: '', departmentId: '' });
      fetchActivities();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create activity', variant: 'destructive' });
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    try {
      await api.delete(`/social/activities/${id}`);
      toast({ title: 'Success', description: 'Activity deleted' });
      fetchActivities();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete activity', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">CSR Activities</h1>
        {canManage && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Create Activity</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create CSR Activity</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Activity title" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description" />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.categoryId} onValueChange={v => setFormData({ ...formData, categoryId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={formData.departmentId} onValueChange={v => setFormData({ ...formData, departmentId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateActivity} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => (
          <Card key={activity.id} className="relative">
            {canManage && (
              <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => handleDeleteActivity(activity.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <CardHeader>
              <CardTitle className="pr-8">{activity.title}</CardTitle>
              <CardDescription>
                {new Date(activity.date).toLocaleDateString()} - {activity.category?.name || 'No Category'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
              <p className="text-xs font-semibold">Organized by: {activity.department?.name || 'No Department'}</p>
            </CardContent>
            <CardFooter>
              <Dialog open={isApplyOpen && selectedActivity === activity.id} onOpenChange={(open) => {
                setIsApplyOpen(open);
                if (open) setSelectedActivity(activity.id); else setSelectedActivity(null);
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full">Apply to Participate</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Apply for {activity.title}</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="proofUrl">Proof URL (if required)</Label>
                      <Input id="proofUrl" placeholder="https://..." value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} />
                    </div>
                    <Button onClick={handleApply} className="w-full">Submit Application</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        ))}
        {activities.length === 0 && <p className="text-gray-500">No activities found.</p>}
      </div>
    </div>
  );
}
