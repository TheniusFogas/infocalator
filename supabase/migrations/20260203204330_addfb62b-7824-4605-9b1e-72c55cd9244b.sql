-- Create table for attractions/tourist destinations
CREATE TABLE public.attractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'Alt',
  location TEXT NOT NULL,
  county TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for cities/localities
CREATE TABLE public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  county TEXT NOT NULL,
  population INTEGER NOT NULL DEFAULT 0,
  city_type TEXT NOT NULL DEFAULT 'Oraș',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_major BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for popular routes
CREATE TABLE public.routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  distance_km INTEGER NOT NULL,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public read access)
ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can view attractions" 
  ON public.attractions FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can view cities" 
  ON public.cities FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can view routes" 
  ON public.routes FOR SELECT 
  USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on attractions
CREATE TRIGGER update_attractions_updated_at
  BEFORE UPDATE ON public.attractions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_attractions_category ON public.attractions(category);
CREATE INDEX idx_attractions_county ON public.attractions(county);
CREATE INDEX idx_cities_county ON public.cities(county);
CREATE INDEX idx_cities_is_major ON public.cities(is_major);
CREATE INDEX idx_routes_from_city ON public.routes(from_city);
CREATE INDEX idx_routes_to_city ON public.routes(to_city);