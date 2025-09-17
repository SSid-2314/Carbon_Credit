import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Award, TrendingUp } from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  role: string;
  organization?: string;
  user_id: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalCredits: 0,
    pendingVerifications: 0
  });
  const [newCreditForm, setNewCreditForm] = useState({
    userId: '',
    projectId: '',
    amount: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch all projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, status');

      // Fetch all credits
      const { data: credits } = await supabase
        .from('carbon_credits')
        .select('credits_amount');

      const totalCredits = credits?.reduce((sum, credit) => sum + Number(credit.credits_amount), 0) || 0;
      const pendingVerifications = projects?.filter(p => p.status === 'under_review').length || 0;

      setUsers(profiles || []);
      setStats({
        totalUsers: profiles?.length || 0,
        totalProjects: projects?.length || 0,
        totalCredits,
        pendingVerifications
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('carbon_credits')
        .insert({
          owner_id: newCreditForm.userId,
          project_id: newCreditForm.projectId,
          credits_amount: Number(newCreditForm.amount),
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Carbon credits issued successfully'
      });

      setNewCreditForm({ userId: '', projectId: '', amount: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      verifier: 'bg-blue-100 text-blue-800',
      ngo: 'bg-green-100 text-green-800',
      panchayat: 'bg-purple-100 text-purple-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Admin Dashboard</h2>
        <p className="text-muted-foreground">Manage users, projects, and carbon credits</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Platform users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">All submitted projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carbon Credits</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCredits.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total credits issued</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Issue Credits Form */}
      <Card>
        <CardHeader>
          <CardTitle>Issue Carbon Credits</CardTitle>
          <CardDescription>
            Manually issue carbon credits to users for verified projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleIssueCredits} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User</Label>
              <Select value={newCreditForm.userId} onValueChange={(value) => setNewCreditForm(prev => ({ ...prev, userId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="projectId">Project ID</Label>
              <Input
                id="projectId"
                value={newCreditForm.projectId}
                onChange={(e) => setNewCreditForm(prev => ({ ...prev, projectId: e.target.value }))}
                placeholder="Project UUID"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Credit Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={newCreditForm.amount}
                onChange={(e) => setNewCreditForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Issue Credits
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all platform users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">{user.full_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {user.organization && `${user.organization} • `}
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                  {user.role.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
