import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Coins } from 'lucide-react';

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  stock: number;
  status: string;
}

export default function Rewards() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsBalance, setPointsBalance] = useState(user?.pointsBalance || 0);
  const { toast } = useToast();

  useEffect(() => {
    fetchRewards();
    // In a real app we might fetch user's current points from an API,
    // here we initialize with context and update locally on redemption.
  }, []);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const data = await api.get<Reward[]>('/gamification/rewards');
      setRewards(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    try {
      await api.post(`/gamification/rewards/${reward.id}/redeem`, {});
      toast({ title: 'Success', description: `You redeemed: ${reward.name}` });
      setPointsBalance(prev => prev - reward.pointsRequired);
      fetchRewards(); // refresh stock
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="p-8">Loading rewards...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Rewards Catalog</h1>
          <p className="text-text-secondary mt-2">Spend your hard-earned points on great rewards!</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-border flex items-center gap-3">
          <div className="p-2 bg-game-light text-game-primary rounded-lg">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium">Your Balance</p>
            <p className="text-2xl font-bold text-game-primary">{pointsBalance} pts</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {rewards.map((reward) => {
          const isActive = reward.status === 'ACTIVE';
          const inStock = reward.stock > 0;
          const canAfford = pointsBalance >= reward.pointsRequired;
          const disabled = !isActive || !inStock || !canAfford;

          return (
            <Card key={reward.id} className="flex flex-col border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-game-light text-game-primary rounded-full flex items-center justify-center mb-4">
                  <Gift className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg line-clamp-1">{reward.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1">{reward.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-text-secondary">Cost:</span>
                  <span className="font-bold text-game-primary">{reward.pointsRequired} pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Stock:</span>
                  <Badge variant={inStock ? 'outline' : 'destructive'} className={inStock ? 'text-text-secondary' : ''}>
                    {inStock ? `${reward.stock} available` : 'Out of Stock'}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full ${!disabled ? 'bg-game-primary hover:bg-game-primary/90 text-white' : ''}`}
                  variant={disabled ? 'secondary' : 'default'}
                  onClick={() => handleRedeem(reward)}
                  disabled={disabled}
                >
                  {!inStock ? 'Out of Stock' : !canAfford ? 'Need more points' : 'Redeem'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        {rewards.length === 0 && (
          <div className="col-span-full py-12 text-center text-text-secondary border-2 border-dashed border-border rounded-xl">
            No rewards available in the catalog yet.
          </div>
        )}
      </div>
    </div>
  );
}
