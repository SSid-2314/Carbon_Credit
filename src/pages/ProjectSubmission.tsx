import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, Upload } from 'lucide-react';

const ProjectSubmission = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    areaHectares: '',
    estimatedCredits: '',
    images: [] as string[],
    documents: [] as string[]
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) {
      toast({
        title: 'Error',
        description: 'You must be logged in to submit a project',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          submitter_id: profile.id,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          area_hectares: parseFloat(formData.areaHectares),
          estimated_credits: parseFloat(formData.estimatedCredits),
          images: formData.images,
          documents: formData.documents,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project submitted successfully! It will be reviewed by our verification team.'
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        location: '',
        areaHectares: '',
        estimatedCredits: '',
        images: [],
        documents: []
      });

      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit project',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            Submit New Project
          </CardTitle>
          <CardDescription>
            Submit your blue carbon restoration project for verification and credit issuance.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Mangrove Restoration in Sundarbans"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detailed description of your restoration project, methodologies, and expected outcomes..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., West Bengal, India"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="areaHectares">Area (Hectares)</Label>
                <Input
                  id="areaHectares"
                  type="number"
                  step="0.01"
                  value={formData.areaHectares}
                  onChange={(e) => handleInputChange('areaHectares', e.target.value)}
                  placeholder="e.g., 25.5"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedCredits">Estimated Carbon Credits</Label>
              <Input
                id="estimatedCredits"
                type="number"
                step="0.01"
                value={formData.estimatedCredits}
                onChange={(e) => handleInputChange('estimatedCredits', e.target.value)}
                placeholder="e.g., 1250.75"
                required
              />
              <p className="text-sm text-muted-foreground">
                Estimated carbon credits that will be generated (in tCO2e)
              </p>
            </div>

            {/* Placeholder for file uploads */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Project Images</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Image upload functionality will be implemented in the mobile upload section
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Supporting Documents</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Document upload functionality will be implemented in the mobile upload section
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Before Submitting:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ensure all project details are accurate and complete</li>
                <li>• Have supporting documentation ready for upload</li>
                <li>• Projects undergo verification which may take 2-4 weeks</li>
                <li>• You'll be notified of any additional requirements</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Project for Review
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectSubmission;