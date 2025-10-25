-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'therapist');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Add created_by column to profiles to track hierarchy
ALTER TABLE public.profiles ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update profiles RLS to allow admins to view their subordinates
CREATE POLICY "Admins can view profiles they created"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR 
    auth.uid() = created_by OR
    public.has_role(auth.uid(), 'admin')
  );

-- Allow admins to see patients of their subordinates
CREATE POLICY "Admins can view patients of their subordinates"
  ON public.patients
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = patients.user_id
        AND profiles.created_by = auth.uid()
    )
  );

-- Allow admins to see sessions of their subordinates' patients
CREATE POLICY "Admins can view sessions of subordinates"
  ON public.sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = sessions.patient_id
        AND (
          patients.user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = patients.user_id
              AND profiles.created_by = auth.uid()
          )
        )
    )
  );

-- Insert admin roles for João and Larissa
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email IN ('jfbernacchio@gmail.com', 'larissaschwarcz@hotmail.com')
ON CONFLICT (user_id, role) DO NOTHING;