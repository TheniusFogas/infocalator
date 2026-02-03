import { supabase } from '@/integrations/supabase/client';

export interface Event {
  title: string;
  date: string;
  location: string;
  description: string;
  category: string;
}

export interface Accommodation {
  name: string;
  type: string;
  description: string;
  priceRange: string;
  amenities: string[];
}

export interface AIAttraction {
  title: string;
  category: string;
  description: string;
  location: string;
  tips?: string;
}

export interface TrafficInfo {
  restrictions: Array<{
    road: string;
    description: string;
    status: string;
  }>;
  tips: string[];
  tollInfo?: string;
}

export interface GeocodeResult {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  type: string;
  county?: string;
}

type SearchType = 'events' | 'accommodations' | 'attractions' | 'traffic';

interface SearchResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const localInfoApi = {
  async searchEvents(location: string, county?: string): Promise<SearchResponse<{ events: Event[] }>> {
    const { data, error } = await supabase.functions.invoke('search-local-info', {
      body: { query: location, type: 'events', location, county },
    });

    if (error) {
      console.error('Error fetching events:', error);
      return { success: false, error: error.message };
    }
    return data;
  },

  async searchAccommodations(location: string, county?: string): Promise<SearchResponse<{ accommodations: Accommodation[] }>> {
    const { data, error } = await supabase.functions.invoke('search-local-info', {
      body: { query: location, type: 'accommodations', location, county },
    });

    if (error) {
      console.error('Error fetching accommodations:', error);
      return { success: false, error: error.message };
    }
    return data;
  },

  async searchAttractions(location: string, county?: string): Promise<SearchResponse<{ attractions: AIAttraction[] }>> {
    const { data, error } = await supabase.functions.invoke('search-local-info', {
      body: { query: location, type: 'attractions', location, county },
    });

    if (error) {
      console.error('Error fetching attractions:', error);
      return { success: false, error: error.message };
    }
    return data;
  },

  async searchTraffic(location: string, county?: string): Promise<SearchResponse<{ trafficInfo: TrafficInfo }>> {
    const { data, error } = await supabase.functions.invoke('search-local-info', {
      body: { query: location, type: 'traffic', location, county },
    });

    if (error) {
      console.error('Error fetching traffic info:', error);
      return { success: false, error: error.message };
    }
    return data;
  },

  async geocodeLocation(query: string): Promise<GeocodeResult[]> {
    const { data, error } = await supabase.functions.invoke('geocode-location', {
      body: { query },
    });

    if (error) {
      console.error('Error geocoding:', error);
      return [];
    }
    
    return data?.results || [];
  }
};
