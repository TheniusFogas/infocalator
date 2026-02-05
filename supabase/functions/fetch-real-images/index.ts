 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
 const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
 
 interface ImageResult {
   url: string;
   source: 'wikimedia' | 'osm' | 'placeholder';
   attribution?: string;
   width?: number;
   height?: number;
 }
 
 // Search Wikimedia Commons for images
 async function searchWikimedia(query: string, limit: number = 5): Promise<ImageResult[]> {
   const results: ImageResult[] = [];
   
   try {
     // First search for relevant files
     const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' Romania')}&srnamespace=6&srlimit=${limit}&format=json&origin=*`;
     const searchRes = await fetch(searchUrl, {
       headers: { 'User-Agent': 'RomaniaTravel/1.0 (contact@disdis.ro)' }
     });
     
     if (!searchRes.ok) return results;
     const searchData = await searchRes.json();
     
     const titles = searchData.query?.search?.map((s: any) => s.title) || [];
     if (titles.length === 0) return results;
     
     // Get image info for found files
     const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.join('|'))}&prop=imageinfo&iiprop=url|size|extmetadata&format=json&origin=*`;
     const infoRes = await fetch(infoUrl, {
       headers: { 'User-Agent': 'RomaniaTravel/1.0 (contact@disdis.ro)' }
     });
     
     if (!infoRes.ok) return results;
     const infoData = await infoRes.json();
     
     const pages = infoData.query?.pages || {};
     for (const pageId of Object.keys(pages)) {
       const page = pages[pageId];
       const imageInfo = page.imageinfo?.[0];
       if (imageInfo?.url) {
         // Get thumbnail URL (640px width)
         const thumbUrl = imageInfo.url.replace('/commons/', '/commons/thumb/') + '/640px-' + page.title.replace('File:', '');
         const finalUrl = thumbUrl.endsWith('.svg') ? thumbUrl + '.png' : thumbUrl;
         
         results.push({
           url: finalUrl.includes('thumb') ? finalUrl : imageInfo.url,
           source: 'wikimedia',
           attribution: imageInfo.extmetadata?.Artist?.value || 'Wikimedia Commons',
           width: imageInfo.width,
           height: imageInfo.height
         });
       }
     }
   } catch (error) {
     console.error('Wikimedia search error:', error);
   }
   
   return results;
 }
 
 // Search OpenStreetMap/Mapillary for images (placeholder for now - OSM doesn't have direct image API)
 async function searchOSM(lat: number, lng: number): Promise<ImageResult[]> {
   // OSM doesn't have a direct image API, but we could integrate Mapillary in the future
   // For now return empty - Wikimedia is primary source
   return [];
 }
 
 // Wikidata search for location images
 async function searchWikidata(locationName: string): Promise<ImageResult[]> {
   const results: ImageResult[] = [];
   
   try {
     // Search Wikidata for the location
     const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(locationName)}&language=ro&format=json&origin=*`;
     const searchRes = await fetch(searchUrl, {
       headers: { 'User-Agent': 'RomaniaTravel/1.0 (contact@disdis.ro)' }
     });
     
     if (!searchRes.ok) return results;
     const searchData = await searchRes.json();
     
     const entityId = searchData.search?.[0]?.id;
     if (!entityId) return results;
     
     // Get entity details including image (P18)
     const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=claims&format=json&origin=*`;
     const entityRes = await fetch(entityUrl, {
       headers: { 'User-Agent': 'RomaniaTravel/1.0 (contact@disdis.ro)' }
     });
     
     if (!entityRes.ok) return results;
     const entityData = await entityRes.json();
     
     const entity = entityData.entities?.[entityId];
     const imageClaim = entity?.claims?.P18?.[0];
     
     if (imageClaim?.mainsnak?.datavalue?.value) {
       const imageName = imageClaim.mainsnak.datavalue.value;
       const encodedName = encodeURIComponent(imageName.replace(/ /g, '_'));
       const hash = await md5Hash(imageName.replace(/ /g, '_'));
       const imageUrl = `https://upload.wikimedia.org/wikipedia/commons/thumb/${hash[0]}/${hash[0]}${hash[1]}/${encodedName}/640px-${encodedName}`;
       
       results.push({
         url: imageUrl,
         source: 'wikimedia',
         attribution: 'Wikidata/Wikimedia Commons'
       });
     }
   } catch (error) {
     console.error('Wikidata search error:', error);
   }
   
   return results;
 }
 
 // Simple MD5 hash for Wikimedia URLs (first 2 chars)
 async function md5Hash(str: string): Promise<string> {
   const encoder = new TextEncoder();
   const data = encoder.encode(str);
   const hashBuffer = await crypto.subtle.digest('MD5', data).catch(() => null);
   
   if (!hashBuffer) {
     // Fallback for when MD5 isn't available
     let hash = 0;
     for (let i = 0; i < str.length; i++) {
       const char = str.charCodeAt(i);
       hash = ((hash << 5) - hash) + char;
       hash = hash & hash;
     }
     const hex = Math.abs(hash).toString(16).padStart(2, '0');
     return hex;
   }
   
   const hashArray = Array.from(new Uint8Array(hashBuffer));
   return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
 }
 
 interface FetchRequest {
   type: 'attraction' | 'locality' | 'accommodation' | 'event';
   name: string;
   location?: string;
   county?: string;
   latitude?: number;
   longitude?: number;
   slug?: string;
 }
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const body: FetchRequest = await req.json();
     const { type, name, location, county, latitude, longitude, slug } = body;
     
     console.log(`Fetching images for ${type}: ${name} (${location})`);
     
     const images: ImageResult[] = [];
     
     // Build search query based on type
     let searchQuery = name;
     if (location && location !== name) {
       searchQuery += ` ${location}`;
     }
     if (county) {
       searchQuery += ` ${county}`;
     }
     
     // Try Wikidata first for authoritative images
     const wikidataImages = await searchWikidata(name);
     images.push(...wikidataImages);
     
     // Then search Wikimedia Commons
     if (images.length < 3) {
       const wikimediaImages = await searchWikimedia(searchQuery, 5 - images.length);
       images.push(...wikimediaImages);
     }
     
     // OSM/Mapillary as fallback
     if (images.length === 0 && latitude && longitude) {
       const osmImages = await searchOSM(latitude, longitude);
       images.push(...osmImages);
     }
     
     // Store images in database if we have any
     if (images.length > 0 && slug) {
       const imageData = images.map((img, idx) => ({
         url: img.url,
         alt: `${name} - imagine ${idx + 1}`,
         type: idx === 0 ? 'main' : 'gallery',
         source: img.source,
         attribution: img.attribution
       }));
       
       // Update the appropriate cache table
       const tableName = type === 'attraction' ? 'cached_attractions' 
                       : type === 'accommodation' ? 'cached_accommodations'
                       : type === 'event' ? 'cached_events'
                       : null;
       
       if (tableName && slug && location) {
         await supabase.from(tableName).update({
           images: imageData,
           image_keywords: images[0]?.url // Store main image URL
         }).eq('slug', slug).ilike('location', `%${location}%`);
       }
     }
     
     return new Response(JSON.stringify({
       success: true,
       images,
       count: images.length
     }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' }
     });
     
   } catch (error) {
     console.error('Error fetching images:', error);
     return new Response(JSON.stringify({
       success: false,
       error: error instanceof Error ? error.message : 'Failed to fetch images',
       images: []
     }), {
       status: 500,
       headers: { ...corsHeaders, 'Content-Type': 'application/json' }
     });
   }
 });