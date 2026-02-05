const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface GeocodeRequest {
  query: string;
   country?: string; // Optional: 'ro' for Romania, empty for international
}

interface GeocodeResult {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  type: string;
  county?: string;
   country?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
     const { query, country } = await req.json() as GeocodeRequest;
    
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ success: true, results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
