import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SearchRequest {
  query: string;
  type: 'events' | 'accommodations' | 'attractions' | 'traffic' | 'event-detail' | 'accommodation-detail' | 'attraction-detail' | 'all';
  location: string;
  county?: string;
  slug?: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type, location, county, slug } = await req.json() as SearchRequest;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Try to get from cache first for detail pages
    if ((type === 'event-detail' || type === 'accommodation-detail' || type === 'attraction-detail') && slug) {
      const tableName = type === 'event-detail' 
        ? 'cached_events' 
        : type === 'accommodation-detail' 
          ? 'cached_accommodations' 
          : 'cached_attractions';
      
      const { data: cachedData } = await supabase
        .from(tableName)
        .select('*')
        .eq('slug', slug)
        .eq('location', location)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      if (cachedData) {
        console.log(`Cache hit for ${type}: ${slug}`);
        const responseKey = type === 'event-detail' 
          ? 'event' 
          : type === 'accommodation-detail' 
            ? 'accommodation' 
            : 'attraction';
        return new Response(
          JSON.stringify({ success: true, data: { [responseKey]: transformCachedData(cachedData, type) }, type, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // For list types, check cache first
    if (type === 'events' || type === 'accommodations' || type === 'attractions') {
      const tableName = type === 'events' 
        ? 'cached_events' 
        : type === 'accommodations' 
          ? 'cached_accommodations' 
          : 'cached_attractions';
      
      const { data: cachedList } = await supabase
        .from(tableName)
        .select('*')
        .eq('location', location)
        .gt('expires_at', new Date().toISOString())
        .limit(20);
      
      if (cachedList && cachedList.length > 0) {
        console.log(`Cache hit for ${type} list: ${location} (${cachedList.length} items)`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: { [type]: cachedList.map(item => transformCachedData(item, type)) }, 
            type, 
            cached: true 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const locationContext = county ? `${location}, ${county}, România` : `${location}, România`;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('ro-RO', { month: 'long' });
    
    let prompt = '';
    
    switch (type) {
      case 'events':
        prompt = `Ești un asistent care găsește evenimente locale în România. Data actuală este ${currentMonth} ${currentYear}. Caută și listează DOAR evenimentele care VOR AVEA LOC în viitorul apropiat (următoarele 6 luni) în ${locationContext}. NU include evenimente care au avut loc în trecut!

Returnează răspunsul STRICT în format JSON astfel:
{
  "events": [
    {
      "title": "Numele evenimentului",
      "slug": "nume-eveniment-unic",
      "date": "15 Martie ${currentYear}",
      "endDate": "17 Martie ${currentYear} (sau null dacă e o singură zi)",
      "time": "10:00 - 22:00",
      "location": "Locația exactă, adresa",
      "city": "${location}",
      "description": "Descriere detaliată în română (3-4 propoziții)",
      "category": "Festival/Concert/Târg/Cultural/Sport/Comunitar/Expoziție/Gastro",
      "isPaid": true/false,
      "ticketPrice": "50 RON" sau "Gratuit",
      "ticketUrl": "https://bilete.ro/exemplu sau null",
      "organizer": "Numele organizatorului",
      "imageKeywords": "cuvinte cheie pentru imagine, ex: festival muzica romania",
      "highlights": ["Atracție 1", "Atracție 2", "Atracție 3"]
    }
  ]
}

IMPORTANT: Datele trebuie să fie în viitor (${currentYear} sau după)! Include evenimente tradiționale/anuale ale zonei care vor avea loc în curând. Maxim 12 evenimente.`;
        break;

      case 'event-detail':
        prompt = `Ești un expert în evenimente din România. Data actuală este ${currentMonth} ${currentYear}. Generează informații detaliate pentru un eveniment cu identificatorul "${slug}" din ${locationContext}.

Returnează răspunsul STRICT în format JSON astfel:
{
  "event": {
    "title": "Numele complet al evenimentului",
    "slug": "${slug}",
    "date": "15 Martie ${currentYear}",
    "endDate": "17 Martie ${currentYear} sau null",
    "time": "10:00 - 22:00",
    "location": "Adresa completă a locației",
    "city": "${location}",
    "venue": "Numele locației/sălii",
    "description": "Descriere foarte detaliată în română (5-6 propoziții)",
    "longDescription": "Descriere extinsă cu istoria evenimentului, ce include, de ce merită vizitat (2-3 paragrafe)",
    "category": "Festival/Concert/Târg/Cultural/Sport/Comunitar",
    "isPaid": true/false,
    "ticketPrice": "50 RON" sau "Gratuit",
    "ticketPriceRange": {"min": 30, "max": 150, "currency": "RON"},
    "ticketUrl": "https://bilete.ro/exemplu sau null",
    "organizer": "Numele organizatorului",
    "organizerContact": "contact@organizer.ro",
    "images": [
      {"url": "festival outdoor crowd summer", "alt": "Descriere imagine 1", "type": "main"},
      {"url": "concert stage lights romania", "alt": "Descriere imagine 2", "type": "gallery"},
      {"url": "food festival traditional romanian", "alt": "Descriere imagine 3", "type": "gallery"},
      {"url": "people dancing celebration event", "alt": "Descriere imagine 4", "type": "gallery"},
      {"url": "night festival city lights", "alt": "Descriere imagine 5", "type": "gallery"},
      {"url": "traditional romanian culture event", "alt": "Descriere imagine 6", "type": "gallery"}
    ],
    "highlights": ["Atracție principală 1", "Atracție 2", "Atracție 3", "Atracție 4"],
    "schedule": [
      {"day": "Vineri, 15 Mar", "activities": ["10:00 - Deschidere oficială", "14:00 - Concert X", "20:00 - Show principal"]},
      {"day": "Sâmbătă, 16 Mar", "activities": ["11:00 - Workshop", "16:00 - Competiție", "21:00 - Petrecere"]}
    ],
    "facilities": ["Parcare", "Toalete", "Food court", "Zonă copii"],
    "accessibility": "Accesibil pentru persoane cu dizabilități",
    "tips": ["Vino devreme pentru locuri bune", "Ia numerar pentru standuri", "Verifică prognoza meteo"],
    "nearbyAttractions": ["Atracție 1 din zonă", "Atracție 2 din zonă"],
    "coordinates": {"lat": 44.4268, "lng": 26.1025}
  }
}

IMPORTANT: Data trebuie să fie în viitor (${currentYear} sau după)! Dacă evenimentul original a fost în trecut, actualizează-l pentru ediția viitoare.`;
        break;
        
      case 'accommodations':
        prompt = `Ești un asistent care recomandă cazări în România. Caută și listează opțiuni de cazare REALE în ${locationContext}. Include hoteluri, pensiuni, cabane, apartamente.

Returnează răspunsul STRICT în format JSON astfel:
{
  "accommodations": [
    {
      "name": "Numele unității de cazare",
      "slug": "nume-cazare-unic",
      "type": "Hotel/Pensiune/Cabană/Apartament/Camping/Vila/Hostel",
      "description": "Descriere scurtă în română (2 propoziții)",
      "priceRange": "Buget/Mediu/Premium",
      "pricePerNight": {"min": 150, "max": 300, "currency": "RON"},
      "rating": 4.5,
      "reviewCount": 120,
      "amenities": ["WiFi", "Parcare", "Restaurant", "Piscină", "Spa", "AC"],
      "address": "Strada, Număr, Oraș",
      "city": "${location}",
      "imageKeywords": "hotel modern romania mountain view",
      "highlights": ["Vedere la munte", "Mic dejun inclus", "Check-in 24h"]
    }
  ]
}

Returnează maxim 12 opțiuni de cazare populare. Fiecare cazare trebuie să aibă un slug unic.`;
        break;

      case 'accommodation-detail':
        prompt = `Ești un expert în turism și cazări din România. Generează informații foarte detaliate pentru o cazare cu identificatorul "${slug}" din ${locationContext}.

Returnează răspunsul STRICT în format JSON astfel:
{
  "accommodation": {
    "name": "Numele complet al cazării",
    "slug": "${slug}",
    "type": "Hotel/Pensiune/Cabană/Apartament/Vila",
    "stars": 4,
    "description": "Descriere detaliată în română (3-4 propoziții)",
    "longDescription": "Descriere extinsă cu facilități, ambient, de ce e specială această cazare (2-3 paragrafe)",
    "address": "Strada Exemplu Nr. 10",
    "city": "${location}",
    "county": "${county || 'România'}",
    "pricePerNight": {"min": 150, "max": 350, "currency": "RON"},
    "priceRange": "Mediu",
    "rating": 4.5,
    "reviewCount": 234,
    "checkIn": "14:00",
    "checkOut": "11:00",
    "images": [
      {"url": "luxury hotel room interior design", "alt": "Camera principală", "type": "main"},
      {"url": "hotel bathroom modern spa", "alt": "Baie modernă", "type": "gallery"},
      {"url": "hotel restaurant breakfast buffet", "alt": "Restaurant", "type": "gallery"},
      {"url": "hotel pool outdoor summer", "alt": "Piscină", "type": "gallery"},
      {"url": "hotel lobby reception elegant", "alt": "Recepție", "type": "gallery"},
      {"url": "hotel terrace mountain view romania", "alt": "Vedere exterioară", "type": "gallery"}
    ],
    "amenities": ["WiFi gratuit", "Parcare gratuită", "Restaurant", "Room service", "AC", "TV", "Minibar"],
    "roomTypes": [
      {"name": "Cameră Standard", "capacity": 2, "price": 150, "features": ["Pat dublu", "Baie privată"]},
      {"name": "Cameră Deluxe", "capacity": 2, "price": 250, "features": ["Pat king", "Balcon", "Jacuzzi"]},
      {"name": "Apartament", "capacity": 4, "price": 350, "features": ["2 camere", "Bucătărie", "Living"]}
    ],
    "facilities": ["Piscină interioară", "Saună", "Spa", "Sală fitness", "Biciclete gratuite"],
    "policies": {
      "cancellation": "Anulare gratuită cu 24h înainte",
      "children": "Copii bine primiți",
      "pets": "Animale permise (taxă suplimentară)",
      "smoking": "Interzis fumatul"
    },
    "nearbyAttractions": [
      {"name": "Atracție turistică apropiată", "distance": "2 km"},
      {"name": "Centrul orașului", "distance": "500 m"}
    ],
    "reviews": [
      {"author": "Maria P.", "rating": 5, "text": "Locație excelentă, personal amabil!", "date": "Ianuarie ${currentYear}"},
      {"author": "Ion D.", "rating": 4, "text": "Cameră curată, mic dejun bun.", "date": "Decembrie ${currentYear - 1}"}
    ],
    "contact": {
      "phone": "+40 XXX XXX XXX",
      "email": "contact@hotel.ro",
      "website": "https://hotel-example.ro"
    },
    "coordinates": {"lat": 44.4268, "lng": 26.1025},
    "bookingTips": ["Rezervă din timp în sezon", "Cere cameră cu vedere", "Verifică ofertele speciale"]
  }
}`;
        break;
        
      case 'attractions':
        prompt = `Ești un expert în turism românesc. Caută și listează TOATE atracțiile turistice din și din apropierea ${locationContext}. Include:
- Monumente și clădiri istorice
- Muzee și galerii
- Parcuri și rezervații naturale
- Trasee montane și de drumeție
- Biserici și mănăstiri
- Cetăți și castele
- Lacuri, cascade, peșteri
- Zone de agrement
- Puncte panoramice

Returnează răspunsul STRICT în format JSON astfel:
{
  "attractions": [
    {
      "title": "Numele atracției",
      "slug": "nume-atractie-unic",
      "category": "Muzeu/Natură/Istoric/Religios/Recreere/Traseu/Cascadă/Peșteră/Castel/Lac",
      "description": "Descriere detaliată în română (2-3 propoziții)",
      "location": "Adresa sau locația exactă",
      "city": "${location}",
      "tips": "Sfaturi pentru vizitatori (program, taxe, etc)",
      "imageKeywords": "romanian castle medieval architecture",
      "isPaid": true/false,
      "entryFee": "20 RON sau Gratuit",
      "openingHours": "09:00 - 17:00",
      "duration": "1-2 ore"
    }
  ]
}

Returnează toate atracțiile pe care le cunoști din zonă (maxim 20). Fiecare atracție trebuie să aibă un slug unic.`;
        break;

      case 'attraction-detail':
        prompt = `Ești un expert în turism românesc. Generează informații foarte detaliate pentru o atracție turistică cu identificatorul "${slug}" din ${locationContext}.

Returnează răspunsul STRICT în format JSON astfel:
{
  "attraction": {
    "title": "Numele complet al atracției",
    "slug": "${slug}",
    "category": "Muzeu/Natură/Istoric/Religios/Recreere/Traseu/Cascadă/Peșteră/Castel/Lac",
    "description": "Descriere detaliată în română (3-4 propoziții)",
    "longDescription": "Descriere extinsă cu istoria, ce poți vedea, de ce merită vizitat (2-3 paragrafe)",
    "location": "Adresa sau locația exactă",
    "city": "${location}",
    "county": "${county || 'România'}",
    "images": [
      {"url": "romanian castle medieval architecture", "alt": "Imagine principală", "type": "main"},
      {"url": "castle interior museum display", "alt": "Interior", "type": "gallery"},
      {"url": "castle garden flowers", "alt": "Grădină", "type": "gallery"},
      {"url": "castle tower historical", "alt": "Turn", "type": "gallery"},
      {"url": "castle panoramic view", "alt": "Panoramă", "type": "gallery"},
      {"url": "castle entrance gate", "alt": "Intrare", "type": "gallery"}
    ],
    "tips": ["Sfat pentru vizitatori 1", "Sfat 2", "Sfat 3"],
    "isPaid": true/false,
    "entryFee": "20 RON",
    "openingHours": "09:00 - 17:00",
    "duration": "1-2 ore",
    "facilities": ["Parcare", "Ghid audio", "Magazin suveniruri", "Cafenea"],
    "accessibility": "Parțial accesibil pentru persoane cu mobilitate redusă",
    "bestTimeToVisit": "Primăvara și toamna pentru vreme plăcută",
    "nearbyAttractions": [
      {"name": "Altă atracție", "distance": "5 km"},
      {"name": "Centrul orașului", "distance": "2 km"}
    ],
    "coordinates": {"lat": 44.4268, "lng": 26.1025}
  }
}`;
        break;
        
      case 'traffic':
        prompt = `Ești un asistent care oferă informații despre trafic și drumuri în România. Pentru zona ${locationContext}, oferă:
- Restricții rutiere cunoscute
- Drumuri în lucru sau închise
- Sfaturi pentru șoferi
- Alternative de rute
- Informații despre taxe de drum sau vignete necesare

Returnează răspunsul STRICT în format JSON astfel:
{
  "trafficInfo": {
    "restrictions": [
      {
        "road": "DN1/E60/etc",
        "description": "Descrierea restricției",
        "status": "Închis/Restricționat/Lucrări",
        "icon": "construction/warning/closed"
      }
    ],
    "tips": ["Sfat 1", "Sfat 2"],
    "tollInfo": "Informații despre taxe dacă există",
    "alternativeRoutes": ["Rută alternativă 1", "Rută alternativă 2"]
  }
}`;
        break;
        
      default:
        prompt = `Oferă un rezumat turistic complet pentru ${locationContext}.`;
    }

    console.log(`Searching ${type} for ${location}${slug ? ` (slug: ${slug})` : ''}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Ești un asistent turistic expert pentru România. Răspunzi doar în format JSON valid, fără text adițional. Toate răspunsurile sunt în limba română. Generezi date realiste și utile pentru utilizatori.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Prea multe cereri. Încearcă din nou în câteva secunde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Credite insuficiente. Contactează administratorul.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    // Parse JSON from response (handle markdown code blocks)
    let parsedContent;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      parsedContent = JSON.parse(jsonString.trim());
    } catch {
      console.error('Failed to parse AI response:', content);
      parsedContent = { error: 'Failed to parse response', raw: content };
    }

    // Cache the results
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour cache

    if (type === 'events' && parsedContent.events) {
      for (const event of parsedContent.events) {
        const eventExpires = event.date ? calculateEventExpiry(event.date) : expiresAt;
        await supabase.from('cached_events').upsert({
          slug: event.slug,
          location: location,
          county: county,
          title: event.title,
          description: event.description,
          category: event.category,
          date: event.date,
          end_date: event.endDate,
          time: event.time,
          venue: event.location,
          is_paid: event.isPaid,
          ticket_price: event.ticketPrice,
          ticket_url: event.ticketUrl,
          organizer: event.organizer,
          image_keywords: event.imageKeywords,
          highlights: event.highlights,
          expires_at: eventExpires.toISOString(),
        }, { onConflict: 'slug,location' });
      }
    }

    if (type === 'accommodations' && parsedContent.accommodations) {
      for (const acc of parsedContent.accommodations) {
        await supabase.from('cached_accommodations').upsert({
          slug: acc.slug,
          location: location,
          county: county,
          name: acc.name,
          type: acc.type,
          description: acc.description,
          price_range: acc.priceRange,
          price_min: acc.pricePerNight?.min,
          price_max: acc.pricePerNight?.max,
          currency: acc.pricePerNight?.currency || 'RON',
          rating: acc.rating,
          review_count: acc.reviewCount,
          amenities: acc.amenities,
          address: acc.address,
          image_keywords: acc.imageKeywords,
          highlights: acc.highlights,
          expires_at: expiresAt.toISOString(),
        }, { onConflict: 'slug,location' });
      }
    }

    if (type === 'attractions' && parsedContent.attractions) {
      for (const attr of parsedContent.attractions) {
        await supabase.from('cached_attractions').upsert({
          slug: attr.slug,
          location: location,
          county: county,
          title: attr.title,
          category: attr.category,
          description: attr.description,
          tips: attr.tips,
          image_keywords: attr.imageKeywords,
          is_paid: attr.isPaid,
          entry_fee: attr.entryFee,
          opening_hours: attr.openingHours,
          duration: attr.duration,
          expires_at: expiresAt.toISOString(),
        }, { onConflict: 'slug,location' });
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: parsedContent, type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-local-info:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function transformCachedData(data: any, type: string): any {
  if (type === 'event-detail' || type === 'events') {
    return {
      title: data.title,
      slug: data.slug,
      date: data.date,
      endDate: data.end_date,
      time: data.time,
      location: data.venue,
      city: data.location,
      description: data.description,
      longDescription: data.long_description,
      category: data.category,
      isPaid: data.is_paid,
      ticketPrice: data.ticket_price,
      ticketUrl: data.ticket_url,
      organizer: data.organizer,
      organizerContact: data.organizer_contact,
      imageKeywords: data.image_keywords,
      highlights: data.highlights,
      schedule: data.schedule,
      facilities: data.facilities,
      accessibility: data.accessibility,
      tips: data.tips,
      nearbyAttractions: data.nearby_attractions,
      coordinates: data.latitude && data.longitude ? { lat: data.latitude, lng: data.longitude } : null,
    };
  }
  
  if (type === 'accommodation-detail' || type === 'accommodations') {
    return {
      name: data.name,
      slug: data.slug,
      type: data.type,
      stars: data.stars,
      description: data.description,
      longDescription: data.long_description,
      address: data.address,
      city: data.location,
      county: data.county,
      pricePerNight: data.price_min ? { min: data.price_min, max: data.price_max, currency: data.currency } : null,
      priceRange: data.price_range,
      rating: data.rating,
      reviewCount: data.review_count,
      checkIn: data.check_in,
      checkOut: data.check_out,
      amenities: data.amenities,
      imageKeywords: data.image_keywords,
      highlights: data.highlights,
      roomTypes: data.room_types,
      facilities: data.facilities,
      policies: data.policies,
      nearbyAttractions: data.nearby_attractions,
      reviews: data.reviews,
      contact: data.contact,
      coordinates: data.latitude && data.longitude ? { lat: data.latitude, lng: data.longitude } : null,
      bookingTips: data.booking_tips,
    };
  }
  
  if (type === 'attraction-detail' || type === 'attractions') {
    return {
      title: data.title,
      slug: data.slug,
      category: data.category,
      description: data.description,
      location: data.location,
      city: data.location,
      tips: data.tips,
      imageKeywords: data.image_keywords,
      isPaid: data.is_paid,
      entryFee: data.entry_fee,
      openingHours: data.opening_hours,
      duration: data.duration,
      coordinates: data.latitude && data.longitude ? { lat: data.latitude, lng: data.longitude } : null,
    };
  }
  
  return data;
}

function calculateEventExpiry(dateString: string): Date {
  const months: Record<string, number> = {
    'ianuarie': 0, 'februarie': 1, 'martie': 2, 'aprilie': 3,
    'mai': 4, 'iunie': 5, 'iulie': 6, 'august': 7,
    'septembrie': 8, 'octombrie': 9, 'noiembrie': 10, 'decembrie': 11
  };
  
  try {
    // Try to parse Romanian date format like "15 Martie 2025"
    const parts = dateString.toLowerCase().split(' ');
    if (parts.length >= 3) {
      const day = parseInt(parts[0]);
      const month = months[parts[1]];
      const year = parseInt(parts[2]);
      
      if (!isNaN(day) && month !== undefined && !isNaN(year)) {
        const eventDate = new Date(year, month, day);
        eventDate.setDate(eventDate.getDate() + 1); // Expire day after event
        return eventDate;
      }
    }
  } catch (e) {
    console.error('Error parsing date:', dateString, e);
  }
  
  // Default to 30 days from now
  const defaultExpiry = new Date();
  defaultExpiry.setDate(defaultExpiry.getDate() + 30);
  return defaultExpiry;
}