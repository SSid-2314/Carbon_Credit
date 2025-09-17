-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'ngo', 'panchayat', 'verifier');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  organization TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create projects table for carbon credit submissions
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  area_hectares DECIMAL(10,2) NOT NULL,
  estimated_credits DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'verified', 'rejected')),
  images TEXT[],
  documents TEXT[],
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verifier_id UUID REFERENCES public.profiles(id),
  verification_notes TEXT
);

-- Create carbon_credits table
CREATE TABLE public.carbon_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  credits_amount DECIMAL(10,2) NOT NULL,
  price_per_credit DECIMAL(10,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'retired')),
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create marketplace_listings table
CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID REFERENCES public.carbon_credits(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  price_per_credit DECIMAL(10,2) NOT NULL,
  credits_available DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Users can view all projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Users can insert their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM profiles WHERE id = submitter_id));
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = submitter_id));
CREATE POLICY "Verifiers can update project verification" ON public.projects FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = verifier_id AND user_id = auth.uid() AND role = 'verifier')
);

-- RLS Policies for carbon_credits
CREATE POLICY "Users can view all credits" ON public.carbon_credits FOR SELECT USING (true);
CREATE POLICY "System can insert credits" ON public.carbon_credits FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can update their credits" ON public.carbon_credits FOR UPDATE USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = owner_id));

-- RLS Policies for marketplace_listings
CREATE POLICY "Users can view all listings" ON public.marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Sellers can insert their listings" ON public.marketplace_listings FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM profiles WHERE id = seller_id));
CREATE POLICY "Sellers can update their listings" ON public.marketplace_listings FOR UPDATE USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = seller_id));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'ngo')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
