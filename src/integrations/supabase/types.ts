export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_zones: {
        Row: {
          ad_code: string | null
          ad_type: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          placement: string | null
          updated_at: string
          zone_key: string
        }
        Insert: {
          ad_code?: string | null
          ad_type?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          placement?: string | null
          updated_at?: string
          zone_key: string
        }
        Update: {
          ad_code?: string | null
          ad_type?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          placement?: string | null
          updated_at?: string
          zone_key?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_links: {
        Row: {
          affiliate_id: string | null
          base_url: string
          created_at: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          platform: string
          priority: number | null
          tracking_params: string | null
          updated_at: string
        }
        Insert: {
          affiliate_id?: string | null
          base_url: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          platform: string
          priority?: number | null
          tracking_params?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string | null
          base_url?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          platform?: string
          priority?: number | null
          tracking_params?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      attractions: {
        Row: {
          category: string
          county: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          latitude: number | null
          location: string
          longitude: number | null
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          category?: string
          county?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          location: string
          longitude?: number | null
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          category?: string
          county?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      cached_accommodations: {
        Row: {
          address: string | null
          amenities: string[] | null
          booking_tips: string[] | null
          check_in: string | null
          check_out: string | null
          contact: Json | null
          county: string | null
          created_at: string
          currency: string | null
          description: string | null
          expires_at: string
          facilities: string[] | null
          highlights: string[] | null
          id: string
          image_keywords: string | null
          latitude: number | null
          location: string
          long_description: string | null
          longitude: number | null
          name: string
          nearby_attractions: Json | null
          policies: Json | null
          price_max: number | null
          price_min: number | null
          price_range: string | null
          rating: number | null
          review_count: number | null
          reviews: Json | null
          room_types: Json | null
          slug: string
          stars: number | null
          type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          booking_tips?: string[] | null
          check_in?: string | null
          check_out?: string | null
          contact?: Json | null
          county?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          expires_at: string
          facilities?: string[] | null
          highlights?: string[] | null
          id?: string
          image_keywords?: string | null
          latitude?: number | null
          location: string
          long_description?: string | null
          longitude?: number | null
          name: string
          nearby_attractions?: Json | null
          policies?: Json | null
          price_max?: number | null
          price_min?: number | null
          price_range?: string | null
          rating?: number | null
          review_count?: number | null
          reviews?: Json | null
          room_types?: Json | null
          slug: string
          stars?: number | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          booking_tips?: string[] | null
          check_in?: string | null
          check_out?: string | null
          contact?: Json | null
          county?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          expires_at?: string
          facilities?: string[] | null
          highlights?: string[] | null
          id?: string
          image_keywords?: string | null
          latitude?: number | null
          location?: string
          long_description?: string | null
          longitude?: number | null
          name?: string
          nearby_attractions?: Json | null
          policies?: Json | null
          price_max?: number | null
          price_min?: number | null
          price_range?: string | null
          rating?: number | null
          review_count?: number | null
          reviews?: Json | null
          room_types?: Json | null
          slug?: string
          stars?: number | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cached_attractions: {
        Row: {
          accessibility: string | null
          best_time_to_visit: string | null
          category: string | null
          county: string | null
          created_at: string
          description: string | null
          duration: string | null
          entry_fee: string | null
          expires_at: string
          facilities: string[] | null
          facts: Json | null
          history: string | null
          id: string
          image_keywords: string | null
          images: Json | null
          is_paid: boolean | null
          latitude: number | null
          location: string
          long_description: string | null
          longitude: number | null
          nearby_attractions: Json | null
          opening_hours: string | null
          slug: string
          tips: string | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          accessibility?: string | null
          best_time_to_visit?: string | null
          category?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          entry_fee?: string | null
          expires_at: string
          facilities?: string[] | null
          facts?: Json | null
          history?: string | null
          id?: string
          image_keywords?: string | null
          images?: Json | null
          is_paid?: boolean | null
          latitude?: number | null
          location: string
          long_description?: string | null
          longitude?: number | null
          nearby_attractions?: Json | null
          opening_hours?: string | null
          slug: string
          tips?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          accessibility?: string | null
          best_time_to_visit?: string | null
          category?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          entry_fee?: string | null
          expires_at?: string
          facilities?: string[] | null
          facts?: Json | null
          history?: string | null
          id?: string
          image_keywords?: string | null
          images?: Json | null
          is_paid?: boolean | null
          latitude?: number | null
          location?: string
          long_description?: string | null
          longitude?: number | null
          nearby_attractions?: Json | null
          opening_hours?: string | null
          slug?: string
          tips?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      cached_events: {
        Row: {
          accessibility: string | null
          category: string | null
          county: string | null
          created_at: string
          date: string | null
          description: string | null
          end_date: string | null
          expires_at: string
          facilities: string[] | null
          highlights: string[] | null
          id: string
          image_keywords: string | null
          is_paid: boolean | null
          latitude: number | null
          location: string
          long_description: string | null
          longitude: number | null
          nearby_attractions: string[] | null
          organizer: string | null
          organizer_contact: string | null
          schedule: Json | null
          slug: string
          ticket_price: string | null
          ticket_url: string | null
          time: string | null
          tips: string[] | null
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          accessibility?: string | null
          category?: string | null
          county?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          end_date?: string | null
          expires_at: string
          facilities?: string[] | null
          highlights?: string[] | null
          id?: string
          image_keywords?: string | null
          is_paid?: boolean | null
          latitude?: number | null
          location: string
          long_description?: string | null
          longitude?: number | null
          nearby_attractions?: string[] | null
          organizer?: string | null
          organizer_contact?: string | null
          schedule?: Json | null
          slug: string
          ticket_price?: string | null
          ticket_url?: string | null
          time?: string | null
          tips?: string[] | null
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          accessibility?: string | null
          category?: string | null
          county?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          end_date?: string | null
          expires_at?: string
          facilities?: string[] | null
          highlights?: string[] | null
          id?: string
          image_keywords?: string | null
          is_paid?: boolean | null
          latitude?: number | null
          location?: string
          long_description?: string | null
          longitude?: number | null
          nearby_attractions?: string[] | null
          organizer?: string | null
          organizer_contact?: string | null
          schedule?: Json | null
          slug?: string
          ticket_price?: string | null
          ticket_url?: string | null
          time?: string | null
          tips?: string[] | null
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          city_type: string
          county: string
          created_at: string
          id: string
          is_major: boolean
          latitude: number | null
          longitude: number | null
          name: string
          population: number
        }
        Insert: {
          city_type?: string
          county: string
          created_at?: string
          id?: string
          is_major?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          population?: number
        }
        Update: {
          city_type?: string
          county?: string
          created_at?: string
          id?: string
          is_major?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          population?: number
        }
        Relationships: []
      }
      data_sources: {
        Row: {
          api_key_name: string | null
          api_type: string | null
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          priority: number | null
          refresh_interval_hours: number | null
          source_name: string
          source_type: string
          source_url: string
          sync_error: string | null
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          api_key_name?: string | null
          api_type?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          priority?: number | null
          refresh_interval_hours?: number | null
          source_name: string
          source_type: string
          source_url: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          api_key_name?: string | null
          api_type?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          priority?: number | null
          refresh_interval_hours?: number | null
          source_name?: string
          source_type?: string
          source_url?: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fuel_prices: {
        Row: {
          change_percent: number | null
          county: string
          created_at: string
          expires_at: string
          fuel_type: string
          id: string
          price_avg: number
          price_max: number
          price_min: number
          source_url: string | null
          trend: string | null
          updated_at: string
        }
        Insert: {
          change_percent?: number | null
          county: string
          created_at?: string
          expires_at: string
          fuel_type: string
          id?: string
          price_avg: number
          price_max: number
          price_min: number
          source_url?: string | null
          trend?: string | null
          updated_at?: string
        }
        Update: {
          change_percent?: number | null
          county?: string
          created_at?: string
          expires_at?: string
          fuel_type?: string
          id?: string
          price_avg?: number
          price_max?: number
          price_min?: number
          source_url?: string | null
          trend?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      localities: {
        Row: {
          county: string
          county_code: string | null
          created_at: string
          elevation: number | null
          geoname_id: number | null
          id: string
          is_county_seat: boolean | null
          latitude: number
          locality_type: string
          longitude: number
          name: string
          name_ascii: string | null
          parent_id: string | null
          population: number | null
          postal_code: string | null
          timezone: string | null
        }
        Insert: {
          county: string
          county_code?: string | null
          created_at?: string
          elevation?: number | null
          geoname_id?: number | null
          id?: string
          is_county_seat?: boolean | null
          latitude: number
          locality_type: string
          longitude: number
          name: string
          name_ascii?: string | null
          parent_id?: string | null
          population?: number | null
          postal_code?: string | null
          timezone?: string | null
        }
        Update: {
          county?: string
          county_code?: string | null
          created_at?: string
          elevation?: number | null
          geoname_id?: number | null
          id?: string
          is_county_seat?: boolean | null
          latitude?: number
          locality_type?: string
          longitude?: number
          name?: string
          name_ascii?: string | null
          parent_id?: string | null
          population?: number | null
          postal_code?: string | null
          timezone?: string | null
        }
        Relationships: []
      }
      road_conditions: {
        Row: {
          condition_status: string
          created_at: string
          description: string | null
          expires_at: string
          id: string
          latitude: number | null
          longitude: number | null
          road_name: string
          road_type: string
          segment_end: string | null
          segment_start: string | null
          source_url: string | null
          updated_at: string
          warning_type: string | null
        }
        Insert: {
          condition_status: string
          created_at?: string
          description?: string | null
          expires_at: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          road_name: string
          road_type: string
          segment_end?: string | null
          segment_start?: string | null
          source_url?: string | null
          updated_at?: string
          warning_type?: string | null
        }
        Update: {
          condition_status?: string
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          road_name?: string
          road_type?: string
          segment_end?: string | null
          segment_start?: string | null
          source_url?: string | null
          updated_at?: string
          warning_type?: string | null
        }
        Relationships: []
      }
      routes: {
        Row: {
          created_at: string
          distance_km: number
          duration_minutes: number | null
          from_city: string
          id: string
          to_city: string
        }
        Insert: {
          created_at?: string
          distance_km: number
          duration_minutes?: number | null
          from_city: string
          id?: string
          to_city: string
        }
        Update: {
          created_at?: string
          distance_km?: number
          duration_minutes?: number | null
          from_city?: string
          id?: string
          to_city?: string
        }
        Relationships: []
      }
      saved_routes: {
        Row: {
          created_at: string
          distance_km: number
          duration_minutes: number | null
          expires_at: string | null
          from_locality_id: string | null
          from_name: string
          fuel_consumption_estimate: number | null
          id: string
          is_alternative: boolean | null
          parent_route_id: string | null
          route_geometry: Json | null
          to_locality_id: string | null
          to_name: string
          toll_cost: number | null
          view_count: number | null
          vote_score: number | null
        }
        Insert: {
          created_at?: string
          distance_km: number
          duration_minutes?: number | null
          expires_at?: string | null
          from_locality_id?: string | null
          from_name: string
          fuel_consumption_estimate?: number | null
          id?: string
          is_alternative?: boolean | null
          parent_route_id?: string | null
          route_geometry?: Json | null
          to_locality_id?: string | null
          to_name: string
          toll_cost?: number | null
          view_count?: number | null
          vote_score?: number | null
        }
        Update: {
          created_at?: string
          distance_km?: number
          duration_minutes?: number | null
          expires_at?: string | null
          from_locality_id?: string | null
          from_name?: string
          fuel_consumption_estimate?: number | null
          id?: string
          is_alternative?: boolean | null
          parent_route_id?: string | null
          route_geometry?: Json | null
          to_locality_id?: string | null
          to_name?: string
          toll_cost?: number | null
          view_count?: number | null
          vote_score?: number | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_type: string | null
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_type?: string | null
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string | null
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      traffic_statistics: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          month: number | null
          source_url: string | null
          stat_key: string
          stat_type: string
          stat_unit: string | null
          stat_value: number
          year: number | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          month?: number | null
          source_url?: string | null
          stat_key: string
          stat_type: string
          stat_unit?: string | null
          stat_value: number
          year?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          month?: number | null
          source_url?: string | null
          stat_key?: string
          stat_type?: string
          stat_unit?: string | null
          stat_value?: number
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_attraction_views: {
        Args: { attraction_location: string; attraction_slug: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
