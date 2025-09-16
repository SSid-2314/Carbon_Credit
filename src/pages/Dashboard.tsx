import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, TrendingUp, Store, Users, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  projectCount: number;
  pendingVerifications: number;
  totalCredits: number;
  marketplaceListings: number;
}

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    projectCount: 0,
    pendingVerifications: 0,
    totalCredits: 0,
    marketplaceListings: 0
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;

    try {
      // Fetch user's projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('submitter_id', profile.id)
        .order('submitted_at', { ascending: false })
        .limit(5);

      // Fetch stats based on role
      let statsQuery = {};
      
      if (profile.role === 'verifier') {
        const { data: pendingVerifications } = await supabase
          .from('projects')
          .select('id')
          .eq('status', 'under_review');
        
        statsQuery = { pendingVerifications: pendingVerifications?.length || 0 };
      }

      // Fetch user's carbon credits
      const { data: credits } = await supabase
        .from('carbon_credits')
        .select('credits_amount')
        .eq('owner_id', profile.id);

      const totalCredits = credits?.reduce((sum, credit) => sum + Number(credit.credits_amount), 0) || 0;

      // Fetch marketplace listings
      const { data: listings } = await supabase
        .from('marketplace_listings')
        .select('id')
        .eq('status', 'active');

      setStats({
        projectCount: projects?.length || 0,
        pendingVerifications: (statsQuery as any).pendingVerifications || 0,
        totalCredits,
        marketplaceListings: listings?.length || 0
      });

      setRecentProjects(projects || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      under_review: 'default',
      verified: 'default',
      rejected: 'destructive'
    } as const;

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]} className={colors[status as keyof typeof colors]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getRoleSpecificCards = () => {
    const baseCards = [
      {
        title: 'My Projects',
        value: stats.projectCount,
        description: 'Total submitted projects',
        icon: FileText,
        onClick: () => navigate('/submit-project')
      },
      {
        title: 'Carbon Credits',
        value: stats.totalCredits.toFixed(2),
        description: 'Total credits owned',
        icon: TrendingUp,
        onClick: () => navigate('/carbon-tracker')
      }
    ];

    if (profile?.role === 'verifier') {
      baseCards.push({
        title: 'Pending Reviews',
        value: stats.pendingVerifications,
        description: 'Projects awaiting verification',
        icon: CheckCircle,
        onClick: () => navigate('/verification')
      });
    }

    if (profile?.role === 'admin') {
      baseCards.push({
        title: 'All Users',
        value: '---',
        description: 'Platform users',
        icon: Users,
        onClick: () => {}
      });
    }

    baseCards.push({
      title: 'Marketplace',
      value: stats.marketplaceListings,
      description: 'Active listings',
      icon: Store,
      onClick: () => navigate('/marketplace')
    });

    return baseCards;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/20 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Welcome back, {profile?.full_name}!
        </h1>
        <p className="text-muted-foreground">
          Role: <Badge variant="outline" className="ml-1">{profile?.role?.toUpperCase()}</Badge>
          {profile?.organization && (
            <span className="ml-4">Organization: {profile.organization}</span>
          )}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getRoleSpecificCards().map((card) => {
          const Icon = card.icon;
          return (
            <Card 
              key={card.title} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={card.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Projects
          </CardTitle>
          <CardDescription>
            Your latest project submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No projects submitted yet.</p>
              <Button 
                className="mt-4" 
                onClick={() => navigate('/submit-project')}
              >
                Submit Your First Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{project.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {project.location} • {project.area_hectares} hectares
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(project.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(project.status)}
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.estimated_credits} credits
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;