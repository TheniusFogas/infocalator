const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  type: 'events' | 'accommodations' | 'attractions' | 'traffic' | 'event-detail' | 'accommodation-detail' | 'all';
  location: string;
  county?: string;
  slug?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type, location, county, slug } = await req.json() as SearchRequest;
    
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const locationContext = county ? `${location}, ${county}, România` : `${location}, România`;
    
    let prompt = '';
    
    switch (type) {
      case 'events':
        prompt = `Ești un asistent care găsește evenimente locale în România. Caută și listează evenimentele care au loc sau vor avea loc în ${locationContext}. Include festivaluri, concerte, târguri, evenimente culturale, sportive și comunitare.

Returnează răspunsul STRICT în format JSON astfel:
{
  "events": [
    {
      "title": "Numele evenimentului",
      "slug": "nume-eveniment-unic",
      "date": "15 Februarie 2025",
      "endDate": "17 Februarie 2025 (sau null dacă e o singură zi)",
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

Dacă nu găsești evenimente specifice, include evenimente tradiționale/anuale ale zonei. Returnează maxim 12 evenimente. ASIGURĂ-TE că fiecare eveniment are un slug unic și dată validă.`;
        break;

      case 'event-detail':
        prompt = `Ești un expert în evenimente din România. Generează informații detaliate pentru un eveniment cu identificatorul "${slug}" din ${locationContext}.

Returnează răspunsul STRICT în format JSON astfel:
{
  "event": {
    "title": "Numele complet al evenimentului",
    "slug": "${slug}",
    "date": "15 Februarie 2025",
    "endDate": "17 Februarie 2025 sau null",
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
      {"day": "Vineri, 15 Feb", "activities": ["10:00 - Deschidere oficială", "14:00 - Concert X", "20:00 - Show principal"]},
      {"day": "Sâmbătă, 16 Feb", "activities": ["11:00 - Workshop", "16:00 - Competiție", "21:00 - Petrecere"]}
    ],
    "facilities": ["Parcare", "Toalete", "Food court", "Zonă copii"],
    "accessibility": "Accesibil pentru persoane cu dizabilități",
    "tips": ["Vino devreme pentru locuri bune", "Ia numerar pentru standuri", "Verifică prognoza meteo"],
    "nearbyAttractions": ["Atracție 1 din zonă", "Atracție 2 din zonă"],
    "coordinates": {"lat": 44.4268, "lng": 26.1025}
  }
}

Generează informații realiste și utile pentru vizitatori. Imaginile sunt keywords pentru Unsplash.`;
        break;
        
      case 'accommodations':
        prompt = `Ești un asistent care recomandă cazări în România. Caută și listează opțiuni de cazare în ${locationContext}. Include hoteluri, pensiuni, cabane, apartamente și camping-uri.

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

Returnează maxim 12 opțiuni de cazare populare sau recomandate. ASIGURĂ-TE că fiecare cazare are un slug unic.`;
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
      {"author": "Maria P.", "rating": 5, "text": "Locație excelentă, personal amabil!", "date": "Ianuarie 2025"},
      {"author": "Ion D.", "rating": 4, "text": "Cameră curată, mic dejun bun.", "date": "Decembrie 2024"}
    ],
    "contact": {
      "phone": "+40 XXX XXX XXX",
      "email": "contact@hotel.ro",
      "website": "https://hotel-example.ro"
    },
    "coordinates": {"lat": 44.4268, "lng": 26.1025},
    "bookingTips": ["Rezervă din timp în sezon", "Cere cameră cu vedere", "Verifică ofertele speciale"]
  }
}

Generează informații realiste și utile. Imaginile sunt keywords pentru căutare imagini.`;
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

Returnează toate atracțiile pe care le cunoști din zonă (maxim 20). ASIGURĂ-TE că fiecare atracție are un slug unic.`;
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
