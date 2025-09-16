import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Leaf, Award, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CarbonCredit {
  id: string;
  credits_amount: number;
  price_per_credit?: number;
  status: string;
  issued_at: string;
  projects: {
    title: string;
    location: string;
    area_hectares: number;
  };
}

const CarbonTracker = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState<CarbonCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCredits: 0,
    activeCredits: 0,
    soldCredits: 0,
    totalValue: 0
  });

  useEffect(() => {
    if (profile) {
      fetchCarbonCredits();
    }
  }, [profile]);

  const fetchCarbonCredits = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('carbon_credits')
        .select(`
          *,
          projects (
            title,
            location,
            area_hectares
          )
        `)
        .eq('owner_id', profile.id)
        .order('issued_at', { ascending: false });

      if (error) throw error;

      setCredits(data || []);

      // Calculate stats
      const totalCredits = data?.reduce((sum, credit) => sum + Number(credit.credits_amount), 0) || 0;
      const activeCredits = data?.filter(credit => credit.status === 'active')
        .reduce((sum, credit) => sum + Number(credit.credits_amount), 0) || 0;
      const soldCredits = data?.filter(credit => credit.status === 'sold')
        .reduce((sum, credit) => sum + Number(credit.credits_amount), 0) || 0;
      const totalValue = data?.reduce((sum, credit) => {
        const price = Number(credit.price_per_credit) || 0;
        const amount = Number(credit.credits_amount) || 0;
        return sum + (price * amount);
      }, 0) || 0;

      setStats({
        totalCredits,
        activeCredits,
        soldCredits,
        totalValue
      });

    } catch (error) {
      console.error('Error fetching carbon credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      sold: 'bg-blue-100 text-blue-800',
      retired: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Carbon Credit Tracker</h1>
          <p className="text-muted-foreground">
            Monitor your carbon credits and environmental impact
          </p>
        </div>
        <Button onClick={() => navigate('/marketplace')}>
          <ArrowRight className="w-4 h-4 mr-2" />
          Go to Marketplace
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCredits.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              tCO2e sequestered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Credits</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeCredits.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Available for trading
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sold Credits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.soldCredits.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Successfully traded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credits List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Carbon Credits</CardTitle>
          <CardDescription>
            Manage your carbon credit portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {credits.length === 0 ? (
            <div className="text-center py-12">
              <Leaf className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Carbon Credits Yet</h3>
              <p className="text-muted-foreground mb-4">
                Submit and verify projects to earn carbon credits.
              </p>
              <Button onClick={() => navigate('/submit-project')}>
                Submit Your First Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {credits.map((credit) => (
                <div key={credit.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{credit.projects?.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {credit.projects?.location} • {credit.projects?.area_hectares} hectares
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Issued {new Date(credit.issued_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="text-right space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{credit.credits_amount} tCO2e</span>
                      {getStatusBadge(credit.status)}
                    </div>
                    
                    {credit.price_per_credit && (
                      <p className="text-sm text-muted-foreground">
                        ${credit.price_per_credit}/credit
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Environmental Impact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Leaf className="w-5 h-5 mr-2 text-green-600" />
            Environmental Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {stats.totalCredits.toFixed(0)}
              </div>
              <p className="text-sm text-muted-foreground">
                Tons CO2 Sequestered
              </p>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {Math.round(stats.totalCredits * 2.2)}
              </div>
              <p className="text-sm text-muted-foreground">
                Cars Off Road (1 year)
              </p>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {Math.round(stats.totalCredits * 0.85)}
              </div>
              <p className="text-sm text-muted-foreground">
                Homes Powered (1 year)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarbonTracker;