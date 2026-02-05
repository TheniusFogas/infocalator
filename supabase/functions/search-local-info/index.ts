 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
 const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
 const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 
 const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
 
 // Cache duration in hours
 const CACHE_HOURS = 24;
 
 interface SearchRequest {
   query: string;
   type: 'events' | 'accommodations' | 'attractions' | 'traffic' | 'event-detail' | 'accommodation-detail' | 'attraction-detail';
   location: string;
   county?: string;
   slug?: string;
 }
 
 async function callLovableAI(prompt: string, systemPrompt: string): Promise<string> {
   const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${LOVABLE_API_KEY}`,
     },
     body: JSON.stringify({
       model: 'google/gemini-3-flash-preview',
       messages: [
         { role: 'system', content: systemPrompt },
         { role: 'user', content: prompt }
       ],
       temperature: 0.7,
       max_tokens: 4000,
     }),
   });
 
   if (!response.ok) {
     const errorText = await response.text();
     console.error('AI API error:', response.status, errorText);
     throw new Error(`AI API error: ${response.status} - ${errorText}`);
   }
 
   const data = await response.json();
   return data.choices[0]?.message?.content || '';
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
 
 async function searchEvents(location: string, county?: string) {
   // Check cache first
   const { data: cached } = await supabase
     .from('cached_events')
     .select('*')
     .ilike('location', `%${location}%`)
     .gt('expires_at', new Date().toISOString())
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
       ticketUrl: e.ticket_url,
       organizer: e.organizer,
       imageKeywords: e.image_keywords,
       highlights: e.highlights
     })) }};
   }
 
   // Generate with AI
   const systemPrompt = `Ești un expert în evenimente și festivaluri din România. Generează DOAR format JSON valid, fără markdown.
 Returnează un array de 5-8 evenimente reale sau plauzibile pentru zona specificată.
 Include festivaluri, târguri, concerte, evenimente sportive, expoziții, sărbători locale.
 Datele trebuie să fie în viitorul apropiat (următoarele 3-6 luni).`;
 
   const prompt = `Generează evenimente pentru ${location}${county ? `, județul ${county}` : ''}.
 Returnează JSON array cu structura:
 [{"title": "Nume Eveniment", "date": "2026-03-15", "endDate": "2026-03-17", "time": "10:00", "venue": "Loc desfășurare", "description": "Descriere scurtă max 150 caractere", "category": "Festival/Concert/Târg/Sport/Expoziție", "isPaid": true/false, "ticketPrice": "50 RON", "organizer": "Organizator", "imageKeywords": "festival muzica outdoor", "highlights": ["atractie1", "atractie2"]}]`;
 
   try {
     const aiResponse = await callLovableAI(prompt, systemPrompt);
     const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
     if (!jsonMatch) throw new Error('Invalid AI response');
     
     const events = JSON.parse(jsonMatch[0]);
     const expiresAt = new Date(Date.now() + CACHE_HOURS * 60 * 60 * 1000).toISOString();
 
     // Cache results
     for (const event of events) {
       const slug = generateSlug(event.title);
       await supabase.from('cached_events').upsert({
         slug,
         location,
         county: county || null,
         title: event.title,
         description: event.description,
         long_description: event.description,
         category: event.category,
         date: event.date,
         end_date: event.endDate,
         time: event.time,
         venue: event.venue,
         is_paid: event.isPaid,
         ticket_price: event.ticketPrice,
         organizer: event.organizer,
         image_keywords: event.imageKeywords,
         highlights: event.highlights,
         expires_at: expiresAt
       }, { onConflict: 'slug,location' });
     }
 
     return { success: true, data: { events: events.map((e: any) => ({ ...e, slug: generateSlug(e.title), city: location })) }};
   } catch (error) {
     console.error('Error generating events:', error);
     return { success: false, error: 'Failed to generate events' };
   }
 }
 
 async function searchAccommodations(location: string, county?: string) {
   // Check cache
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
 
   const systemPrompt = `Ești un expert în turism și cazări din România. Generează DOAR format JSON valid.
 Include hoteluri, pensiuni, vile, apartamente, cabane din zona specificată.
 Prețurile trebuie să fie în RON și realiste pentru România.`;
 
   const prompt = `Generează 6-10 opțiuni de cazare pentru ${location}${county ? `, județul ${county}` : ''}.
 JSON array cu: [{"name": "Nume Cazare", "type": "Hotel/Pensiune/Vila/Apartament/Cabană", "description": "Descriere scurtă", "priceRange": "200-400 RON/noapte", "stars": 3, "rating": 8.5, "reviewCount": 150, "amenities": ["WiFi", "Parcare", "Mic dejun"], "imageKeywords": "hotel modern mountain view", "highlights": ["avantaj1", "avantaj2"]}]`;
 
   try {
     const aiResponse = await callLovableAI(prompt, systemPrompt);
     const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
     if (!jsonMatch) throw new Error('Invalid AI response');
     
     const accommodations = JSON.parse(jsonMatch[0]);
     const expiresAt = new Date(Date.now() + CACHE_HOURS * 60 * 60 * 1000).toISOString();
 
     for (const acc of accommodations) {
       const slug = generateSlug(acc.name);
       await supabase.from('cached_accommodations').upsert({
         slug,
         location,
         county: county || null,
         name: acc.name,
         type: acc.type,
         description: acc.description,
         price_range: acc.priceRange,
         stars: acc.stars,
         rating: acc.rating,
         review_count: acc.reviewCount,
         amenities: acc.amenities,
         image_keywords: acc.imageKeywords,
         highlights: acc.highlights,
         expires_at: expiresAt
       }, { onConflict: 'slug,location' });
     }
 
     return { success: true, data: { accommodations: accommodations.map((a: any) => ({ ...a, slug: generateSlug(a.name), city: location })) }};
   } catch (error) {
     console.error('Error generating accommodations:', error);
     return { success: false, error: 'Failed to generate accommodations' };
   }
 }
 
 async function searchAttractions(location: string, county?: string) {
   // Check cache
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
 
   const systemPrompt = `Ești un ghid turistic expert pentru România. Generează DOAR format JSON valid.
 Include obiective turistice reale sau plauzibile: monumente, muzee, parcuri, clădiri istorice, biserici, cetăți, rezervații naturale.
 Fiecare atracție trebuie să aibă informații complete și precise.`;
 
   const prompt = `Generează 8-12 atracții turistice pentru ${location}${county ? `, județul ${county}` : ''}.
 Include categorii diverse: Muzeu, Monument, Parc, Biserică, Cetate, Natură, Arhitectură, Artă.
 JSON array: [{"title": "Nume Atracție", "category": "Categorie", "description": "Descriere 100-150 caractere", "tips": "Sfat vizitare", "imageKeywords": "castle medieval romania", "isPaid": true/false, "entryFee": "20 RON", "openingHours": "09:00-17:00", "duration": "1-2 ore"}]`;
 
   try {
     const aiResponse = await callLovableAI(prompt, systemPrompt);
     const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
     if (!jsonMatch) throw new Error('Invalid AI response');
     
     const attractions = JSON.parse(jsonMatch[0]);
     const expiresAt = new Date(Date.now() + CACHE_HOURS * 60 * 60 * 1000).toISOString();
 
     for (const attr of attractions) {
       const slug = generateSlug(attr.title);
       await supabase.from('cached_attractions').upsert({
         slug,
         location,
         county: county || null,
         title: attr.title,
         category: attr.category,
         description: attr.description,
         tips: attr.tips,
         image_keywords: attr.imageKeywords,
         is_paid: attr.isPaid,
         entry_fee: attr.entryFee,
         opening_hours: attr.openingHours,
         duration: attr.duration,
         expires_at: expiresAt,
         view_count: 0
       }, { onConflict: 'slug,location' });
     }
 
     return { success: true, data: { attractions: attractions.map((a: any) => ({ ...a, slug: generateSlug(a.title), location })) }};
   } catch (error) {
     console.error('Error generating attractions:', error);
     return { success: false, error: 'Failed to generate attractions' };
   }
 }
 
 async function getAttractionDetail(location: string, slug: string, county?: string) {
   // Check cache
   const { data: cached } = await supabase
     .from('cached_attractions')
     .select('*')
     .eq('slug', slug)
     .ilike('location', `%${location}%`)
     .maybeSingle();
 
   if (cached && cached.long_description) {
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
 
   const title = cached?.title || slug.replace(/-/g, ' ');
   
   const systemPrompt = `Ești un ghid turistic și istoric expert. Generează DOAR format JSON valid.
 Creează conținut detaliat, captivant, formatat pentru cititori. Include istorie, fapte interesante, sfaturi practice.
 Textul lung trebuie să aibă paragrafe, să fie engaging și informativ.`;
 
   const prompt = `Generează detalii complete pentru atracția "${title}" din ${location}${county ? `, județul ${county}` : ''}.
 JSON object: {
   "longDescription": "Descriere detaliată 400-600 cuvinte cu paragrafe, istorie, importanță culturală",
   "history": "Istoric 200-300 cuvinte",
   "facts": ["Fapt interesant 1", "Fapt interesant 2", "Fapt 3", "Fapt 4", "Fapt 5"],
   "bestTimeToVisit": "Cel mai bun moment pentru vizită",
   "facilities": ["Facilititate 1", "Facilititate 2"],
   "accessibility": "Informații accesibilitate",
   "nearbyAttractions": [{"name": "Atracție apropiată", "distance": "2 km"}]
 }`;
 
   try {
     const aiResponse = await callLovableAI(prompt, systemPrompt);
     const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
     if (!jsonMatch) throw new Error('Invalid AI response');
     
     const details = JSON.parse(jsonMatch[0]);
     const expiresAt = new Date(Date.now() + CACHE_HOURS * 60 * 60 * 1000).toISOString();
 
     // Update cache with details
     if (cached) {
       await supabase.from('cached_attractions').update({
         long_description: details.longDescription,
         history: details.history,
         facts: details.facts,
         best_time_to_visit: details.bestTimeToVisit,
         facilities: details.facilities,
         accessibility: details.accessibility,
         nearby_attractions: details.nearbyAttractions,
         expires_at: expiresAt
       }).eq('id', cached.id);
     }
 
     return { success: true, data: { attraction: {
       title: cached?.title || title,
       slug,
       category: cached?.category || 'Atracție',
       description: cached?.description || details.longDescription?.substring(0, 200),
       location,
       ...details,
       viewCount: cached?.view_count || 0
     }}};
   } catch (error) {
     console.error('Error generating attraction detail:', error);
     return { success: false, error: 'Failed to generate attraction details' };
   }
 }
 
 async function getAccommodationDetail(location: string, slug: string, county?: string) {
   const { data: cached } = await supabase
     .from('cached_accommodations')
     .select('*')
     .eq('slug', slug)
     .ilike('location', `%${location}%`)
     .maybeSingle();
 
   if (cached && cached.long_description) {
     return { success: true, data: { accommodation: {
       name: cached.name,
       slug: cached.slug,
       type: cached.type,
       description: cached.description,
       longDescription: cached.long_description,
       stars: cached.stars,
       rating: cached.rating,
       reviewCount: cached.review_count,
       priceRange: cached.price_range,
       pricePerNight: cached.price_min && cached.price_max ? { min: cached.price_min, max: cached.price_max, currency: cached.currency || 'RON' } : null,
       amenities: cached.amenities,
       highlights: cached.highlights,
       address: cached.address,
       city: cached.location,
       county: cached.county,
       checkIn: cached.check_in,
       checkOut: cached.check_out,
       facilities: cached.facilities,
       roomTypes: cached.room_types,
       policies: cached.policies,
       nearbyAttractions: cached.nearby_attractions,
       reviews: cached.reviews,
       contact: cached.contact,
       bookingTips: cached.booking_tips,
       coordinates: cached.latitude && cached.longitude ? { lat: cached.latitude, lng: cached.longitude } : null,
       imageKeywords: cached.image_keywords
     }}};
   }
 
   const name = cached?.name || slug.replace(/-/g, ' ');
   
   const systemPrompt = `Ești expert în turism și ospitalitate. Generează DOAR format JSON valid.
 Creează informații complete și realiste despre cazări din România.`;
 
   const prompt = `Generează detalii pentru cazarea "${name}" din ${location}.
 JSON: {
   "longDescription": "Descriere 200-300 cuvinte",
   "checkIn": "14:00",
   "checkOut": "11:00",
   "facilities": ["Piscină", "Spa", "Restaurant"],
   "roomTypes": [{"name": "Camera Standard", "capacity": 2, "price": 250, "features": ["TV", "Baie privată"]}],
   "policies": {"cancellation": "Anulare gratuită 24h", "children": "Copii acceptați", "pets": "Fără animale"},
   "nearbyAttractions": [{"name": "Atracție", "distance": "500m"}],
   "contact": {"phone": "+40xxx", "email": "email@example.com"},
   "bookingTips": ["Sfat 1", "Sfat 2"]
 }`;
 
   try {
     const aiResponse = await callLovableAI(prompt, systemPrompt);
     const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
     if (!jsonMatch) throw new Error('Invalid AI response');
     
     const details = JSON.parse(jsonMatch[0]);
     const expiresAt = new Date(Date.now() + CACHE_HOURS * 60 * 60 * 1000).toISOString();
 
     if (cached) {
       await supabase.from('cached_accommodations').update({
         long_description: details.longDescription,
         check_in: details.checkIn,
         check_out: details.checkOut,
         facilities: details.facilities,
         room_types: details.roomTypes,
         policies: details.policies,
         nearby_attractions: details.nearbyAttractions,
         contact: details.contact,
         booking_tips: details.bookingTips,
         expires_at: expiresAt
       }).eq('id', cached.id);
     }
 
     return { success: true, data: { accommodation: {
       name: cached?.name || name,
       slug,
       type: cached?.type || 'Hotel',
       city: location,
       county,
       ...cached,
       ...details
     }}};
   } catch (error) {
     console.error('Error:', error);
     return { success: false, error: 'Failed to generate details' };
   }
 }
 
 async function getEventDetail(location: string, slug: string, county?: string) {
   const { data: cached } = await supabase
     .from('cached_events')
     .select('*')
     .eq('slug', slug)
     .ilike('location', `%${location}%`)
     .maybeSingle();
 
   if (cached) {
     return { success: true, data: { event: {
       title: cached.title,
       slug: cached.slug,
       date: cached.date,
       endDate: cached.end_date,
       time: cached.time,
       venue: cached.venue,
       location: cached.location,
       county: cached.county,
       description: cached.description,
       longDescription: cached.long_description,
       category: cached.category,
       isPaid: cached.is_paid,
       ticketPrice: cached.ticket_price,
       ticketUrl: cached.ticket_url,
       organizer: cached.organizer,
       organizerContact: cached.organizer_contact,
       imageKeywords: cached.image_keywords,
       highlights: cached.highlights,
       schedule: cached.schedule,
       facilities: cached.facilities,
       accessibility: cached.accessibility,
       tips: cached.tips,
       nearbyAttractions: cached.nearby_attractions,
       coordinates: cached.latitude && cached.longitude ? { lat: cached.latitude, lng: cached.longitude } : null
     }}};
   }
 
   return { success: false, error: 'Event not found' };
 }
 
 async function searchTraffic(location: string, county?: string) {
   // Generate traffic info for the area
   const systemPrompt = `Ești expert în trafic rutier în România. Generează DOAR format JSON valid.`;
   
   const prompt = `Generează informații trafic pentru zona ${location}${county ? `, ${county}` : ''}.
 JSON: {
   "restrictions": [{"road": "DN1", "description": "Lucrări km 45-50", "status": "works"}],
   "tips": ["Sfat trafic 1", "Sfat 2"],
   "tollInfo": "Informații despre taxe drum",
   "alternativeRoutes": ["Rută alternativă 1"]
 }`;
 
   try {
     const aiResponse = await callLovableAI(prompt, systemPrompt);
     const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
     if (!jsonMatch) throw new Error('Invalid AI response');
     
     const trafficInfo = JSON.parse(jsonMatch[0]);
     return { success: true, data: { trafficInfo }};
   } catch (error) {
     return { success: true, data: { trafficInfo: { restrictions: [], tips: ['Verificați CNAIR pentru informații actualizate'], alternativeRoutes: [] }}};
   }
 }
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const body: SearchRequest = await req.json();
     const { type, location, county, slug } = body;
 
     let result;
 
     switch (type) {
       case 'events':
         result = await searchEvents(location, county);
         break;
       case 'event-detail':
         result = await getEventDetail(location, slug!, county);
         break;
       case 'accommodations':
         result = await searchAccommodations(location, county);
         break;
       case 'accommodation-detail':
         result = await getAccommodationDetail(location, slug!, county);
         break;
       case 'attractions':
         result = await searchAttractions(location, county);
         break;
       case 'attraction-detail':
         result = await getAttractionDetail(location, slug!, county);
         break;
       case 'traffic':
         result = await searchTraffic(location, county);
         break;
       default:
         result = { success: false, error: 'Unknown search type' };
     }
 
     return new Response(JSON.stringify(result), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   } catch (error) {
     console.error('Error:', error);
     return new Response(
       JSON.stringify({ success: false, error: 'Internal server error' }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });