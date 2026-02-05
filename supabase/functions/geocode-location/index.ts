 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 interface GeocodeResult {
   name: string;
   displayName: string;
   latitude: number;
   longitude: number;
   type: string;
   county?: string;
   country?: string;
 }
 
 // Input validation
 function validateInput(body: unknown): { query: string; country?: string } | null {
   if (!body || typeof body !== 'object') return null;
   
   const data = body as Record<string, unknown>;
   const query = data.query;
   const country = data.country;
   
   // Validate query: required string, 2-200 chars
   if (typeof query !== 'string' || query.length < 2 || query.length > 200) {
     return null;
   }
   
   // Sanitize query: trim, remove control characters
   const sanitizedQuery = query.trim().replace(/[\x00-\x1F\x7F]/g, '');
   if (sanitizedQuery.length < 2) return null;
   
   // Validate country: optional, must be 'ro' or empty/undefined
   if (country !== undefined && country !== '' && country !== 'ro') {
     return null;
   }
   
   return {
     query: sanitizedQuery,
     country: country as string | undefined
   };
 }
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     // Authentication check
     const authHeader = req.headers.get('Authorization');
     if (!authHeader) {
       console.log('Geocode request rejected: No authorization header');
       return new Response(
         JSON.stringify({ success: false, error: 'Autentificare necesară' }),
         { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
     
     const supabase = createClient(supabaseUrl, supabaseAnonKey, {
       global: { headers: { Authorization: authHeader } }
     });
 
     const { data: { user }, error: authError } = await supabase.auth.getUser();
     if (authError || !user) {
       console.log('Geocode request rejected: Invalid user', authError?.message);
       return new Response(
         JSON.stringify({ success: false, error: 'Autentificare invalidă' }),
         { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     console.log(`Geocode request from user: ${user.id}`);
 
     // Parse and validate input
     let body: unknown;
     try {
       body = await req.json();
     } catch {
       return new Response(
         JSON.stringify({ success: false, error: 'Format JSON invalid' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const validated = validateInput(body);
     if (!validated) {
       return new Response(
         JSON.stringify({ success: false, error: 'Parametri invalizi. Query trebuie să aibă 2-200 caractere.' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const { query, country } = validated;

    console.log(`Geocoding: ${query}`);

     // Build query based on country preference
     const searchQuery = country === 'ro' ? `${query}, Romania` : query;
     const countryFilter = country === 'ro' ? '&countrycodes=ro' : '';
 
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
       `q=${encodeURIComponent(searchQuery)}&` +
      `format=json&` +
      `addressdetails=1&` +
       `limit=20` +
       countryFilter + `&` +
      `accept-language=ro`,
      {
        headers: {
          'User-Agent': 'RomaniaTravel/1.0 (contact@disdis.ro)'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API failed: ${response.status}`);
    }

    const data = await response.json();

    // Filter and transform results
    const results: GeocodeResult[] = data
      .filter((item: any) => {
        // Include cities, towns, villages, communes, and other populated places
        const validTypes = ['city', 'town', 'village', 'hamlet', 'municipality', 'administrative'];
        const type = item.type || item.class;
        return validTypes.some(t => type?.includes(t)) || 
               item.class === 'place' ||
               item.class === 'boundary';
      })
      .map((item: any) => {
        const address = item.address || {};
        
        // Determine the type in Romanian
        let locationType = 'Localitate';
        if (item.type === 'city' || item.type === 'municipality') {
          locationType = 'Municipiu';
        } else if (item.type === 'town') {
          locationType = 'Oraș';
        } else if (item.type === 'village') {
          locationType = 'Sat';
        } else if (item.addresstype === 'hamlet' || item.type === 'hamlet') {
          locationType = 'Cătun';
        }
        
        // Extract county (județ)
        const county = address.county || address.state || '';
        const cleanCounty = county.replace(/^Județul\s*/i, '').replace(/County$/i, '').trim();
        
        // Get the best name
        const name = address.city || address.town || address.village || 
                     address.hamlet || address.municipality || item.name || '';
        
        return {
          name: name,
          displayName: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          type: locationType,
           county: cleanCounty,
           country: address.country || 'România'
        };
      })
      .filter((item: GeocodeResult) => item.name); // Filter out items without names

    // Remove duplicates based on name
    const uniqueResults = results.reduce((acc: GeocodeResult[], current: GeocodeResult) => {
      const exists = acc.find(item => 
        item.name.toLowerCase() === current.name.toLowerCase() && 
        (item.county || '').toLowerCase() === (current.county || '').toLowerCase()
      );
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

    return new Response(
       JSON.stringify({ success: true, results: uniqueResults.slice(0, 15) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in geocode-location:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, results: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
