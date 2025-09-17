-- Add tables for certificates and GPS coordinates
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  certificate_url text,
  generated_at timestamp with time zone DEFAULT now(),
  generated_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for certificates
CREATE POLICY "Users can view certificates for their projects" 
ON public.certificates 
FOR SELECT 
TO authenticated
USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE submitter_id = (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  OR 
  generated_by = (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Verifiers can insert certificates" 
ON public.certificates 
FOR INSERT 
TO authenticated
WITH CHECK (
  generated_by = (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'verifier'
  )
);

-- Add GPS coordinates to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS gps_coordinates jsonb;

-- Add certificate_id to projects for easier lookups
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS certificate_id uuid REFERENCES public.certificates(id);

-- Create trigger to update updated_at for certificates
CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_certificates_project_id ON public.certificates(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_gps_coordinates ON public.projects USING GIN(gps_coordinates);
