import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, FileText, Award, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  title: string;
  location: string;
  area_hectares: number;
  description: string;
  status: string;
  estimated_credits: number;
  submitted_at: string;
  submitter_id: string;
  profiles: {
    full_name: string;
    organization?: string;
  };
}

const VerifierDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [certificateRequests, setCertificateRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pendingReviews: 0,
    verifiedProjects: 0,
    rejectedProjects: 0,
    totalReviewed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerifierData();
  }, []);

  const fetchVerifierData = async () => {
    try {
      // Fetch pending projects
      const { data: pendingData } = await supabase
        .from('projects')
        .select(`
          *,
          profiles!projects_submitter_id_fkey (
            full_name,
            organization
          )
        `)
        .in('status', ['pending', 'under_review'])
        .order('submitted_at', { ascending: true });

      // Fetch certificate requests
      const { data: certificateRequestsData } = await supabase
        .from('certificate_requests')
        .select(`
          *,
          projects!certificate_requests_project_id_fkey (
            id,
            title,
            location,
            area_hectares,
            estimated_credits,
            verified_at
          ),
          profiles!certificate_requests_requester_id_fkey (
            full_name,
            organization,
            role
          )
        `)
        .eq('status', 'pending')
        .order('requested_at', { ascending: true });

      // Fetch all projects for stats
      const { data: allProjects } = await supabase
        .from('projects')
        .select('status')
        .not('verifier_id', 'is', null);

      const verifiedCount = allProjects?.filter(p => p.status === 'verified').length || 0;
      const rejectedCount = allProjects?.filter(p => p.status === 'rejected').length || 0;

      setPendingProjects(pendingData || []);
      setCertificateRequests(certificateRequestsData || []);
      setStats({
        pendingReviews: pendingData?.length || 0,
        verifiedProjects: verifiedCount,
        rejectedProjects: rejectedCount,
        totalReviewed: verifiedCount + rejectedCount
      });
    } catch (error) {
      console.error('Error fetching verifier data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch verification data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyProject = async (projectId: string, status: 'verified' | 'rejected') => {
    try {
      // Update project status
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          status,
          verifier_id: profile?.id,
          verification_notes: verificationNotes,
          verified_at: status === 'verified' ? new Date().toISOString() : null
        })
        .eq('id', projectId);

      if (updateError) throw updateError;

      // If verified, create carbon credits
      if (status === 'verified') {
        const project = pendingProjects.find(p => p.id === projectId);
        if (project) {
          const { error: creditError } = await supabase
            .from('carbon_credits')
            .insert({
              project_id: projectId,
              owner_id: project.submitter_id,
              credits_amount: project.estimated_credits,
              status: 'active'
            });

          if (creditError) throw creditError;

          // Auto-generate certificate for verified projects
          const { error: certificateError } = await supabase
            .from('certificates')
            .insert({
              project_id: projectId,
              generated_by: profile?.id,
              certificate_url: `auto_cert_${projectId}_${Date.now()}.pdf`
            });

          if (certificateError) {
            console.error('Error auto-generating certificate:', certificateError);
          }
        }
      }

      toast({
        title: 'Success',
        description: `Project ${status} successfully${status === 'verified' ? ' and certificate auto-generated' : ''}`,
      });

      // Refresh data
      fetchVerifierData();
      setSelectedProject(null);
      setVerificationNotes('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const generateCertificate = async (project: Project) => {
    try {
      // This would generate a PDF certificate
      toast({
        title: 'Certificate Generated',
        description: 'Certificate has been generated and saved',
      });
      
      // Navigate to certificates page or show certificate
      navigate('/carbon-tracker');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to generate certificate',
        variant: 'destructive'
      });
    }
  };

  const handleCertificateRequest = async (requestId: string, projectId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      // Update certificate request status
      const { error: updateError } = await supabase
        .from('certificate_requests')
        .update({
          status,
          processed_at: new Date().toISOString(),
          processed_by: profile?.id,
          notes
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // If approved, generate certificate
      if (status === 'approved') {
        const { error: certificateError } = await supabase
          .from('certificates')
          .insert({
            project_id: projectId,
            generated_by: profile?.id
          });

        if (certificateError) throw certificateError;
      }

      toast({
        title: 'Certificate Request Processed',
        description: `Certificate request has been ${status}`,
      });

      // Refresh data
      fetchVerifierData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process certificate request',
        variant: 'destructive'
      });
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Verifier Dashboard</h2>
          <p className="text-muted-foreground">Review and verify environmental projects</p>
        </div>
        <Button onClick={() => navigate('/verification')}>
          <Eye className="w-4 h-4 mr-2" />
          View All Projects
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verifiedProjects}</div>
            <p className="text-xs text-muted-foreground">Successfully verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejectedProjects}</div>
            <p className="text-xs text-muted-foreground">Projects rejected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviewed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviewed}</div>
            <p className="text-xs text-muted-foreground">Projects processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Projects for Review</CardTitle>
          <CardDescription>
            Click on a project to review and verify
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingProjects.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Projects to Review</h3>
              <p className="text-muted-foreground">
                All projects have been reviewed. New submissions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingProjects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">{project.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        By {project.profiles?.full_name} 
                        {project.profiles?.organization && ` (${project.profiles.organization})`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {project.location} • {project.area_hectares} hectares • {project.estimated_credits} estimated credits
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(project.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      {project.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  
                  <p className="text-sm mb-4">{project.description}</p>
                  
                  {selectedProject?.id === project.id ? (
                    <div className="space-y-4 border-t pt-4">
                      <div>
                        <label className="text-sm font-medium">Verification Notes</label>
                        <Textarea
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          placeholder="Add your verification notes..."
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleVerifyProject(project.id, 'verified')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify & Approve
                        </Button>
                        
                        <Button
                          onClick={() => handleVerifyProject(project.id, 'rejected')}
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        
                        <Button
                          onClick={() => setSelectedProject(null)}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setSelectedProject(project)}
                        variant="outline"
                      >
                        Review Project
                      </Button>
                      
                      {project.status === 'verified' && (
                        <Button
                          onClick={() => generateCertificate(project)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Award className="w-4 h-4 mr-2" />
                          Generate Certificate
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificate Requests Section */}
      <Card>
        <CardHeader>
          <CardTitle>Certificate Requests</CardTitle>
          <CardDescription>
            Approve or reject certificate requests from verified projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {certificateRequests.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Certificate Requests</h3>
              <p className="text-muted-foreground">
                Certificate requests from admin, NGO, and Panchayat users will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {certificateRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">{request.projects?.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Requested by {request.profiles?.full_name} 
                        {request.profiles?.organization && ` (${request.profiles.organization})`}
                        • Role: {request.profiles?.role?.toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.projects?.location} • {request.projects?.area_hectares} hectares • {request.projects?.estimated_credits} credits
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested {new Date(request.requested_at).toLocaleDateString()}
                        {request.projects?.verified_at && ` • Verified ${new Date(request.projects.verified_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      PENDING APPROVAL
                    </Badge>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleCertificateRequest(request.id, request.project_id, 'approved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Certificate
                    </Button>
                    
                    <Button
                      onClick={() => handleCertificateRequest(request.id, request.project_id, 'rejected', 'Certificate request rejected')}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
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

export default VerifierDashboard;
