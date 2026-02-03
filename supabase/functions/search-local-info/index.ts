const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  type: 'events' | 'accommodations' | 'attractions' | 'traffic' | 'all';
  location: string;
  county?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type, location, county } = await req.json() as SearchRequest;
    
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
      "date": "Data (ex: 15 Februarie 2025 sau Permanent)",
      "location": "Locația exactă",
      "description": "Descriere scurtă în română",
      "category": "Festival/Concert/Târg/Cultural/Sport/Comunitar"
    }
  ]
}

Dacă nu găsești evenimente specifice, include evenimente tradiționale/anuale ale zonei. Returnează maxim 10 evenimente.`;
        break;
        
      case 'accommodations':
        prompt = `Ești un asistent care recomandă cazări în România. Caută și listează opțiuni de cazare în ${locationContext}. Include hoteluri, pensiuni, cabane, apartamente și camping-uri.

Returnează răspunsul STRICT în format JSON astfel:
{
  "accommodations": [
    {
      "name": "Numele unității de cazare",
      "type": "Hotel/Pensiune/Cabană/Apartament/Camping",
      "description": "Descriere scurtă în română",
      "priceRange": "Buget/Mediu/Premium",
      "amenities": ["WiFi", "Parcare", "Restaurant", etc]
    }
  ]
}

Returnează maxim 10 opțiuni de cazare populare sau recomandate.`;
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
      "category": "Muzeu/Natură/Istoric/Religios/Recreere/Traseu",
      "description": "Descriere detaliată în română (2-3 propoziții)",
      "location": "Adresa sau locația exactă",
      "tips": "Sfaturi pentru vizitatori (program, taxe, etc)"
    }
  ]
}

Returnează toate atracțiile pe care le cunoști din zonă (maxim 20).`;
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
        "status": "Închis/Restricționat/Lucrări"
      }
    ],
    "tips": ["Sfat 1", "Sfat 2"],
    "tollInfo": "Informații despre taxe dacă există"
  }
}`;
        break;
        
      default:
        prompt = `Oferă un rezumat turistic complet pentru ${locationContext}.`;
    }

    console.log(`Searching ${type} for ${location}`);

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
            content: 'Ești un asistent turistic expert pentru România. Răspunzi doar în format JSON valid, fără text adițional. Toate răspunsurile sunt în limba română.'
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
