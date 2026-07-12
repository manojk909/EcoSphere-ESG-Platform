import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '@/components/ui/use-toast';

interface DiversityData {
  department: string;
  total: number;
  EMPLOYEE?: number;
  DEPT_HEAD?: number;
  ADMIN?: number;
}

export default function Diversity() {
  const [data, setData] = useState<DiversityData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchDiversityData();
  }, []);

  const fetchDiversityData = async () => {
    try {
      const res = await api.get<DiversityData[]>('/social/diversity');
      setData(res);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch diversity metrics', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Diversity Metrics</h1>
      <p className="text-gray-500">Headcount distribution by department and role.</p>

      <Card>
        <CardHeader>
          <CardTitle>Department Headcount by Role</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="EMPLOYEE" stackId="a" fill="#8884d8" name="Employees" />
                  <Bar dataKey="DEPT_HEAD" stackId="a" fill="#82ca9d" name="Dept Heads" />
                  <Bar dataKey="ADMIN" stackId="a" fill="#ffc658" name="Admins" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10">No diversity data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
