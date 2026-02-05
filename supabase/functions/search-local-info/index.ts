 // AUTONOMOUS DATA SYSTEM - No AI dependency
 // Uses Wikipedia, Wikidata, OpenStreetMap for REAL data
 
 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
 const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
 
 const USER_AGENT = 'RomaniaTravel/1.0 (contact@disdis.ro)';
 const CACHE_HOURS = 6 * 30 * 24; // 6 months in hours
 
// Valid image extensions - exclude PDFs, videos, documents
const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  
  // Exclude PDFs and documents
  if (lowerUrl.includes('.pdf') || lowerUrl.includes('.doc') || lowerUrl.includes('.svg')) {
    return false;
  }
  
  // Exclude common bad patterns
  const badPatterns = [
    'monitorul_oficial', 'logo', 'icon', 'symbol', 'flag', 'coat_of_arms',
    'signature', 'autograph', 'stamp', 'diagram', 'chart', 'wikidata',
    'blason', 'stemă', 'emblem', 'banner', 'seal'
  ];
  
  for (const pattern of badPatterns) {
    if (lowerUrl.includes(pattern)) return false;
  }
  
  // Must have valid image extension or be a Wikimedia thumbnail
  const hasValidExtension = VALID_IMAGE_EXTENSIONS.some(ext => lowerUrl.includes(ext));
  const isWikimediaThumb = lowerUrl.includes('upload.wikimedia.org');
  
  return hasValidExtension || isWikimediaThumb;
}

 interface SearchRequest {
   query: string;
   type: 'events' | 'accommodations' | 'attractions' | 'traffic' | 'event-detail' | 'accommodation-detail' | 'attraction-detail' | 'restaurants';
   location: string;
   county?: string;
   slug?: string;
   latitude?: number;
   longitude?: number;
 }
 
 function generateSlug(text: string): string {
   return text
     .toLowerCase()
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '')
     .replace(/[^a-z0-9]+/g, '-')
     .replace(/^-+|-+$/g, '')
     .substring(0, 60);
 }
 
 // ===== WIKIPEDIA API =====
 async function fetchWikipediaContent(title: string, lang: string = 'ro'): Promise<{ extract: string; image?: string } | null> {
   try {
     const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
     const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
     if (!res.ok) return null;
     
     const data = await res.json();
     return {
       extract: data.extract || '',
       image: data.thumbnail?.source || data.originalimage?.source
     };
   } catch (e) {
     console.error('Wikipedia fetch error:', e);
     return null;
   }
 }
 
 async function searchWikipedia(query: string, lang: string = 'ro'): Promise<Array<{ title: string; description: string }>> {
   try {
     const url = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=10&format=json&origin=*`;
     const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
     if (!res.ok) return [];
     
     const data = await res.json();
     const titles = data[1] || [];
     const descriptions = data[2] || [];
     
     return titles.map((title: string, i: number) => ({
       title,
       description: descriptions[i] || ''
     }));
   } catch (e) {
     console.error('Wikipedia search error:', e);
     return [];
   }
 }
 
 // ===== WIKIMEDIA COMMONS =====
 async function fetchWikimediaImages(query: string, limit: number = 5): Promise<Array<{ url: string; title: string }>> {
   try {
    // Better search query - look for actual photos
    const cleanQuery = query.replace(/România|Romania/gi, '').trim();
    const searchTerms = `${cleanQuery} photograph -logo -map -diagram -coat -arms -blason`;
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerms + ' Romania')}&srnamespace=6&srlimit=${limit * 3}&format=json&origin=*`;
     const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });
     if (!searchRes.ok) return [];
     
     const searchData = await searchRes.json();
    const allTitles = searchData.query?.search?.map((s: any) => s.title) || [];
    
    // Filter out bad file names before API call
    const titles = allTitles.filter((t: string) => {
      const lower = t.toLowerCase();
      return !lower.includes('.pdf') && 
             !lower.includes('logo') && 
             !lower.includes('map') && 
             !lower.includes('coat_of_arms') &&
             !lower.includes('monitorul') &&
             !lower.includes('blason') &&
             !lower.includes('stemă');
    });
     
    if (titles.length === 0) return [];
    
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.slice(0, 10).join('|'))}&prop=imageinfo&iiprop=url|mime&iiurlwidth=640&format=json&origin=*`;
     const infoRes = await fetch(infoUrl, { headers: { 'User-Agent': USER_AGENT } });
     if (!infoRes.ok) return [];
     
     const infoData = await infoRes.json();
     const pages = infoData.query?.pages || {};
     
     const images: Array<{ url: string; title: string }> = [];
     for (const pageId of Object.keys(pages)) {
       const page = pages[pageId];
      const imageInfo = page?.imageinfo?.[0];
      const thumbUrl = imageInfo?.thumburl;
      const mimeType = imageInfo?.mime || '';
      
      // Only accept actual images with valid URLs
      if (thumbUrl && mimeType.startsWith('image/') && isValidImageUrl(thumbUrl)) {
         images.push({ url: thumbUrl, title: page.title?.replace('File:', '') || '' });
       }
      
      if (images.length >= limit) break;
     }
     return images;
   } catch (e) {
     console.error('Wikimedia fetch error:', e);
     return [];
   }
 }
 
 // ===== WIKIDATA API =====
 async function fetchWikidataEntity(query: string): Promise<any | null> {
   try {
     const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=ro&format=json&origin=*`;
     const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });
     if (!searchRes.ok) return null;
     
     const searchData = await searchRes.json();
     const entityId = searchData.search?.[0]?.id;
     if (!entityId) return null;
     
     const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=claims|labels|descriptions&languages=ro|en&format=json&origin=*`;
     const entityRes = await fetch(entityUrl, { headers: { 'User-Agent': USER_AGENT } });
     if (!entityRes.ok) return null;
     
     const entityData = await entityRes.json();
     return entityData.entities?.[entityId] || null;
   } catch (e) {
     console.error('Wikidata fetch error:', e);
     return null;
   }
 }
 
 // ===== OPENSTREETMAP OVERPASS API =====
 async function fetchOSMPOIs(lat: number, lng: number, radius: number, types: string[]): Promise<any[]> {
   try {
     // Build Overpass query for POIs
     const typeFilters = types.map(t => `node["tourism"="${t}"](around:${radius},${lat},${lng});`).join('\n');
     const query = `
       [out:json][timeout:25];
       (
         ${typeFilters}
         node["amenity"="restaurant"](around:${radius},${lat},${lng});
         node["amenity"="hotel"](around:${radius},${lat},${lng});
         node["tourism"="attraction"](around:${radius},${lat},${lng});
         node["tourism"="museum"](around:${radius},${lat},${lng});
         node["historic"](around:${radius},${lat},${lng});
       );
       out body;
     `;
     
     const res = await fetch('https://overpass-api.de/api/interpreter', {
       method: 'POST',
       headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
       body: `data=${encodeURIComponent(query)}`
     });
     
     if (!res.ok) return [];
     const data = await res.json();
     return data.elements || [];
   } catch (e) {
     console.error('OSM Overpass error:', e);
     return [];
   }
 }
 
 // Get coordinates for a location
 async function getLocationCoords(location: string, county?: string): Promise<{ lat: number; lng: number } | null> {
   try {
     // First check our localities table
     const { data: locality } = await supabase
       .from('localities')
       .select('latitude, longitude')
       .ilike('name', `%${location}%`)
       .limit(1)
       .maybeSingle();
     
     if (locality?.latitude && locality?.longitude) {
       return { lat: locality.latitude, lng: locality.longitude };
     }
     
     // Fallback to Nominatim
     const query = county ? `${location}, ${county}, Romania` : `${location}, Romania`;
     const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
     const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
     if (!res.ok) return null;
     
     const data = await res.json();
     if (data.length > 0) {
       return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
     }
     return null;
   } catch (e) {
     console.error('Geocoding error:', e);
     return null;
   }
 }
 
 // ===== ATTRACTIONS from OSM + Wikipedia =====
 async function searchAttractions(location: string, county?: string) {
   // Check cache first
   const { data: cached } = await supabase
     .from('cached_attractions')
     .select('*')
     .ilike('location', `%${location}%`)
     .gt('expires_at', new Date().toISOString())
     .order('view_count', { ascending: false })
     .limit(12);
 
   if (cached && cached.length > 0) {
     return { success: true, data: { attractions: cached.map(a => ({
       title: a.title,
       slug: a.slug,
       category: a.category,
       description: a.description,
       location: a.location,
       tips: a.tips,
       imageKeywords: a.image_keywords,
       isPaid: a.is_paid,
       entryFee: a.entry_fee,
       openingHours: a.opening_hours,
       duration: a.duration
     })) }};
   }
 
   // Get coordinates
   const coords = await getLocationCoords(location, county);
   if (!coords) {
     // Fallback to Wikipedia search
     const wikiResults = await searchWikipedia(`${location} atracții turistice`);
     if (wikiResults.length === 0) {
       return { success: true, data: { attractions: [] } };
     }
     
     const attractions = wikiResults.slice(0, 8).map(r => ({
       title: r.title,
       slug: generateSlug(r.title),
       category: 'Atracție',
       description: r.description || 'Obiectiv turistic din România',
       location: location,
       tips: null,
       imageKeywords: r.title,
       isPaid: false,
       entryFee: null,
       openingHours: null,
       duration: null
     }));
     
     return { success: true, data: { attractions } };
   }
 
   // Fetch from OSM
   const osmPOIs = await fetchOSMPOIs(coords.lat, coords.lng, 15000, ['attraction', 'museum', 'viewpoint']);
   
   const attractions = [];
   const expiresAt = new Date(Date.now() + CACHE_HOURS * 60 * 60 * 1000).toISOString();
   
   for (const poi of osmPOIs.slice(0, 12)) {
     const name = poi.tags?.name;
     if (!name) continue;
     
     // Get category from OSM tags
     let category = 'Atracție';
     if (poi.tags?.tourism === 'museum') category = 'Muzeu';
     else if (poi.tags?.tourism === 'viewpoint') category = 'Panoramă';
     else if (poi.tags?.historic === 'castle') category = 'Castel';
     else if (poi.tags?.historic === 'church') category = 'Biserică';
     else if (poi.tags?.historic === 'monument') category = 'Monument';
     else if (poi.tags?.historic === 'ruins') category = 'Ruine';
     else if (poi.tags?.natural) category = 'Natură';
     
     const slug = generateSlug(name);
     
     // Try to get description from Wikipedia
     const wikiContent = await fetchWikipediaContent(name);
      
      // Prioritize Wikipedia thumbnail, then Wikimedia Commons search
      let bestImageUrl = '';
      if (wikiContent?.image && isValidImageUrl(wikiContent.image)) {
        bestImageUrl = wikiContent.image;
      } else {
        const images = await fetchWikimediaImages(name);
        if (images.length > 0) {
          bestImageUrl = images[0].url;
        }
      }
     
     const attraction = {
       title: name,
       slug,
       category,
       description: wikiContent?.extract?.substring(0, 300) || poi.tags?.description || `Obiectiv turistic în ${location}`,
       location: location,
       tips: poi.tags?.note || null,
        imageKeywords: bestImageUrl || name,
       isPaid: poi.tags?.fee === 'yes',
       entryFee: poi.tags?.charge || null,
       openingHours: poi.tags?.opening_hours || null,
       duration: null,
       latitude: poi.lat,
       longitude: poi.lon
     };
     
     attractions.push(attraction);
     
     // Cache in database
     await supabase.from('cached_attractions').upsert({
       slug,
       location,
       county: county || null,
       title: name,
       category,
       description: attraction.description,
       tips: attraction.tips,
       image_keywords: attraction.imageKeywords,
       is_paid: attraction.isPaid,
       entry_fee: attraction.entryFee,
       opening_hours: attraction.openingHours,
       latitude: poi.lat,
       longitude: poi.lon,
       expires_at: expiresAt,
       view_count: 0
     }, { onConflict: 'slug,location' });
   }
 
   // If OSM returned nothing, try Wikipedia
   if (attractions.length === 0) {
     const wikiResults = await searchWikipedia(`${location} obiective turistice`);
     for (const result of wikiResults.slice(0, 8)) {
       const wikiContent = await fetchWikipediaContent(result.title);
        
        // Prioritize Wikipedia thumbnail
        let imageUrl = '';
        if (wikiContent?.image && isValidImageUrl(wikiContent.image)) {
          imageUrl = wikiContent.image;
        } else {
          const images = await fetchWikimediaImages(result.title);
          if (images.length > 0) imageUrl = images[0].url;
        }
       
       attractions.push({
         title: result.title,
         slug: generateSlug(result.title),
         category: 'Atracție',
         description: wikiContent?.extract?.substring(0, 300) || result.description,
         location: location,
         tips: null,
          imageKeywords: imageUrl || result.title,
         isPaid: false,
         entryFee: null,
         openingHours: null,
         duration: null
       });
     }
   }
 
   return { success: true, data: { attractions } };
 }
 
 // ===== ATTRACTION DETAIL from Wikipedia =====
 async function getAttractionDetail(location: string, slug: string, county?: string) {
   // Check cache
   const { data: cached } = await supabase
     .from('cached_attractions')
     .select('*')
     .eq('slug', slug)
     .ilike('location', `%${location}%`)
     .maybeSingle();
 
   if (cached && cached.long_description) {
     // Increment views
     await supabase.from('cached_attractions')
       .update({ view_count: (cached.view_count || 0) + 1 })
       .eq('id', cached.id);
     
     return { success: true, data: { attraction: {
       title: cached.title,
       slug: cached.slug,
       category: cached.category,
       description: cached.description,
       longDescription: cached.long_description,
       history: cached.history,
       facts: cached.facts,
       location: cached.location,
       tips: cached.tips,
       imageKeywords: cached.image_keywords,
       isPaid: cached.is_paid,
       entryFee: cached.entry_fee,
       openingHours: cached.opening_hours,
       duration: cached.duration,
       bestTimeToVisit: cached.best_time_to_visit,
       facilities: cached.facilities,
       accessibility: cached.accessibility,
       nearbyAttractions: cached.nearby_attractions,
       coordinates: cached.latitude && cached.longitude ? { lat: cached.latitude, lng: cached.longitude } : null,
       viewCount: cached.view_count
     }}};
   }
 
   // Reconstruct title from slug
   const title = cached?.title || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
   
   // Fetch from Wikipedia
   const wikiContent = await fetchWikipediaContent(title);
   const wikiEntity = await fetchWikidataEntity(title);
   const images = await fetchWikimediaImages(title, 6);
   
   const expiresAt = new Date(Date.now() + CACHE_HOURS * 60 * 60 * 1000).toISOString();
   
   // Build facts from Wikidata if available
   const facts: string[] = [];
   if (wikiEntity?.claims) {
     // P31 = instance of
     // P131 = located in
     // P571 = inception date
     // etc.
   }
   
   // Get nearby attractions from OSM
   let nearbyAttractions: Array<{ name: string; distance: string }> = [];
   if (cached?.latitude && cached?.longitude) {
     const nearby = await fetchOSMPOIs(cached.latitude, cached.longitude, 5000, ['attraction', 'museum']);
     nearbyAttractions = nearby
       .filter(p => p.tags?.name && p.tags.name !== title)
       .slice(0, 5)
       .map(p => ({
         name: p.tags.name,
         distance: '< 5 km'
       }));
   }
   
   const longDescription = wikiContent?.extract || 'Informații detaliate vor fi disponibile în curând.';
   
   // Update cache with details
   if (cached) {
     await supabase.from('cached_attractions').update({
       long_description: longDescription,
       nearby_attractions: nearbyAttractions,
       image_keywords: images[0]?.url || cached.image_keywords,
       expires_at: expiresAt,
       view_count: (cached.view_count || 0) + 1
     }).eq('id', cached.id);
   }
 
   return { success: true, data: { attraction: {
     title,
     slug,
     category: cached?.category || 'Atracție',
     description: cached?.description || longDescription.substring(0, 200),
     longDescription,
     location,
     history: null,
     facts,
     tips: cached?.tips,
     imageKeywords: images[0]?.url || title,
     isPaid: cached?.is_paid || false,
     entryFee: cached?.entry_fee,
     openingHours: cached?.opening_hours,
     nearbyAttractions,
     coordinates: cached?.latitude && cached?.longitude ? { lat: cached.latitude, lng: cached.longitude } : null,
     viewCount: (cached?.view_count || 0) + 1
   }}};
 }
 
 // ===== ACCOMMODATIONS from OSM =====
 async function searchAccommodations(location: string, county?: string) {
   const { data: cached } = await supabase
     .from('cached_accommodations')
     .select('*')
     .ilike('location', `%${location}%`)
     .gt('expires_at', new Date().toISOString())
     .limit(10);
 
   if (cached && cached.length > 0) {
     return { success: true, data: { accommodations: cached.map(a => ({
       name: a.name,
       slug: a.slug,
       type: a.type,
       description: a.description,
       priceRange: a.price_range,
       rating: a.rating,
       reviewCount: a.review_count,
       amenities: a.amenities || [],
       city: a.location,
       imageKeywords: a.image_keywords,
       highlights: a.highlights
     })) }};
   }
 
   const coords = await getLocationCoords(location, county);
   if (!coords) {
     return { success: true, data: { accommodations: [] } };
   }
 
   // Fetch hotels/guesthouses from OSM
   const query = `
     [out:json][timeout:25];
     (
       node["tourism"="hotel"](around:10000,${coords.lat},${coords.lng});
       node["tourism"="guest_house"](around:10000,${coords.lat},${coords.lng});
       node["tourism"="motel"](around:10000,${coords.lat},${coords.lng});
       node["tourism"="hostel"](around:10000,${coords.lat},${coords.lng});
       node["tourism"="chalet"](around:10000,${coords.lat},${coords.lng});
       node["tourism"="apartment"](around:10000,${coords.lat},${coords.lng});
     );
     out body;
   `;
   
   try {
     const res = await fetch('https://overpass-api.de/api/interpreter', {
       method: 'POST',
       headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
       body: `data=${encodeURIComponent(query)}`
     });
     
     if (!res.ok) return { success: true, data: { accommodations: [] } };
     const data = await res.json();
     const elements = data.elements || [];
     
     const accommodations = [];
     const expiresAt = new Date(Date.now() + CACHE_HOURS * 60 * 60 * 1000).toISOString();
     
     for (const el of elements.slice(0, 10)) {
       const name = el.tags?.name;
       if (!name) continue;
       
       const typeMap: Record<string, string> = {
         hotel: 'Hotel',
         guest_house: 'Pensiune',
         motel: 'Motel',
         hostel: 'Hostel',
         chalet: 'Cabană',
         apartment: 'Apartament'
       };
       
       const type = typeMap[el.tags?.tourism] || 'Cazare';
       const slug = generateSlug(name);
       const stars = parseInt(el.tags?.stars) || null;
       
       const amenities: string[] = [];
       if (el.tags?.internet_access) amenities.push('WiFi');
       if (el.tags?.parking) amenities.push('Parcare');
       if (el.tags?.restaurant) amenities.push('Restaurant');
       if (el.tags?.pool) amenities.push('Piscină');
       
       const images = await fetchWikimediaImages(`${type} ${location}`);
       
       const accommodation = {
         name,
         slug,
         type,
         description: el.tags?.description || `${type} în ${location}`,
         priceRange: el.tags?.price || 'Contactați pentru preț',
         rating: null,
         reviewCount: null,
         amenities,
         city: location,
         imageKeywords: images[0]?.url || `${type} ${location}`,
         highlights: [],
         stars
       };
       
       accommodations.push(accommodation);
       
       // Cache
       await supabase.from('cached_accommodations').upsert({
         slug,
         location,
         county: county || null,
         name,
         type,
         description: accommodation.description,
         price_range: accommodation.priceRange,
         stars,
         amenities,
         image_keywords: accommodation.imageKeywords,
         latitude: el.lat,
         longitude: el.lon,
         expires_at: expiresAt
       }, { onConflict: 'slug,location' });
     }
     
     return { success: true, data: { accommodations } };
   } catch (e) {
     console.error('Accommodation search error:', e);
     return { success: true, data: { accommodations: [] } };
   }
 }
 
 // ===== ACCOMMODATION DETAIL =====
 async function getAccommodationDetail(location: string, slug: string, county?: string) {
   const { data: cached } = await supabase
     .from('cached_accommodations')
     .select('*')
     .eq('slug', slug)
     .ilike('location', `%${location}%`)
     .maybeSingle();
 
   if (cached) {
     const images = await fetchWikimediaImages(`${cached.type} ${location}`, 6);
     
     return { success: true, data: { accommodation: {
       name: cached.name,
       slug: cached.slug,
       type: cached.type,
       description: cached.description,
       longDescription: cached.long_description || cached.description,
       stars: cached.stars,
       rating: cached.rating,
       reviewCount: cached.review_count,
       priceRange: cached.price_range,
       amenities: cached.amenities || [],
       highlights: cached.highlights || [],
       city: cached.location,
       county: cached.county,
       address: cached.address,
       checkIn: cached.check_in || '14:00',
       checkOut: cached.check_out || '11:00',
       coordinates: cached.latitude && cached.longitude ? { lat: cached.latitude, lng: cached.longitude } : null,
       images: images.map((img, i) => ({ url: img.url, alt: `${cached.name} - ${i + 1}`, type: i === 0 ? 'main' : 'gallery' })),
       contact: cached.contact || {},
       policies: cached.policies || {},
       nearbyAttractions: cached.nearby_attractions || []
     }}};
   }
   
   // If not in cache, return minimal data
   const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
   return { success: true, data: { accommodation: {
     name: title,
     slug,
     type: 'Cazare',
     description: `Cazare în ${location}`,
     city: location
   }}};
 }
 
 // ===== EVENTS - Simplified, from public sources =====
 async function searchEvents(location: string, county?: string) {
   const { data: cached } = await supabase
     .from('cached_events')
     .select('*')
     .ilike('location', `%${location}%`)
     .gt('expires_at', new Date().toISOString())
     .or(`date.gt.${new Date().toISOString().split('T')[0]},date.is.null`)
     .limit(10);
 
   if (cached && cached.length > 0) {
     return { success: true, data: { events: cached.map(e => ({
       title: e.title,
       slug: e.slug,
       date: e.date,
       endDate: e.end_date,
       time: e.time,
       location: e.venue || location,
       city: e.location,
       description: e.description,
       category: e.category,
       isPaid: e.is_paid,
       ticketPrice: e.ticket_price,
       organizer: e.organizer,
       imageKeywords: e.image_keywords
     })) }};
   }
   
   // For events, we return empty if nothing cached
   // Events need to be added manually or from specific event APIs
   return { success: true, data: { events: [] } };
 }
 
 // ===== RESTAURANTS from OSM =====
 async function searchRestaurants(location: string, county?: string) {
   const coords = await getLocationCoords(location, county);
   if (!coords) {
     return { success: true, data: { restaurants: [] } };
   }
 
   const query = `
     [out:json][timeout:25];
     (
       node["amenity"="restaurant"](around:5000,${coords.lat},${coords.lng});
       node["amenity"="cafe"](around:5000,${coords.lat},${coords.lng});
       node["amenity"="fast_food"](around:5000,${coords.lat},${coords.lng});
     );
     out body;
   `;
   
   try {
     const res = await fetch('https://overpass-api.de/api/interpreter', {
       method: 'POST',
       headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
       body: `data=${encodeURIComponent(query)}`
     });
     
     if (!res.ok) return { success: true, data: { restaurants: [] } };
     const data = await res.json();
     const elements = data.elements || [];
     
     const restaurants = [];
     
     for (const el of elements.slice(0, 10)) {
       const name = el.tags?.name;
       if (!name) continue;
       
       const typeMap: Record<string, string> = {
         restaurant: 'Restaurant',
         cafe: 'Cafenea',
         fast_food: 'Fast Food'
       };
       
       const type = typeMap[el.tags?.amenity] || 'Restaurant';
       const slug = generateSlug(name);
       
       const cuisine = el.tags?.cuisine?.split(';').map((c: string) => c.trim()) || [];
       
       restaurants.push({
         name,
         slug,
         type,
         description: el.tags?.description || `${type} în ${location}`,
         priceRange: el.tags?.price || 'Contactați pentru preț',
         rating: null,
         cuisine,
         location: location,
         openingHours: el.tags?.opening_hours || null,
         imageKeywords: `${type} ${location}`,
         latitude: el.lat,
         longitude: el.lon
       });
     }
     
     return { success: true, data: { restaurants } };
   } catch (e) {
     console.error('Restaurant search error:', e);
     return { success: true, data: { restaurants: [] } };
   }
 }
 
 // ===== TRAFFIC from CNAIR/INFOTRAFIC (placeholder) =====
 async function searchTraffic(location: string, county?: string) {
   // This would integrate with real traffic APIs
   // For now, return basic structure
   return { success: true, data: { trafficInfo: {
     restrictions: [],
     tips: ['Verificați condițiile de drum înainte de plecare'],
     tollInfo: null,
     alternativeRoutes: []
   }}};
 }
 
 // ===== MAIN HANDLER =====
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const body: SearchRequest = await req.json();
     const { type, location, county, slug, latitude, longitude } = body;
 
     console.log(`[search-local-info] ${type} for ${location}${county ? `, ${county}` : ''}`);
 
     let result;
     switch (type) {
       case 'attractions':
         result = await searchAttractions(location, county);
         break;
       case 'attraction-detail':
         result = await getAttractionDetail(location, slug!, county);
         break;
       case 'accommodations':
         result = await searchAccommodations(location, county);
         break;
       case 'accommodation-detail':
         result = await getAccommodationDetail(location, slug!, county);
         break;
       case 'events':
         result = await searchEvents(location, county);
         break;
       case 'restaurants':
         result = await searchRestaurants(location, county);
         break;
       case 'traffic':
         result = await searchTraffic(location, county);
         break;
       default:
         result = { success: false, error: 'Unknown search type' };
     }
 
     return new Response(JSON.stringify(result), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' }
     });
 
   } catch (error) {
     console.error('Search error:', error);
     return new Response(JSON.stringify({
       success: false,
       error: error instanceof Error ? error.message : 'Search failed'
     }), {
       status: 500,
       headers: { ...corsHeaders, 'Content-Type': 'application/json' }
     });
   }
 });