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
   
   // More specific query for the county
   const overpassQuery = `
     [out:json][timeout:600];
      area["name"="${county}"]["admin_level"="6"]->.searchArea;
     (
        node["place"~"city|town|village|hamlet"]["name"](area.searchArea);
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
     return data.elements || [];
   } catch (error) {
     console.error(`Failed to fetch ${county}:`, error);
     return [];
   }
 }
 
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
     
     try {
       const { error } = await supabase.from('localities').upsert({
         name,
         name_ascii: nameAscii,
         county,
         county_code: COUNTY_CODES[county] || null,
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
     
     let options = { countiesPerRun: 3, reset: false };
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
     
     // Mark as running
     state.status = 'running';
     state.lastRun = new Date().toISOString();
     await saveImportState(supabase, state);
     
     // Process next batch of counties
     const startIdx = state.lastCountyIndex + 1;
     const endIdx = Math.min(startIdx + options.countiesPerRun, COUNTIES_LIST.length);
     
     let totalImported = 0;
     let totalErrors = 0;
     const processedCounties: string[] = [];
     
     for (let i = startIdx; i < endIdx; i++) {
       const county = COUNTIES_LIST[i];
       console.log(`Processing county ${i + 1}/${COUNTIES_LIST.length}: ${county}`);
       
       const result = await processCounty(supabase, county);
       totalImported += result.imported;
       totalErrors += result.errors;
       processedCounties.push(county);
       
       // Update state after each county
       state.lastCountyIndex = i;
       state.processedCount += result.imported;
       await saveImportState(supabase, state);
       
       // Small delay to avoid rate limits
       await new Promise(resolve => setTimeout(resolve, 1000));
     }
     
     // Check if completed
     const isCompleted = endIdx >= COUNTIES_LIST.length;
     state.status = isCompleted ? 'completed' : 'idle';
     await saveImportState(supabase, state);
     
     // Get current total
     const { count: totalCount } = await supabase.from('localities').select('*', { count: 'exact', head: true });
     
     // Sync to cities table if completed
     if (isCompleted) {
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
     }
     
     return new Response(JSON.stringify({
       success: true,
       message: isCompleted ? 'Import completed!' : `Processed ${processedCounties.length} counties. Run again to continue.`,
       stats: {
         processedCounties,
         countiesRemaining: COUNTIES_LIST.length - endIdx,
         importedThisRun: totalImported,
         errorsThisRun: totalErrors,
         totalInDatabase: totalCount,
         progress: `${endIdx}/${COUNTIES_LIST.length} counties`,
         status: state.status
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