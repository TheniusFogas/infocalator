import { supabase } from '@/integrations/supabase/client';

export interface Event {
  title: string;
  slug: string;
  date: string;
  endDate?: string;
  time?: string;
  location: string;
  city: string;
  description: string;
  category: string;
  isPaid?: boolean;
  ticketPrice?: string;
  ticketUrl?: string;
  organizer?: string;
  imageKeywords?: string;
  highlights?: string[];
}

export interface EventDetail extends Event {
  venue?: string;
  longDescription?: string;
  ticketPriceRange?: { min: number; max: number; currency: string };
  organizerContact?: string;
  images?: Array<{ url: string; alt: string; type: string }>;
  schedule?: Array<{ day: string; activities: string[] }>;
  facilities?: string[];
  accessibility?: string;
  tips?: string[];
  nearbyAttractions?: string[];
  coordinates?: { lat: number; lng: number };
}

export interface Accommodation {
  name: string;
  slug: string;
  type: string;
  description: string;
  priceRange: string;
  pricePerNight?: { min: number; max: number; currency: string };
  rating?: number;
  reviewCount?: number;
  amenities: string[];
  address?: string;
  city?: string;
  imageKeywords?: string;
  highlights?: string[];
}

export interface AccommodationDetail extends Accommodation {
  stars?: number;
  longDescription?: string;
  county?: string;
  checkIn?: string;
  checkOut?: string;
  images?: Array<{ url: string; alt: string; type: string }>;
  roomTypes?: Array<{ name: string; capacity: number; price: number; features: string[] }>;
  facilities?: string[];
  policies?: {
    cancellation?: string;
    children?: string;
    pets?: string;
    smoking?: string;
  };
  nearbyAttractions?: Array<{ name: string; distance: string }>;
  reviews?: Array<{ author: string; rating: number; text: string; date: string }>;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  coordinates?: { lat: number; lng: number };
  bookingTips?: string[];
}

export interface AIAttraction {
  title: string;
  slug?: string;
  category: string;
  description: string;
  location: string;
  city?: string;
  tips?: string;
  imageKeywords?: string;
  isPaid?: boolean;
  entryFee?: string;
  openingHours?: string;
  duration?: string;
}
 
 export interface AIAttractionDetail extends AIAttraction {
   longDescription?: string;
   history?: string;
   facts?: string[];
   images?: Array<{ url: string; alt: string; type: string }>;
   bestTimeToVisit?: string;
   facilities?: string[];
   accessibility?: string;
   nearbyAttractions?: Array<{ name: string; distance: string }>;
   coordinates?: { lat: number; lng: number };
   viewCount?: number;
 }

export interface TrafficInfo {
  restrictions: Array<{
    road: string;
    description: string;
    status: string;
    icon?: string;
  }>;
  tips: string[];
  tollInfo?: string;
  alternativeRoutes?: string[];
}

export interface GeocodeResult {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  type: string;
  county?: string;
}

type SearchType = 'events' | 'accommodations' | 'attractions' | 'traffic' | 'event-detail' | 'accommodation-detail' | 'attraction-detail' | 'restaurants' | 'restaurant-detail';

export interface Restaurant {
  name: string;
  slug: string;
  type: string;
  description: string;
  priceRange: string;
  rating?: number | null;
  cuisine: string[];
  location: string;
  openingHours?: string;
  imageKeywords?: string;
  latitude?: number;
  longitude?: number;
}

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

  async getEventDetail(location: string, slug: string, county?: string): Promise<SearchResponse<{ event: EventDetail }>> {
    const { data, error } = await supabase.functions.invoke('search-local-info', {
      body: { query: location, type: 'event-detail', location, county, slug },
    });

    if (error) {
      console.error('Error fetching event detail:', error);
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

  async getAccommodationDetail(location: string, slug: string, county?: string): Promise<SearchResponse<{ accommodation: AccommodationDetail }>> {
    const { data, error } = await supabase.functions.invoke('search-local-info', {
      body: { query: location, type: 'accommodation-detail', location, county, slug },
    });

    if (error) {
      console.error('Error fetching accommodation detail:', error);
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
 
   async getAttractionDetail(location: string, slug: string, county?: string): Promise<SearchResponse<{ attraction: AIAttractionDetail }>> {
     const { data, error } = await supabase.functions.invoke('search-local-info', {
       body: { query: location, type: 'attraction-detail', location, county, slug },
     });
 
     if (error) {
       console.error('Error fetching attraction detail:', error);
       return { success: false, error: error.message };
     }
     return data;
   },
 
   async incrementAttractionViews(slug: string, location: string): Promise<void> {
     try {
       await supabase.rpc('increment_attraction_views', {
         attraction_slug: slug,
         attraction_location: location
       });
     } catch (error) {
       console.error('Error incrementing views:', error);
     }
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
  },

  async searchRestaurants(location: string, county?: string): Promise<SearchResponse<{ restaurants: Restaurant[] }>> {
    const { data, error } = await supabase.functions.invoke('search-local-info', {
      body: { query: location, type: 'restaurants', location, county },
    });

    if (error) {
      console.error('Error fetching restaurants:', error);
      return { success: false, error: error.message };
    }
    return data;
  }
};
