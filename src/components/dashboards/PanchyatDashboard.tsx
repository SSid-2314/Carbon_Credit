import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Upload, TrendingUp, Award, Plus, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PanchayatDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalCredits: 0,
    verifiedProjects: 0
  });
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchPanchayatData();
    }
  }, [profile]);

  const fetchPanchayatData = async () => {
    if (!profile) return;

    try {
      // Fetch Panchayat's projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('submitter_id', profile.id)
        .order('submitted_at', { ascending: false });

      // Fetch Panchayat's carbon credits
      const { data: creditsData } = await supabase
        .from('carbon_credits')
        .select('credits_amount')
        .eq('owner_id', profile.id);

      const totalCredits = creditsData?.reduce((sum, credit) => sum + Number(credit.credits_amount), 0) || 0;
      const verifiedProjects = projectsData?.filter(p => p.status === 'verified').length || 0;

      setProjects(projectsData || []);
      setStats({
        totalProjects: projectsData?.length || 0,
        totalCredits,
        verifiedProjects
      });
    } catch (error) {
      console.error('Error fetching Panchayat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setLoadingGPS(true);
    
    if (!navigator.geolocation) {
      toast({
        title: 'Error',
        description: 'Geolocation is not supported by this browser.',
        variant: 'destructive'
      });
      setLoadingGPS(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsLocation({ lat: latitude, lng: longitude });
        toast({
          title: 'Location Captured',
          description: `GPS coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        });
        setLoadingGPS(false);
      },
      (error) => {
        toast({
          title: 'GPS Error',
          description: 'Unable to retrieve your location. Please check your GPS settings.',
          variant: 'destructive'
        });
        setLoadingGPS(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const submitPlantationData = () => {
    if (!gpsLocation) {
      toast({
        title: 'GPS Required',
        description: 'Please capture GPS coordinates first.',
        variant: 'destructive'
      });
      return;
    }
    
    // Navigate to project submission with GPS data
    navigate('/submit-project', { 
      state: { 
        gpsCoordinates: gpsLocation,
        role: 'panchayat'
      }
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
        <h2 className="text-2xl font-bold text-primary">Panchayat Dashboard</h2>
        <p className="text-muted-foreground">Submit plantation data with GPS coordinates</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Plantation sites</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Projects</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verifiedProjects}</div>
            <p className="text-xs text-muted-foreground">Successfully verified</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/carbon-tracker')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carbon Credits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCredits.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Click to view tracker</p>
          </CardContent>
        </Card>
      </div>

      {/* GPS Capture Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Navigation className="w-5 h-5 mr-2" />
            GPS Location Capture
          </CardTitle>
          <CardDescription>
            Capture accurate GPS coordinates for your plantation site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={getCurrentLocation} 
                disabled={loadingGPS}
                variant="outline"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {loadingGPS ? 'Getting Location...' : 'Capture GPS'}
              </Button>
              
              {gpsLocation && (
                <div className="text-sm text-muted-foreground">
                  Coordinates: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
                </div>
              )}
            </div>
            
            {gpsLocation && (
              <Button onClick={submitPlantationData} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Submit Plantation Data with GPS
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/mobile-upload')}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Upload Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Upload photos and documents for your plantation projects.
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/carbon-tracker')}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Track Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Monitor your earned carbon credits and environmental impact.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Your Plantation Projects</CardTitle>
          <CardDescription>
            Track the status of your submitted plantation data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Plantation Data Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by capturing GPS coordinates and submitting your first plantation project.
              </p>
              <Button onClick={getCurrentLocation}>
                <Navigation className="w-4 h-4 mr-2" />
                Capture GPS Location
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{project.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {project.location} • {project.area_hectares} hectares
                    </p>
                    {project.gps_coordinates && (
                      <p className="text-xs text-muted-foreground">
                        GPS: {project.gps_coordinates.lat?.toFixed(6)}, {project.gps_coordinates.lng?.toFixed(6)}
                      </p>
                    )}
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

export default PanchayatDashboard;
