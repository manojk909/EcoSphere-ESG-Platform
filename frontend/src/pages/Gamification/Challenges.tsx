import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Participation {
  id: string;
  approvalStatus: string;
  progress: number;
  proofUrl: string | null;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  xp: number;
  difficulty: string;
  evidenceRequired: boolean;
  deadline: string;
  status: string;
  participations?: Participation[];
}

export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState('');

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const data = await api.get<Challenge[]>('/gamification/challenges');
      setChallenges(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleParticipate = async (challengeId: string) => {
    try {
      await api.post(`/gamification/challenges/${challengeId}/participate`, {});
      toast({ title: 'Success', description: 'You have joined the challenge!' });
      fetchChallenges();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleSubmitProof = async () => {
    if (!selectedChallengeId) return;
    try {
      await api.post(`/gamification/challenges/${selectedChallengeId}/submit`, { proofUrl });
      toast({ title: 'Success', description: 'Proof submitted for review!' });
      setSubmitDialogOpen(false);
      setProofUrl('');
      fetchChallenges();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="p-8">Loading challenges...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Challenges</h1>
        <p className="text-text-secondary mt-2">Complete challenges to earn XP and unlock badges!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => {
          const participation = challenge.participations?.[0];
          const isActive = challenge.status === 'ACTIVE';

          return (
            <Card key={challenge.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{challenge.title}</CardTitle>
                  <Badge variant={isActive ? 'default' : 'secondary'}>{challenge.status}</Badge>
                </div>
                <CardDescription className="line-clamp-2 mt-2">{challenge.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm text-text-secondary">
                  <div className="flex justify-between">
                    <span>Reward:</span>
                    <span className="font-medium text-game-primary">{challenge.xp} XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Difficulty:</span>
                    <span className="font-medium">{challenge.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deadline:</span>
                    <span className="font-medium">{new Date(challenge.deadline).toLocaleDateString()}</span>
                  </div>
                  {participation && (
                    <div className="mt-4 p-3 bg-game-light/30 rounded-md border border-game-light">
                      <div className="flex justify-between font-medium">
                        <span>Your Status:</span>
                        <span>{participation.approvalStatus}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                {!participation ? (
                  <Button 
                    className="w-full bg-game-primary hover:bg-game-primary/90 text-white" 
                    onClick={() => handleParticipate(challenge.id)}
                    disabled={!isActive}
                  >
                    Join Challenge
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => {
                      setSelectedChallengeId(challenge.id);
                      setSubmitDialogOpen(true);
                    }}
                    disabled={participation.approvalStatus !== 'PENDING'}
                  >
                    {participation.approvalStatus === 'APPROVED' ? 'Completed' : 'Submit Proof'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Challenge Proof</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Proof URL (Optional)</Label>
              <Input 
                placeholder="https://..." 
                value={proofUrl} 
                onChange={(e) => setProofUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitProof} className="bg-game-primary hover:bg-game-primary/90 text-white">
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
