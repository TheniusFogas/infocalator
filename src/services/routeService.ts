import { supabase } from "@/integrations/supabase/client";

export interface City {
  id: string;
  name: string;
  county: string;
  population: number;
  city_type: string;
  latitude: number | null;
  longitude: number | null;
  is_major: boolean;
}

export interface Route {
  id: string;
  from_city: string;
  to_city: string;
  distance_km: number;
  duration_minutes: number | null;
}

export interface Attraction {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string;
  location: string;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  views: number;
  created_at: string;
}

export interface RouteResult {
  distance: number;
  duration: number;
  coordinates: [number, number][];
}

// Fetch all cities
export const fetchCities = async (): Promise<City[]> => {
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .order("population", { ascending: false });
  
  if (error) {
    console.error("Error fetching cities:", error);
    return [];
  }
  
  return data || [];
};

// Fetch major cities
export const fetchMajorCities = async (): Promise<City[]> => {
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("is_major", true)
    .order("population", { ascending: false });
  
  if (error) {
    console.error("Error fetching major cities:", error);
    return [];
  }
  
  return data || [];
};

// Fetch popular routes
export const fetchRoutes = async (): Promise<Route[]> => {
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .order("distance_km", { ascending: true });
  
  if (error) {
    console.error("Error fetching routes:", error);
    return [];
  }
  
  return data || [];
};

// Fetch all attractions
export const fetchAttractions = async (): Promise<Attraction[]> => {
  const { data, error } = await supabase
    .from("attractions")
    .select("*")
    .order("views", { ascending: false });
  
  if (error) {
    console.error("Error fetching attractions:", error);
    return [];
  }
  
  return data || [];
};

// Search cities by name
export const searchCities = async (query: string): Promise<City[]> => {
  if (!query || query.length < 2) return [];
  
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .ilike("name", `%${query}%`)
    .order("population", { ascending: false })
    .limit(10);
  
  if (error) {
    console.error("Error searching cities:", error);
    return [];
  }
  
  return data || [];
};

// Calculate route using OpenRouteService (free tier)
export const calculateRoute = async (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<RouteResult | null> => {
  try {
    // Using OSRM (Open Source Routing Machine) - free and no API key needed
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
    );
    
    if (!response.ok) {
      throw new Error("Route calculation failed");
    }
    
    const data = await response.json();
    
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error("No route found");
    }
    
    const route = data.routes[0];
    const coordinates: [number, number][] = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]] // Swap lng,lat to lat,lng for Leaflet
    );
    
    return {
      distance: Math.round(route.distance / 1000), // Convert to km
      duration: Math.round(route.duration / 60), // Convert to minutes
      coordinates,
    };
  } catch (error) {
    console.error("Error calculating route:", error);
    return null;
  }
};

// Get city coordinates by name
export const getCityByName = async (name: string): Promise<City | null> => {
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error("Error fetching city:", error);
    return null;
  }
  
  return data;
};

// Increment attraction views
export const incrementAttractionViews = async (id: string): Promise<void> => {
  // Simple update to increment views
  const { data: attraction } = await supabase
    .from("attractions")
    .select("views")
    .eq("id", id)
    .maybeSingle();
  
  if (attraction) {
    await supabase
      .from("attractions")
      .update({ views: attraction.views + 1 })
      .eq("id", id);
  }
};
