-- Tabel pentru prețuri carburanți cu cache și date pe județe
CREATE TABLE IF NOT EXISTS public.fuel_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  county TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  price_min DECIMAL(5,2) NOT NULL,
  price_max DECIMAL(5,2) NOT NULL,
  price_avg DECIMAL(5,2) NOT NULL,
  trend TEXT DEFAULT 'stable',
  change_percent DECIMAL(4,2) DEFAULT 0,
  source_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(county, fuel_type)
);

-- Tabel pentru starea drumurilor
CREATE TABLE IF NOT EXISTS public.road_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  road_name TEXT NOT NULL,
  road_type TEXT NOT NULL,
  segment_start TEXT,
  segment_end TEXT,
  condition_status TEXT NOT NULL,
  description TEXT,
  warning_type TEXT,
  source_url TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel pentru localități complete
CREATE TABLE IF NOT EXISTS public.localities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  geoname_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  name_ascii TEXT,
  county TEXT NOT NULL,
  county_code TEXT,
  locality_type TEXT NOT NULL,
  population INTEGER DEFAULT 0,
  latitude DECIMAL(10,6) NOT NULL,
  longitude DECIMAL(10,6) NOT NULL,
  postal_code TEXT,
  timezone TEXT DEFAULT 'Europe/Bucharest',
  elevation INTEGER,
  is_county_seat BOOLEAN DEFAULT false,
  parent_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel pentru rute salvate
CREATE TABLE IF NOT EXISTS public.saved_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_locality_id UUID,
  to_locality_id UUID,
  from_name TEXT NOT NULL,
  to_name TEXT NOT NULL,
  distance_km INTEGER NOT NULL,
  duration_minutes INTEGER,
  route_geometry JSONB,
  fuel_consumption_estimate DECIMAL(5,2),
  toll_cost DECIMAL(6,2),
  view_count INTEGER DEFAULT 0,
  vote_score INTEGER DEFAULT 0,
  is_alternative BOOLEAN DEFAULT false,
  parent_route_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel pentru statistici trafic
CREATE TABLE IF NOT EXISTS public.traffic_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_type TEXT NOT NULL,
  stat_key TEXT NOT NULL,
  stat_value DECIMAL(10,2) NOT NULL,
  stat_unit TEXT,
  year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  month INTEGER,
  source_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel pentru surse de date
CREATE TABLE IF NOT EXISTS public.data_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  api_type TEXT DEFAULT 'scraping',
  api_key_name TEXT,
  refresh_interval_hours INTEGER DEFAULT 24,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexuri
CREATE INDEX IF NOT EXISTS idx_localities_county ON public.localities(county);
CREATE INDEX IF NOT EXISTS idx_localities_type ON public.localities(locality_type);
CREATE INDEX IF NOT EXISTS idx_localities_population ON public.localities(population DESC);
CREATE INDEX IF NOT EXISTS idx_saved_routes_popularity ON public.saved_routes(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_stats_type ON public.traffic_statistics(stat_type, year);

-- Enable RLS
ALTER TABLE public.fuel_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.road_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

-- Policies citire publică
CREATE POLICY "Anyone can read fuel prices" ON public.fuel_prices FOR SELECT USING (true);
CREATE POLICY "Anyone can read road conditions" ON public.road_conditions FOR SELECT USING (true);
CREATE POLICY "Anyone can read localities" ON public.localities FOR SELECT USING (true);
CREATE POLICY "Anyone can read saved routes" ON public.saved_routes FOR SELECT USING (true);
CREATE POLICY "Anyone can read traffic statistics" ON public.traffic_statistics FOR SELECT USING (true);
CREATE POLICY "Anyone can read active data sources" ON public.data_sources FOR SELECT USING (is_active = true);

-- Policies admin
CREATE POLICY "Admins manage fuel prices" ON public.fuel_prices FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));
CREATE POLICY "Admins manage road conditions" ON public.road_conditions FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));
CREATE POLICY "Admins manage localities" ON public.localities FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));
CREATE POLICY "Admins manage saved routes" ON public.saved_routes FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));
CREATE POLICY "Admins manage traffic stats" ON public.traffic_statistics FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));
CREATE POLICY "Admins manage data sources" ON public.data_sources FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

-- Policies pentru service (edge functions)
CREATE POLICY "Service insert fuel prices" ON public.fuel_prices FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert road conditions" ON public.road_conditions FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert localities" ON public.localities FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert saved routes" ON public.saved_routes FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update saved routes" ON public.saved_routes FOR UPDATE USING (true);
CREATE POLICY "Service insert traffic stats" ON public.traffic_statistics FOR INSERT WITH CHECK (true);

-- Triggers
CREATE TRIGGER update_fuel_prices_updated_at BEFORE UPDATE ON public.fuel_prices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_road_conditions_updated_at BEFORE UPDATE ON public.road_conditions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON public.data_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();