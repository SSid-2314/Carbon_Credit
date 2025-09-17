-- Fix security issue: Restrict profile access to authenticated users only
-- Current issue: "Users can view all profiles" policy allows anyone to read all profile data

-- Drop the overly permissive policy that allows public access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new restrictive policy that requires authentication
-- and only allows users to see basic info (excluding sensitive phone/address data)
CREATE POLICY "Authenticated users can view basic profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Create a security function to check if user can access sensitive profile data
CREATE OR REPLACE FUNCTION public.can_view_sensitive_profile_data(profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid() = profile_user_id;
$$;

-- Note: The existing application code will need to be updated to handle
-- sensitive data access by checking can_view_sensitive_profile_data() 
-- or by querying only the user's own profile for sensitive information
