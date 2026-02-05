 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 // Romanian counties with codes
 const COUNTIES: Record<string, string> = {
   'AB': 'Alba', 'AR': 'Arad', 'AG': 'Argeș', 'BC': 'Bacău', 'BH': 'Bihor',
   'BN': 'Bistrița-Năsăud', 'BT': 'Botoșani', 'BR': 'Brăila', 'BV': 'Brașov',
   'B': 'București', 'BZ': 'Buzău', 'CL': 'Călărași', 'CS': 'Caraș-Severin',
   'CJ': 'Cluj', 'CT': 'Constanța', 'CV': 'Covasna', 'DB': 'Dâmbovița',
   'DJ': 'Dolj', 'GL': 'Galați', 'GR': 'Giurgiu', 'GJ': 'Gorj', 'HR': 'Harghita',
   'HD': 'Hunedoara', 'IL': 'Ialomița', 'IS': 'Iași', 'IF': 'Ilfov',
   'MM': 'Maramureș', 'MH': 'Mehedinți', 'MS': 'Mureș', 'NT': 'Neamț',
   'OT': 'Olt', 'PH': 'Prahova', 'SJ': 'Sălaj', 'SM': 'Satu Mare', 'SB': 'Sibiu',
   'SV': 'Suceava', 'TR': 'Teleorman', 'TM': 'Timiș', 'TL': 'Tulcea',
   'VL': 'Vâlcea', 'VS': 'Vaslui', 'VN': 'Vrancea'
 };
 
 interface GeoNamesCity {
   geonameId: number;
   name: string;
   asciiName: string;
   lat: string;
   lng: string;
   population: number;
   adminCode1: string;
   fcode: string; // PPLA, PPLA2, PPL, PPLC, etc.
 }
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
 
     // Authentication check - ADMIN ONLY
     const authHeader = req.headers.get('Authorization');
     if (!authHeader) {
       console.log('Import localities rejected: No authorization header');
       return new Response(
         JSON.stringify({ success: false, error: 'Autentificare necesară' }),
         { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const authClient = createClient(supabaseUrl, supabaseAnonKey, {
       global: { headers: { Authorization: authHeader } }
     });
 
     const { data: { user }, error: authError } = await authClient.auth.getUser();
     if (authError || !user) {
       console.log('Import localities rejected: Invalid user', authError?.message);
       return new Response(
         JSON.stringify({ success: false, error: 'Autentificare invalidă' }),
         { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Check if user is admin
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
     const { data: adminUser } = await supabase
       .from('admin_users')
       .select('role')
       .eq('user_id', user.id)
       .single();
 
     if (!adminUser) {
       console.log(`Import localities rejected: User ${user.id} is not admin`);
       return new Response(
         JSON.stringify({ success: false, error: 'Acces permis doar pentru administratori' }),
         { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     console.log(`Import localities started by admin: ${user.id}`);
     console.log('Starting localities import from GeoNames...');
 
     // Fetch Romanian cities from GeoNames
     // Using the public GeoNames search API (limited but free)
     const results: any[] = [];
     
     // Fetch major cities first
     for (const [code, countyName] of Object.entries(COUNTIES)) {
       console.log(`Fetching cities for ${countyName}...`);
       
       try {
         const response = await fetch(
           `http://api.geonames.org/searchJSON?` +
           `country=RO&adminCode1=${code}&` +
           `featureClass=P&` +
           `maxRows=100&` +
           `username=demo`, // Note: In production, use your own GeoNames username
           { headers: { 'Accept': 'application/json' } }
         );
         
         if (response.ok) {
           const data = await response.json();
           if (data.geonames) {
             for (const city of data.geonames) {
               // Determine locality type based on feature code
               let localityType = 'sat';
               if (city.fcode === 'PPLC') localityType = 'municipiu'; // Capital
               else if (city.fcode === 'PPLA') localityType = 'municipiu'; // Admin center
               else if (city.fcode === 'PPLA2') localityType = 'oras'; // Admin subdivision
               else if (city.population > 100000) localityType = 'municipiu';
               else if (city.population > 10000) localityType = 'oras';
               else if (city.population > 1000) localityType = 'comuna';
               
               results.push({
                 geoname_id: city.geonameId,
                 name: city.name,
                 name_ascii: city.asciiName || city.name,
                 county: countyName,
                 county_code: code,
                 locality_type: localityType,
                 population: city.population || 0,
                 latitude: parseFloat(city.lat),
                 longitude: parseFloat(city.lng),
                 is_county_seat: city.fcode === 'PPLA' || city.fcode === 'PPLC'
               });
             }
           }
         }
         
         // Rate limiting - GeoNames has limits
         await new Promise(resolve => setTimeout(resolve, 100));
       } catch (e) {
         console.error(`Error fetching ${countyName}:`, e);
       }
     }
 
     console.log(`Fetched ${results.length} localities`);
 
     // Upsert to database in batches
     const batchSize = 100;
     let inserted = 0;
     
     for (let i = 0; i < results.length; i += batchSize) {
       const batch = results.slice(i, i + batchSize);
       
       const { error } = await supabase
         .from('localities')
         .upsert(batch, { onConflict: 'geoname_id' });
       
       if (error) {
         console.error('Batch insert error:', error);
       } else {
         inserted += batch.length;
       }
     }
 
     console.log(`Successfully imported ${inserted} localities`);
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         message: `Imported ${inserted} localities from ${Object.keys(COUNTIES).length} counties`,
         total: results.length
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error) {
     console.error('Error importing localities:', error);
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     return new Response(
       JSON.stringify({ success: false, error: errorMessage }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });