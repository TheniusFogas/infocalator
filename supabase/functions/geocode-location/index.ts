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
 
 // Normalize text by removing diacritics
 function normalizeToAscii(text: string): string {
   return text
     .toLowerCase()
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '')
     .replace(/ă/g, 'a')
     .replace(/â/g, 'a')
     .replace(/î/g, 'i')
     .replace(/ș/g, 's')
     .replace(/ş/g, 's')
     .replace(/ț/g, 't')
     .replace(/ţ/g, 't')
     .trim();
 }
 
 // Input validation
 function validateInput(body: unknown): { query: string; country?: string } | null {
   if (!body || typeof body !== 'object') return null;
   
   const data = body as Record<string, unknown>;
   const query = data.query;
   const country = data.country;
   
   if (typeof query !== 'string' || query.length < 2 || query.length > 200) {
     return null;
   }
   
   const sanitizedQuery = query.trim().replace(/[\x00-\x1F\x7F]/g, '');
   if (sanitizedQuery.length < 2) return null;
   
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
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseAnonKey);
 
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
     const normalizedQuery = normalizeToAscii(query);
 
     console.log(`Geocoding: ${query} (normalized: ${normalizedQuery})`);
 
     // First try to find in local database with ASCII search
     const { data: localResults } = await supabase
       .from('localities')
       .select('*')
       .or(`name.ilike.%${query}%,name_ascii.ilike.%${normalizedQuery}%`)
       .order('population', { ascending: false, nullsFirst: false })
       .limit(10);
     
     if (localResults && localResults.length > 0) {
       const results: GeocodeResult[] = localResults.map(loc => ({
         name: loc.name,
         displayName: `${loc.name}, ${loc.county}, România`,
         latitude: Number(loc.latitude),
         longitude: Number(loc.longitude),
         type: loc.locality_type === 'municipiu' ? 'Municipiu' : 
               loc.locality_type === 'oraș' ? 'Oraș' : 
               loc.locality_type === 'sat' ? 'Sat' : 'Localitate',
         county: loc.county,
         country: 'România'
       }));
       
       return new Response(
         JSON.stringify({ success: true, results }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Also check cities table
     const { data: citiesResults } = await supabase
       .from('cities')
       .select('*')
       .ilike('name', `%${query}%`)
       .order('population', { ascending: false })
       .limit(10);
     
     if (citiesResults && citiesResults.length > 0) {
       const results: GeocodeResult[] = citiesResults.map(city => ({
         name: city.name,
         displayName: `${city.name}, ${city.county}, România`,
         latitude: city.latitude || 0,
         longitude: city.longitude || 0,
         type: city.city_type === 'municipiu' ? 'Municipiu' : 'Oraș',
         county: city.county,
         country: 'România'
       }));
       
       return new Response(
         JSON.stringify({ success: true, results }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Fallback to Nominatim for international locations
     const searchQuery = country === 'ro' ? `${query}, Romania` : query;
     const countryFilter = country === 'ro' ? '&countrycodes=ro' : '';
 
     const response = await fetch(
       `https://nominatim.openstreetmap.org/search?` +
       `q=${encodeURIComponent(searchQuery)}&` +
       `format=json&addressdetails=1&limit=20${countryFilter}&accept-language=ro`,
       { headers: { 'User-Agent': 'RomaniaTravel/1.0 (contact@disdis.ro)' } }
     );
 
     if (!response.ok) {
       throw new Error(`Nominatim API failed: ${response.status}`);
     }
 
     const data = await response.json();
 
     const results: GeocodeResult[] = data
       .filter((item: any) => {
         const validTypes = ['city', 'town', 'village', 'hamlet', 'municipality', 'administrative'];
         const type = item.type || item.class;
         return validTypes.some(t => type?.includes(t)) || 
                item.class === 'place' || item.class === 'boundary';
       })
       .map((item: any) => {
         const address = item.address || {};
         let locationType = 'Localitate';
         if (item.type === 'city' || item.type === 'municipality') locationType = 'Municipiu';
         else if (item.type === 'town') locationType = 'Oraș';
         else if (item.type === 'village') locationType = 'Sat';
         
         const county = address.county || address.state || '';
         const cleanCounty = county.replace(/^Județul\s*/i, '').replace(/County$/i, '').trim();
         const name = address.city || address.town || address.village || 
                      address.hamlet || address.municipality || item.name || '';
         
         return {
           name,
           displayName: item.display_name,
           latitude: parseFloat(item.lat),
           longitude: parseFloat(item.lon),
           type: locationType,
           county: cleanCounty,
           country: address.country || 'România'
         };
       })
       .filter((item: GeocodeResult) => item.name);
 
     const uniqueResults = results.reduce((acc: GeocodeResult[], current: GeocodeResult) => {
       const exists = acc.find(item => 
         item.name.toLowerCase() === current.name.toLowerCase() && 
         (item.county || '').toLowerCase() === (current.county || '').toLowerCase()
       );
       if (!exists) acc.push(current);
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
