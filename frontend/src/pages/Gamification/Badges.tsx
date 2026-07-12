import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Award } from 'lucide-react';

interface EmployeeBadge {
  id: string;
  awardedAt: string;
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockRuleType: string;
    unlockRuleValue: number;
  };
}

export default function Badges() {
  const [badges, setBadges] = useState<EmployeeBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const data = await api.get<EmployeeBadge[]>('/gamification/badges');
      setBadges(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading your badges...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">My Badges</h1>
        <p className="text-text-secondary mt-2">Displaying all the achievements you've unlocked on EcoSphere.</p>
      </div>

      {badges.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-border rounded-xl bg-white">
          <Award className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-text-primary mb-2">No Badges Yet</h3>
          <p className="text-text-secondary">Keep participating in CSR activities and challenges to unlock badges!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {badges.map((eb) => (
            <Card key={eb.id} className="text-center hover:shadow-md transition-shadow border-game-light">
              <CardContent className="pt-6 pb-6 flex flex-col items-center">
                <div className="w-20 h-20 bg-game-light text-game-primary rounded-full flex items-center justify-center text-4xl mb-4 shadow-sm">
                  {eb.badge.icon || '🏅'}
                </div>
                <h3 className="font-semibold text-text-primary text-lg mb-1">{eb.badge.name}</h3>
                <p className="text-xs text-text-secondary mb-3 px-2 line-clamp-2 min-h-[32px]">
                  {eb.badge.description}
                </p>
                <div className="text-[10px] uppercase font-bold tracking-wider text-game-primary bg-game-light px-2 py-1 rounded">
                  Earned {new Date(eb.awardedAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
