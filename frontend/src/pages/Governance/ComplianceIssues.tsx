import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ComplianceIssues() {
  const [issues, setIssues] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/governance/issues');
      if (!res.ok) throw new Error('Failed to fetch issues');
      const data = await res.json();
      setIssues(data);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-600 hover:bg-red-700 text-white';
      case 'HIGH': return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'MEDIUM': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      case 'LOW': return 'bg-blue-500 hover:bg-blue-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance Issues</h1>
        <p className="text-muted-foreground">Track and manage identified compliance issues.</p>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="grid gap-4">
        {issues.map((issue: any) => (
          <Card key={issue.id} className={issue.isOverdue ? 'border-red-500 shadow-sm shadow-red-200' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{issue.description}</CardTitle>
                  <CardDescription className="mt-1">Owner: {issue.owner}</CardDescription>
                </div>
                <div className="flex gap-2 items-center">
                  {issue.isOverdue && (
                    <Badge variant="destructive" className="animate-pulse">OVERDUE</Badge>
                  )}
                  <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-muted-foreground">Due Date: </span>
                <span className={issue.isOverdue ? 'text-red-600 font-bold' : ''}>
                  {new Date(issue.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">Status: </span>
                {issue.status || 'OPEN'}
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">Audit ID: </span>
                {issue.auditId}
              </div>
            </CardContent>
          </Card>
        ))}
        {issues.length === 0 && !error && (
          <div className="text-center py-10 text-muted-foreground">No compliance issues found.</div>
        )}
      </div>
    </div>
  );
}
