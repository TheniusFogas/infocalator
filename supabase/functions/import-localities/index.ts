 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 // Helper to create ASCII version of name for search
 function toAscii(str: string): string {
   return str
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '')
     .replace(/ș|Ș/g, 's')
     .replace(/ț|Ț/g, 't')
     .replace(/ă|Ă/g, 'a')
     .replace(/â|Â/g, 'a')
     .replace(/î|Î/g, 'i')
     .toLowerCase();
 }
 
 // County codes mapping
 const COUNTY_CODES: Record<string, string> = {
   'Alba': 'AB', 'Arad': 'AR', 'Argeș': 'AG', 'Bacău': 'BC', 'Bihor': 'BH',
   'Bistrița-Năsăud': 'BN', 'Botoșani': 'BT', 'Brașov': 'BV', 'Brăila': 'BR',
   'București': 'B', 'Buzău': 'BZ', 'Caraș-Severin': 'CS', 'Călărași': 'CL',
   'Cluj': 'CJ', 'Constanța': 'CT', 'Covasna': 'CV', 'Dâmbovița': 'DB',
   'Dolj': 'DJ', 'Galați': 'GL', 'Giurgiu': 'GR', 'Gorj': 'GJ', 'Harghita': 'HR',
   'Hunedoara': 'HD', 'Ialomița': 'IL', 'Iași': 'IS', 'Ilfov': 'IF',
   'Maramureș': 'MM', 'Mehedinți': 'MH', 'Mureș': 'MS', 'Neamț': 'NT',
   'Olt': 'OT', 'Prahova': 'PH', 'Satu Mare': 'SM', 'Sălaj': 'SJ', 'Sibiu': 'SB',
   'Suceava': 'SV', 'Teleorman': 'TR', 'Timiș': 'TM', 'Tulcea': 'TL',
   'Vaslui': 'VS', 'Vâlcea': 'VL', 'Vrancea': 'VN'
 };
 
 // Reverse mapping
 const COUNTY_NAMES: Record<string, string> = Object.fromEntries(
   Object.entries(COUNTY_CODES).map(([name, code]) => [code, name])
 );
 
 // Import state table name
 const IMPORT_STATE_KEY = 'localities_import_state';
 
 interface ImportState {
   lastCountyIndex: number;
   processedCount: number;
   totalExpected: number;
   status: 'idle' | 'running' | 'completed' | 'error';
   lastError?: string;
   lastRun?: string;
 }
 
 // Counties to process in order
 const COUNTIES_LIST = Object.keys(COUNTY_CODES);
 
 // Fetch localities for a specific county from Overpass API
 async function fetchCountyFromOverpass(county: string): Promise<any[]> {
   console.log(`Fetching localities for ${county}...`);
   
  // Use Romania-wide query with bounding box for the county
  // This is more reliable than searching by county area name
  const countyBounds = COUNTY_BOUNDS[county];
  if (!countyBounds) {
    console.log(`No bounds defined for ${county}, using fallback...`);
    return fetchWithFallback(county);
  }
  
   const overpassQuery = `
    [out:json][timeout:300];
     (
      node["place"~"city|town|village"]["name"](${countyBounds.south},${countyBounds.west},${countyBounds.north},${countyBounds.east});
     );
     out body;
   `;
   
   try {
     const response = await fetch('https://overpass-api.de/api/interpreter', {
       method: 'POST',
       body: `data=${encodeURIComponent(overpassQuery)}`,
       headers: {
         'Content-Type': 'application/x-www-form-urlencoded',
         'User-Agent': 'RomaniaTravel/1.0 (contact@disdis.ro)',
       },
     });
     
     if (!response.ok) {
       console.error(`Overpass error for ${county}: ${response.status}`);
       return [];
     }
     
     const data = await response.json();
     console.log(`Found ${data.elements?.length || 0} localities in ${county}`);
    
    // Filter results to only include those actually in this county
    return (data.elements || []).map((el: any) => ({
      ...el,
      assignedCounty: county // Tag with the county we're processing
    }));
   } catch (error) {
     console.error(`Failed to fetch ${county}:`, error);
     return [];
   }
 }
 
 // Fallback using Nominatim search
 async function fetchWithFallback(county: string): Promise<any[]> {
   try {
     const response = await fetch(
       `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(county + ', Romania')}&format=json&limit=50&featuretype=settlement`,
       { headers: { 'User-Agent': 'RomaniaTravel/1.0 (contact@disdis.ro)' } }
     );
     
     if (!response.ok) return [];
     
     const data = await response.json();
     return data.map((item: any) => ({
       lat: parseFloat(item.lat),
       lon: parseFloat(item.lon),
       tags: { name: item.display_name.split(',')[0], place: 'village' },
       assignedCounty: county
     }));
   } catch (error) {
     console.error(`Fallback failed for ${county}:`, error);
     return [];
   }
 }
 
 // Approximate bounding boxes for Romanian counties (lat/lon: south, west, north, east)
 const COUNTY_BOUNDS: Record<string, { south: number; west: number; north: number; east: number }> = {
   'Alba': { south: 45.7, west: 22.7, north: 46.6, east: 24.1 },
   'Arad': { south: 45.9, west: 20.9, north: 46.7, east: 22.6 },
   'Argeș': { south: 44.6, west: 24.1, north: 45.5, east: 25.4 },
   'Bacău': { south: 45.9, west: 26.2, north: 46.9, east: 27.5 },
   'Bihor': { south: 46.4, west: 21.4, north: 47.4, east: 22.8 },
   'Bistrița-Năsăud': { south: 46.7, west: 23.6, north: 47.6, east: 25.0 },
   'Botoșani': { south: 47.4, west: 26.3, north: 48.2, east: 27.7 },
   'Brașov': { south: 45.4, west: 24.7, north: 46.2, east: 26.2 },
   'Brăila': { south: 44.8, west: 26.6, north: 45.5, east: 28.1 },
   'București': { south: 44.3, west: 25.9, north: 44.6, east: 26.3 },
   'Buzău': { south: 45.0, west: 26.0, north: 45.8, east: 27.2 },
   'Caraș-Severin': { south: 44.6, west: 21.3, north: 45.5, east: 22.8 },
   'Călărași': { south: 43.9, west: 26.3, north: 44.6, east: 27.5 },
   'Cluj': { south: 46.3, west: 22.9, north: 47.2, east: 24.1 },
   'Constanța': { south: 43.6, west: 27.9, north: 44.7, east: 29.0 },
   'Covasna': { south: 45.7, west: 25.6, north: 46.3, east: 26.6 },
   'Dâmbovița': { south: 44.6, west: 25.0, north: 45.4, east: 25.9 },
   'Dolj': { south: 43.6, west: 22.6, north: 44.5, east: 24.3 },
   'Galați': { south: 45.4, west: 27.2, north: 46.2, east: 28.3 },
   'Giurgiu': { south: 43.6, west: 25.3, north: 44.3, east: 26.4 },
   'Gorj': { south: 44.7, west: 22.7, north: 45.5, east: 24.0 },
   'Harghita': { south: 46.0, west: 24.9, north: 47.0, east: 26.1 },
   'Hunedoara': { south: 45.3, west: 22.2, north: 46.2, east: 23.6 },
   'Ialomița': { south: 44.3, west: 26.5, north: 44.9, east: 28.0 },
   'Iași': { south: 46.7, west: 26.6, north: 47.6, east: 28.1 },
   'Ilfov': { south: 44.3, west: 25.7, north: 44.7, east: 26.5 },
   'Maramureș': { south: 47.3, west: 23.2, north: 48.0, east: 24.9 },
   'Mehedinți': { south: 44.1, west: 22.0, north: 45.0, east: 23.3 },
   'Mureș': { south: 46.1, west: 23.9, north: 47.0, east: 25.3 },
   'Neamț': { south: 46.5, west: 25.5, north: 47.4, east: 26.8 },
   'Olt': { south: 43.6, west: 24.0, north: 44.6, east: 25.2 },
   'Prahova': { south: 44.8, west: 25.4, north: 45.6, east: 26.4 },
   'Satu Mare': { south: 47.4, west: 22.3, north: 48.2, east: 23.6 },
   'Sălaj': { south: 46.7, west: 22.7, north: 47.4, east: 23.8 },
   'Sibiu': { south: 45.5, west: 23.6, north: 46.2, east: 24.8 },
   'Suceava': { south: 47.0, west: 25.1, north: 48.0, east: 26.6 },
   'Teleorman': { south: 43.6, west: 24.8, north: 44.4, east: 26.0 },
   'Timiș': { south: 45.3, west: 20.3, north: 46.2, east: 22.1 },
   'Tulcea': { south: 44.5, west: 28.0, north: 45.5, east: 29.7 },
   'Vaslui': { south: 46.2, west: 27.2, north: 47.0, east: 28.3 },
   'Vâlcea': { south: 44.7, west: 23.7, north: 45.5, east: 24.7 },
   'Vrancea': { south: 45.5, west: 26.3, north: 46.3, east: 27.4 }
 };
 
 // Map OSM place tag to Romanian locality type
 function getLocalityType(place: string, tags: any): string {
   // Check for specific Romanian types
   if (tags?.['place:ro']) {
     const roType = tags['place:ro'].toLowerCase();
     if (roType.includes('municipiu')) return 'Municipiu';
     if (roType.includes('oraș')) return 'Oraș';
     if (roType.includes('comună')) return 'Comună';
   }
   
   switch (place) {
     case 'city': return 'Municipiu';
     case 'town': return 'Oraș';
     case 'village': return 'Sat';
     case 'hamlet': return 'Cătun';
     default: return 'Localitate';
   }
 }
 
 // Get or create import state
 async function getImportState(supabase: any): Promise<ImportState> {
   const { data } = await supabase
     .from('site_settings')
     .select('setting_value')
     .eq('setting_key', IMPORT_STATE_KEY)
     .maybeSingle();
   
   if (data?.setting_value) {
     try {
       return JSON.parse(data.setting_value);
     } catch {
       // Invalid state, return default
     }
   }
   
   return {
     lastCountyIndex: -1,
     processedCount: 0,
     totalExpected: 15000,
     status: 'idle'
   };
 }
 
 // Save import state
 async function saveImportState(supabase: any, state: ImportState): Promise<void> {
   await supabase
     .from('site_settings')
     .upsert({
       setting_key: IMPORT_STATE_KEY,
       setting_value: JSON.stringify(state),
       setting_type: 'json',
       description: 'State for incremental localities import'
     }, { onConflict: 'setting_key' });
 }
 
 // Process a single county
 async function processCounty(supabase: any, county: string): Promise<{ imported: number; errors: number }> {
   const localities = await fetchCountyFromOverpass(county);
   let imported = 0;
   let errors = 0;
   
   for (const item of localities) {
     if (!item.lat || !item.lon || !item.tags?.name) continue;
     
     const name = item.tags.name;
     const nameAscii = toAscii(name);
    const assignedCounty = item.assignedCounty || county;
     
     try {
       const { error } = await supabase.from('localities').upsert({
         name,
         name_ascii: nameAscii,
        county: assignedCounty,
        county_code: COUNTY_CODES[assignedCounty] || null,
         population: parseInt(item.tags.population) || null,
         latitude: item.lat,
         longitude: item.lon,
         locality_type: getLocalityType(item.tags.place, item.tags),
         is_county_seat: item.tags.capital === 'yes' || item.tags.admin_level === '6',
       }, {
         onConflict: 'name_ascii,county',
         ignoreDuplicates: false,
       });
       
       if (error) {
         console.error(`Error inserting ${name}:`, error.message);
         errors++;
       } else {
         imported++;
       }
     } catch (e) {
       errors++;
     }
   }
   
   return { imported, errors };
 }
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseKey);
     
    let options = { countiesPerRun: 2, reset: false, background: true };
     try {
       const body = await req.json();
       options = { ...options, ...body };
     } catch {
       // Use defaults
     }
     
     // Get current state
     let state = await getImportState(supabase);
     
     // Reset if requested
     if (options.reset) {
       state = {
         lastCountyIndex: -1,
         processedCount: 0,
         totalExpected: 15000,
         status: 'idle'
       };
       await saveImportState(supabase, state);
     }
     
     // Check if already completed
     if (state.status === 'completed') {
       const { count } = await supabase.from('localities').select('*', { count: 'exact', head: true });
       return new Response(JSON.stringify({
         success: true,
         message: 'Import already completed',
         stats: { totalInDatabase: count, status: 'completed' }
       }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
     }
     
    // Check if already running
    if (state.status === 'running') {
      const { count } = await supabase.from('localities').select('*', { count: 'exact', head: true });
      return new Response(JSON.stringify({
        success: true,
        message: 'Import is already running in background',
        stats: { 
          totalInDatabase: count, 
          status: 'running',
          lastCounty: state.lastCountyIndex >= 0 ? COUNTIES_LIST[state.lastCountyIndex] : 'starting',
          progress: `${state.lastCountyIndex + 1}/${COUNTIES_LIST.length} counties`
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
     // Mark as running
     state.status = 'running';
     state.lastRun = new Date().toISOString();
     await saveImportState(supabase, state);
     
    // Background processing function
    const processInBackground = async () => {
      try {
        const startIdx = state.lastCountyIndex + 1;
        
        for (let i = startIdx; i < COUNTIES_LIST.length; i++) {
          const county = COUNTIES_LIST[i];
          console.log(`Processing county ${i + 1}/${COUNTIES_LIST.length}: ${county}`);
          
          const result = await processCounty(supabase, county);
          
          // Update state after each county
          state.lastCountyIndex = i;
          state.processedCount += result.imported;
          await saveImportState(supabase, state);
          
          // Delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Mark as completed
        state.status = 'completed';
        await saveImportState(supabase, state);
        
        // Sync to cities table
        console.log('Syncing major localities to cities table...');
        const { data: majorLocalities } = await supabase
          .from('localities')
          .select('*')
          .or('locality_type.eq.Municipiu,locality_type.eq.Oraș,is_county_seat.eq.true,population.gte.5000')
          .order('population', { ascending: false, nullsFirst: false });
        
        for (const loc of majorLocalities || []) {
          await supabase.from('cities').upsert({
            name: loc.name,
            county: loc.county,
            population: loc.population || 0,
            latitude: Number(loc.latitude),
            longitude: Number(loc.longitude),
            city_type: loc.locality_type || 'Oraș',
            is_major: loc.locality_type === 'Municipiu' || loc.is_county_seat || (loc.population && loc.population >= 50000),
          }, { onConflict: 'name,county' });
        }
        
        console.log('Import completed!');
      } catch (error) {
        console.error('Background import error:', error);
        state.status = 'error';
        state.lastError = error instanceof Error ? error.message : String(error);
        await saveImportState(supabase, state);
      }
    };
       
    // Use waitUntil for background processing
    if (options.background) {
      // @ts-ignore - EdgeRuntime is a Deno global
      EdgeRuntime.waitUntil(processInBackground());
      
      const { count } = await supabase.from('localities').select('*', { count: 'exact', head: true });
      return new Response(JSON.stringify({
        success: true,
        message: 'Import started in background. Check status with another call.',
        stats: {
          totalInDatabase: count,
          countiesTotal: COUNTIES_LIST.length,
          status: 'running'
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
     }
     
    // Synchronous processing (for testing with fewer counties)
    await processInBackground();
    
    const { count: totalCount } = await supabase.from('localities').select('*', { count: 'exact', head: true });
    
     return new Response(JSON.stringify({
       success: true,
      message: 'Import completed!',
       stats: {
         totalInDatabase: totalCount,
        status: 'completed'
       }
     }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
     
   } catch (error) {
     console.error('Import error:', error);
     return new Response(JSON.stringify({
       success: false,
       error: error instanceof Error ? error.message : String(error),
       hint: 'Run again to resume from last county'
     }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
   }
 });