-- Create certificate_requests table
CREATE TABLE IF NOT EXISTS certificate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_certificate_requests_project_id ON certificate_requests(project_id);
CREATE INDEX idx_certificate_requests_requester_id ON certificate_requests(requester_id);
CREATE INDEX idx_certificate_requests_status ON certificate_requests(status);

-- Add RLS policies
ALTER TABLE certificate_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests and verifiers/admins can view all
CREATE POLICY "Users can view their own certificate requests" ON certificate_requests
  FOR SELECT USING (
    requester_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('verifier', 'admin')
    )
  );

-- Policy: Only authenticated users can create certificate requests
CREATE POLICY "Users can create certificate requests" ON certificate_requests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.id = requester_id
    )
  );

-- Policy: Only verifiers and admins can update certificate requests
CREATE POLICY "Verifiers can update certificate requests" ON certificate_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('verifier', 'admin')
    )
  );
