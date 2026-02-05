-- Fix 1: Remove is_service_request function and use direct admin check
-- The function uses SECURITY DEFINER unnecessarily

-- Drop the existing policy first
DROP POLICY IF EXISTS "Admins can update saved routes" ON public.saved_routes;

-- Drop the function
DROP FUNCTION IF EXISTS public.is_service_request();

-- Recreate policy with direct admin check (no SECURITY DEFINER needed)
CREATE POLICY "Admins can update saved routes" 
ON public.saved_routes 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Fix 2: Replace all INSERT policies with "WITH CHECK (true)" to use admin/service checks
-- These are for cache tables that should only be insertable by admin/service operations

-- cached_events
DROP POLICY IF EXISTS "Service can insert cached events" ON public.cached_events;
CREATE POLICY "Admins can insert cached events" 
ON public.cached_events 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

-- cached_accommodations
DROP POLICY IF EXISTS "Service can insert cached accommodations" ON public.cached_accommodations;
CREATE POLICY "Admins can insert cached accommodations" 
ON public.cached_accommodations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

-- cached_attractions
DROP POLICY IF EXISTS "Service can insert cached attractions" ON public.cached_attractions;
CREATE POLICY "Admins can insert cached attractions" 
ON public.cached_attractions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

-- fuel_prices
DROP POLICY IF EXISTS "Service insert fuel prices" ON public.fuel_prices;
CREATE POLICY "Admins can insert fuel prices" 
ON public.fuel_prices 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

-- road_conditions
DROP POLICY IF EXISTS "Service insert road conditions" ON public.road_conditions;
CREATE POLICY "Admins can insert road conditions" 
ON public.road_conditions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

-- localities
DROP POLICY IF EXISTS "Service insert localities" ON public.localities;
CREATE POLICY "Admins can insert localities" 
ON public.localities 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

-- saved_routes
DROP POLICY IF EXISTS "Service insert saved routes" ON public.saved_routes;
CREATE POLICY "Admins can insert saved routes" 
ON public.saved_routes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

-- traffic_statistics
DROP POLICY IF EXISTS "Service insert traffic stats" ON public.traffic_statistics;
CREATE POLICY "Admins can insert traffic stats" 
ON public.traffic_statistics 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);