-- Create cached_events table for storing AI-generated events
CREATE TABLE public.cached_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  location TEXT NOT NULL,
  county TEXT,
  title TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  category TEXT,
  date TEXT,
  end_date TEXT,
  time TEXT,
  venue TEXT,
  is_paid BOOLEAN DEFAULT false,
  ticket_price TEXT,
  ticket_url TEXT,
  organizer TEXT,
  organizer_contact TEXT,
  image_keywords TEXT,
  highlights TEXT[],
  schedule JSONB,
  facilities TEXT[],
  accessibility TEXT,
  tips TEXT[],
  nearby_attractions TEXT[],
  latitude NUMERIC,
  longitude NUMERIC,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(slug, location)
);

-- Create cached_accommodations table
CREATE TABLE public.cached_accommodations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  location TEXT NOT NULL,
  county TEXT,
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  long_description TEXT,
  stars INTEGER,
  price_range TEXT,
  price_min NUMERIC,
  price_max NUMERIC,
  currency TEXT DEFAULT 'RON',
  rating NUMERIC,
  review_count INTEGER,
  amenities TEXT[],
  address TEXT,
  image_keywords TEXT,
  highlights TEXT[],
  check_in TEXT,
  check_out TEXT,
  room_types JSONB,
  facilities TEXT[],
  policies JSONB,
  nearby_attractions JSONB,
  reviews JSONB,
  contact JSONB,
  latitude NUMERIC,
  longitude NUMERIC,
  booking_tips TEXT[],
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(slug, location)
);

-- Create cached_attractions table
CREATE TABLE public.cached_attractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  location TEXT NOT NULL,
  county TEXT,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  tips TEXT,
  image_keywords TEXT,
  is_paid BOOLEAN DEFAULT false,
  entry_fee TEXT,
  opening_hours TEXT,
  duration TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(slug, location)
);

-- Create admin_users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_zones table for Google AdSense and other ad placements
CREATE TABLE public.ad_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  zone_key TEXT NOT NULL UNIQUE,
  ad_type TEXT NOT NULL DEFAULT 'adsense',
  ad_code TEXT,
  is_active BOOLEAN DEFAULT true,
  placement TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate_links table for booking platforms
CREATE TABLE public.affiliate_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  base_url TEXT NOT NULL,
  affiliate_id TEXT,
  tracking_params TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_settings table for general configurations
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'string',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.cached_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for cached content
CREATE POLICY "Anyone can read cached events" ON public.cached_events FOR SELECT USING (true);
CREATE POLICY "Anyone can read cached accommodations" ON public.cached_accommodations FOR SELECT USING (true);
CREATE POLICY "Anyone can read cached attractions" ON public.cached_attractions FOR SELECT USING (true);
CREATE POLICY "Anyone can read active ad zones" ON public.ad_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active affiliate links" ON public.affiliate_links FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admins can manage cached events" ON public.cached_events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage cached accommodations" ON public.cached_accommodations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage cached attractions" ON public.cached_attractions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage ad zones" ON public.ad_zones FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage affiliate links" ON public.affiliate_links FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can view admin users" ON public.admin_users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Service role can insert cached data (for edge functions)
CREATE POLICY "Service can insert cached events" ON public.cached_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can insert cached accommodations" ON public.cached_accommodations FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can insert cached attractions" ON public.cached_attractions FOR INSERT WITH CHECK (true);

-- Create updated_at triggers
CREATE TRIGGER update_cached_events_updated_at BEFORE UPDATE ON public.cached_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cached_accommodations_updated_at BEFORE UPDATE ON public.cached_accommodations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cached_attractions_updated_at BEFORE UPDATE ON public.cached_attractions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ad_zones_updated_at BEFORE UPDATE ON public.ad_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_affiliate_links_updated_at BEFORE UPDATE ON public.affiliate_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default affiliate platforms
INSERT INTO public.affiliate_links (platform, base_url, priority, is_active) VALUES
  ('Booking.com', 'https://www.booking.com/searchresults.html', 100, true),
  ('Travelminit.ro', 'https://www.travelminit.ro/cautare', 90, true),
  ('DirectBooking.ro', 'https://www.directbooking.ro', 80, true),
  ('Airbnb', 'https://www.airbnb.com/s/', 70, true),
  ('Vola.ro', 'https://www.vola.ro', 60, true),
  ('Infopensiuni.ro', 'https://www.infopensiuni.ro', 50, true);

-- Insert default ad zones
INSERT INTO public.ad_zones (name, zone_key, ad_type, placement, is_active) VALUES
  ('Header Banner', 'header_banner', 'adsense', 'header', false),
  ('Sidebar Top', 'sidebar_top', 'adsense', 'sidebar', false),
  ('Sidebar Bottom', 'sidebar_bottom', 'adsense', 'sidebar', false),
  ('In-Content', 'in_content', 'adsense', 'content', false),
  ('Footer Banner', 'footer_banner', 'adsense', 'footer', false),
  ('Accommodation Card', 'accommodation_card', 'adsense', 'card', false),
  ('Search Results', 'search_results', 'adsense', 'search', false);

-- Insert default site settings
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, description) VALUES
  ('adsense_publisher_id', '', 'string', 'Google AdSense Publisher ID (ca-pub-XXXXX)'),
  ('default_language', 'ro', 'string', 'Default site language'),
  ('cache_duration_hours', '24', 'number', 'How long to cache AI-generated content'),
  ('enable_ads', 'false', 'boolean', 'Enable advertisement display'),
  ('analytics_id', '', 'string', 'Google Analytics ID');