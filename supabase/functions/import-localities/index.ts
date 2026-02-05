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
 
 // Fetch all Romanian localities from OpenStreetMap via Overpass API
 async function fetchFromOverpass(): Promise<any[]> {
   console.log('Fetching ALL Romanian localities from OpenStreetMap...');
   
   // Query for all populated places in Romania
   const overpassQuery = `
     [out:json][timeout:600];
     area["ISO3166-1"="RO"]->.romania;
     (
       node["place"~"city|town|village|hamlet|isolated_dwelling"]["name"](area.romania);
     );
     out body;
   `;
   
   const response = await fetch('https://overpass-api.de/api/interpreter', {
     method: 'POST',
     body: `data=${encodeURIComponent(overpassQuery)}`,
     headers: {
       'Content-Type': 'application/x-www-form-urlencoded',
       'User-Agent': 'RomaniaTravel/1.0 (contact@disdis.ro)',
     },
   });
   
   if (!response.ok) {
     throw new Error(`Overpass API error: ${response.status}`);
   }
   
   const data = await response.json();
   console.log(`Fetched ${data.elements?.length || 0} localities from OpenStreetMap`);
   
   return data.elements || [];
 }
 
 // Map OSM place tag to Romanian locality type
 function getLocalityType(place: string): string {
   switch (place) {
     case 'city': return 'Municipiu';
     case 'town': return 'Oraș';
     case 'village': return 'Sat';
     case 'hamlet': return 'Cătun';
     case 'isolated_dwelling': return 'Așezare';
     default: return 'Localitate';
   }
 }
 
 // Extract county from OSM tags
 function extractCounty(tags: any): string {
   // Try different tag formats
   const countyTag = tags['addr:county'] || 
                     tags['is_in:county'] || 
                     tags['is_in'] || '';
   
   // Clean up county name
   let county = countyTag
     .replace(' County', '')
     .replace('Județul ', '')
     .replace('judetul ', '')
     .trim();
   
   // Try to match with known counties
   if (COUNTY_CODES[county]) {
     return county;
   }
   
   // Try ASCII match
   const countyAscii = toAscii(county);
   for (const [name] of Object.entries(COUNTY_CODES)) {
     if (toAscii(name) === countyAscii) {
       return name;
     }
   }
   
   return county || 'Necunoscut';
 }
 
 // Determine county from coordinates using reverse geocoding
 async function getCountyFromCoords(lat: number, lon: number): Promise<string> {
   try {
     const response = await fetch(
       `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=8`,
       { headers: { 'User-Agent': 'RomaniaTravel/1.0 (contact@disdis.ro)' } }
     );
     
     if (!response.ok) return 'Necunoscut';
     
     const data = await response.json();
     const county = data.address?.county || data.address?.state || '';
     
     return county.replace(' County', '').replace('Județul ', '').trim();
   } catch {
     return 'Necunoscut';
   }
 }
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseKey);
     
     // Get request options
     let options = { batchSize: 100, skipExisting: true, limit: 0 };
     try {
       const body = await req.json();
       options = { ...options, ...body };
     } catch {
       // Use defaults
     }
     
     console.log('Starting comprehensive locality import from OpenStreetMap...');
     console.log('Options:', options);
     
     // Fetch all localities from OpenStreetMap
     const osmData = await fetchFromOverpass();
     
     if (osmData.length === 0) {
       throw new Error('No data received from OpenStreetMap');
     }
     
     // Process and transform OSM data
     let localities = osmData
       .filter((item: any) => item.lat && item.lon && item.tags?.name)
       .map((item: any) => {
         const name = item.tags.name;
         const county = extractCounty(item.tags);
         
         return {
           name,
           name_ascii: toAscii(name),
           county,
           county_code: COUNTY_CODES[county] || null,
           population: parseInt(item.tags.population) || null,
           latitude: item.lat,
           longitude: item.lon,
           locality_type: getLocalityType(item.tags.place),
           is_county_seat: item.tags.capital === 'yes' || item.tags.admin_level === '6',
         };
       });
     
     console.log(`Processed ${localities.length} localities`);
     
     // Deduplicate by name + county
     const seen = new Set<string>();
     localities = localities.filter((loc: any) => {
       const key = `${loc.name_ascii}-${toAscii(loc.county)}`;
       if (seen.has(key)) return false;
       seen.add(key);
       return true;
     });
     
     console.log(`${localities.length} unique localities after deduplication`);
     
     // Apply limit if specified
     if (options.limit > 0) {
       localities = localities.slice(0, options.limit);
       console.log(`Limited to ${localities.length} localities`);
     }
     
     // Import in batches
     const BATCH_SIZE = options.batchSize;
     let imported = 0;
     let updated = 0;
     let skipped = 0;
     let errors = 0;
     
     for (let i = 0; i < localities.length; i += BATCH_SIZE) {
       const batch = localities.slice(i, i + BATCH_SIZE);
       
       for (const loc of batch) {
         try {
           if (options.skipExisting) {
             // Check if exists
             const { data: existing } = await supabase
               .from('localities')
               .select('id')
               .eq('name_ascii', loc.name_ascii)
               .eq('county', loc.county)
               .maybeSingle();
             
             if (existing) {
               skipped++;
               continue;
             }
           }
           
           // Upsert locality
           const { error } = await supabase
             .from('localities')
             .upsert({
               name: loc.name,
               name_ascii: loc.name_ascii,
               county: loc.county,
               county_code: loc.county_code,
               population: loc.population,
               latitude: loc.latitude,
               longitude: loc.longitude,
               locality_type: loc.locality_type,
               is_county_seat: loc.is_county_seat,
             }, {
               onConflict: 'name_ascii,county',
               ignoreDuplicates: false,
             });
           
           if (error) {
             // Try insert if upsert fails
             const { error: insertError } = await supabase
               .from('localities')
               .insert({
                 name: loc.name,
                 name_ascii: loc.name_ascii,
                 county: loc.county,
                 county_code: loc.county_code,
                 population: loc.population,
                 latitude: loc.latitude,
                 longitude: loc.longitude,
                 locality_type: loc.locality_type,
                 is_county_seat: loc.is_county_seat,
               });
             
             if (insertError) {
               console.error(`Error inserting ${loc.name}:`, insertError.message);
               errors++;
             } else {
               imported++;
             }
           } else {
             imported++;
           }
         } catch (e) {
           console.error(`Error processing ${loc.name}:`, e);
           errors++;
         }
       }
       
       const progress = Math.round((i / localities.length) * 100);
       console.log(`Progress: ${progress}% (${i}/${localities.length})`);
     }
     
     // Get final count
     const { count: totalCount } = await supabase
       .from('localities')
       .select('*', { count: 'exact', head: true });
     
     // Also sync major cities to the cities table
     console.log('Syncing major localities to cities table...');
     
     const { data: majorLocalities } = await supabase
       .from('localities')
       .select('*')
       .or('locality_type.eq.Municipiu,locality_type.eq.Oraș,is_county_seat.eq.true,population.gte.5000')
       .order('population', { ascending: false, nullsFirst: false });
     
     let citiesSynced = 0;
     for (const loc of majorLocalities || []) {
       const { data: existingCity } = await supabase
         .from('cities')
         .select('id')
         .eq('name', loc.name)
         .eq('county', loc.county)
         .maybeSingle();
       
       const cityData = {
         name: loc.name,
         county: loc.county,
         population: loc.population || 0,
         latitude: Number(loc.latitude),
         longitude: Number(loc.longitude),
         city_type: loc.locality_type || 'Oraș',
         is_major: loc.locality_type === 'Municipiu' || loc.is_county_seat || (loc.population && loc.population >= 50000),
       };
       
       if (existingCity) {
         const { error } = await supabase
           .from('cities')
           .update(cityData)
           .eq('id', existingCity.id);
         if (!error) citiesSynced++;
       } else {
         const { error } = await supabase
           .from('cities')
           .insert(cityData);
         if (!error) citiesSynced++;
       }
     }
     
     console.log('Import completed!');
     
     return new Response(
       JSON.stringify({
         success: true,
         message: `Import completed successfully`,
         stats: {
           fetchedFromOSM: osmData.length,
           uniqueLocalities: localities.length,
           imported,
           updated,
           skipped,
           errors,
           totalInDatabase: totalCount,
           citiesSynced,
         },
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error) {
     console.error('Import error:', error);
     return new Response(
       JSON.stringify({ 
         success: false, 
        error: error instanceof Error ? error.message : String(error),
         hint: 'Try with smaller batchSize or limit parameters',
       }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });