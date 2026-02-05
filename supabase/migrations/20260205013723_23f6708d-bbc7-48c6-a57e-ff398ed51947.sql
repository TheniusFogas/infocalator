-- Fix 1: Admin users - restrict SELECT to only return current user's own record
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;

CREATE POLICY "Users can view own admin record" 
ON public.admin_users 
FOR SELECT 
USING (user_id = auth.uid());

-- Fix 2: Saved routes - restrict UPDATE to only authenticated service roles via admin check
DROP POLICY IF EXISTS "Service update saved routes" ON public.saved_routes;

-- Create a security definer function for service-level operations
CREATE OR REPLACE FUNCTION public.is_service_request()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE user_id = auth.uid()
  )
$$;

CREATE POLICY "Admins can update saved routes" 
ON public.saved_routes 
FOR UPDATE 
USING (public.is_service_request());

-- Fix 3: Data sources - restrict SELECT to admin users only (remove public read)
DROP POLICY IF EXISTS "Anyone can read active data sources" ON public.data_sources;

CREATE POLICY "Admins can read data sources" 
ON public.data_sources 
FOR SELECT 
USING (EXISTS (
  SELECT 1
  FROM admin_users
  WHERE admin_users.user_id = auth.uid()
));