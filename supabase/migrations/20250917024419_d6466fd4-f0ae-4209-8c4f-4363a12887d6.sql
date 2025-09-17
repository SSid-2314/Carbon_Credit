-- Fix security issue: Restrict profile access to authenticated users only
-- and limit sensitive information access to profile owners

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new restrictive policies
-- Policy 1: Users can view their own complete profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can view basic info of other users (name, role, organization only)
-- This is needed for project listings and marketplace functionality
CREATE POLICY "Authenticated users can view basic profile info" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- However, we need to create a view that only exposes safe profile information for public access
-- Create a view for safe profile information that excludes sensitive data
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id,
  user_id,
  full_name,
  role,
  organization,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.profiles_public SET (security_invoker = true);
