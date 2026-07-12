import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal } from 'lucide-react';

interface Department {
  id: string;
  name: string;
}

interface UserLeaderboard {
  id: string;
  name: string;
  xp: number;
  pointsBalance: number;
  department: { id: string; name: string };
  badges: { badge: { id: string; name: string; icon: string } }[];
}

export default function Leaderboard() {
  const [users, setUsers] = useState<UserLeaderboard[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedDept]);

  const fetchDepartments = async () => {
    try {
      const data = await api.get<Department[]>('/departments');
      setDepartments(data);
    } catch (error) {
      console.error('Failed to fetch departments', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const url = selectedDept !== 'all' ? `/gamification/leaderboard?departmentId=${selectedDept}` : '/gamification/leaderboard';
      const data = await api.get<UserLeaderboard[]>(url);
      setUsers(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="font-medium text-gray-500 w-5 text-center inline-block">{index + 1}</span>;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Leaderboard</h1>
          <p className="text-text-secondary mt-2">See how you rank against your colleagues!</p>
        </div>
        
        <div className="w-full sm:w-64">
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-text-secondary">Loading leaderboard...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">Rank</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Badges</TableHead>
                  <TableHead className="text-right">Total XP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-text-secondary">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-center">
                        <div className="flex justify-center">{getRankIcon(index)}</div>
                      </TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.department?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.badges.slice(0, 3).map((b, i) => (
                            <Badge key={i} variant="outline" className="bg-game-light/20 text-xs">
                              {b.badge.icon} {b.badge.name}
                            </Badge>
                          ))}
                          {user.badges.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{user.badges.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-game-primary">{user.xp} XP</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
