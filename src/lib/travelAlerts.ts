 // Travel alerts configuration for different countries
 // Fixed: Bridge toll detection, improved country sampling
 
 export interface TravelAlert {
   type: 'vignette' | 'toll' | 'ferry' | 'speed_limit' | 'border' | 'warning';
   country: string;
   countryCode: string;
   title: string;
   description: string;
   link?: string;
   linkText?: string;
   icon: string;
   priority: number;
 }
 
 export interface SpeedLimits {
   urban: number;
   rural: number;
   highway: number;
 }
 
 export const COUNTRY_SPEED_LIMITS: Record<string, SpeedLimits> = {
   RO: { urban: 50, rural: 90, highway: 130 },
   HU: { urban: 50, rural: 90, highway: 130 },
   BG: { urban: 50, rural: 90, highway: 140 },
   AT: { urban: 50, rural: 100, highway: 130 },
   DE: { urban: 50, rural: 100, highway: 0 }, // 0 = no limit
   CZ: { urban: 50, rural: 90, highway: 130 },
   SK: { urban: 50, rural: 90, highway: 130 },
   PL: { urban: 50, rural: 90, highway: 140 },
   RS: { urban: 50, rural: 80, highway: 120 },
   HR: { urban: 50, rural: 90, highway: 130 },
   SI: { urban: 50, rural: 90, highway: 130 },
   UA: { urban: 50, rural: 90, highway: 130 },
   MD: { urban: 50, rural: 90, highway: 110 },
 };
 
 export const VIGNETTE_ALERTS: Record<string, TravelAlert> = {
   RO: {
     type: 'vignette',
     country: 'România',
     countryCode: 'RO',
     title: 'Rovinieta obligatorie',
     description: 'Pentru circulația pe drumurile naționale și autostrăzi din România este necesară Rovinieta.',
     link: 'https://www.rovinieta.ro',
     linkText: 'Cumpără Rovinieta',
     icon: '🇷🇴',
     priority: 1
   },
   RO_BRIDGE: {
     type: 'toll',
     country: 'România',
     countryCode: 'RO',
     title: 'Taxa pod Fetești-Cernavodă',
     description: 'Podul peste Dunăre necesită taxă separată (numai dacă treci prin această zonă).',
     link: 'https://www.cnadnr.ro',
     linkText: 'Detalii taxă pod',
     icon: '🌉',
     priority: 2
   },
   HU: {
     type: 'vignette',
     country: 'Ungaria',
     countryCode: 'HU',
     title: 'E-Matrica obligatorie',
     description: 'Pentru autostrăzi și drumuri expres din Ungaria este necesară vinieta electronică E-Matrica.',
     link: 'https://ematrica.nemzetiutdij.hu',
     linkText: 'Cumpără E-Matrica',
     icon: '🇭🇺',
     priority: 1
   },
   BG: {
     type: 'vignette',
     country: 'Bulgaria',
     countryCode: 'BG',
     title: 'Vinetka obligatorie',
     description: 'Pentru rețeaua de drumuri naționale din Bulgaria este necesară vinieta electronică.',
     link: 'https://www.bgtoll.bg',
     linkText: 'Cumpără Vinetka',
     icon: '🇧🇬',
     priority: 1
   },
   AT: {
     type: 'vignette',
     country: 'Austria',
     countryCode: 'AT',
     title: 'Vignette Austria',
     description: 'Pentru autostrăzi și drumuri expres din Austria este necesară vinieta digitală.',
     link: 'https://www.asfinag.at/maut-vignette/vignette/',
     linkText: 'Cumpără Vignette',
     icon: '🇦🇹',
     priority: 1
   },
   CZ: {
     type: 'vignette',
     country: 'Cehia',
     countryCode: 'CZ',
     title: 'E-známka obligatorie',
     description: 'Pentru autostrăzi din Cehia este necesară vinieta electronică.',
     link: 'https://edalnice.cz',
     linkText: 'Cumpără E-známka',
     icon: '🇨🇿',
     priority: 1
   },
   SK: {
     type: 'vignette',
     country: 'Slovacia',
     countryCode: 'SK',
     title: 'E-známka obligatorie',
     description: 'Pentru autostrăzi din Slovacia este necesară vinieta electronică.',
     link: 'https://eznamka.sk',
     linkText: 'Cumpără E-známka',
     icon: '🇸🇰',
     priority: 1
   },
   SI: {
     type: 'vignette',
     country: 'Slovenia',
     countryCode: 'SI',
     title: 'E-Vinjeta obligatorie',
     description: 'Pentru autostrăzi din Slovenia este necesară vinieta electronică.',
     link: 'https://evinjeta.dars.si',
     linkText: 'Cumpără E-Vinjeta',
     icon: '🇸🇮',
     priority: 1
   }
 };
 
 // Coordinates for Fetești-Cernavodă bridge area (bounding box)
 const FETESTI_CERNAVODA_BOUNDS = {
   minLat: 44.30,
   maxLat: 44.42,
   minLon: 27.70,
   maxLon: 28.15
 };
 
 // Check if route passes through Fetești-Cernavodă bridge area
 export const routePassesThroughBridge = (coordinates: [number, number][]): boolean => {
   return coordinates.some(([lat, lon]) => 
     lat >= FETESTI_CERNAVODA_BOUNDS.minLat &&
     lat <= FETESTI_CERNAVODA_BOUNDS.maxLat &&
     lon >= FETESTI_CERNAVODA_BOUNDS.minLon &&
     lon <= FETESTI_CERNAVODA_BOUNDS.maxLon
   );
 };
 
 export const FERRY_OPERATORS: Record<string, { name: string; link: string }> = {
   'RO-BG': { name: 'Bechet-Oriahovo / Călărași-Silistra', link: 'https://www.cnadnr.ro' },
   'RO-UA': { name: 'Orlivka-Isaccea', link: 'https://www.mt.gov.ua' },
   'HR-IT': { name: 'Split-Ancona / Zadar-Ancona', link: 'https://www.jadrolinija.hr' },
 };
 
 // Detect country from coordinates using reverse geocoding boundary
 export const detectCountryFromCoordinate = async (lat: number, lon: number): Promise<string | null> => {
   try {
     const response = await fetch(
       `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=3`,
       { headers: { 'User-Agent': 'RomaniaTravel/1.0' } }
     );
     const data = await response.json();
     return data?.address?.country_code?.toUpperCase() || null;
   } catch {
     return null;
   }
 };
 
 // Detect countries along route by sampling coordinates - improved sampling
 export const detectCountriesAlongRoute = async (
   coordinates: [number, number][]
 ): Promise<string[]> => {
   if (coordinates.length === 0) return [];
   
   // Sample more coordinates for better country detection
   const sampleSize = Math.min(25, Math.max(10, Math.ceil(coordinates.length / 20)));
   const step = Math.floor(coordinates.length / sampleSize);
   
   const samples: [number, number][] = [
     coordinates[0], // Start
     coordinates[coordinates.length - 1], // End
   ];
   
   // Add evenly distributed samples along the route
   for (let i = 1; i < sampleSize - 1; i++) {
     const idx = Math.min(i * step, coordinates.length - 1);
     samples.push(coordinates[idx]);
   }
   
   // Also sample at key points to catch border crossings
   const quarterIdx = Math.floor(coordinates.length * 0.25);
   const halfIdx = Math.floor(coordinates.length * 0.5);
   const threeQuarterIdx = Math.floor(coordinates.length * 0.75);
   
   if (quarterIdx > 0) samples.push(coordinates[quarterIdx]);
   if (halfIdx > 0) samples.push(coordinates[halfIdx]);
   if (threeQuarterIdx > 0) samples.push(coordinates[threeQuarterIdx]);
   
   // Batch detect countries with rate limiting
   const results: (string | null)[] = [];
   for (let i = 0; i < samples.length; i++) {
     const [lat, lon] = samples[i];
     const country = await detectCountryFromCoordinate(lat, lon);
     results.push(country);
     
     // Small delay to avoid rate limiting (Nominatim allows 1 req/sec)
     if (i < samples.length - 1) {
       await new Promise(r => setTimeout(r, 100));
     }
   }
   
   // Order countries based on first appearance in route
   const orderedCountries: string[] = [];
   for (let i = 0; i < results.length; i++) {
     const country = results[i];
     if (country && !orderedCountries.includes(country)) {
       orderedCountries.push(country);
     }
   }
   
   return orderedCountries;
 };
 
 // Get alerts for detected countries
 export const getAlertsForCountries = (
   countries: string[], 
   routeCoordinates: [number, number][] = []
 ): TravelAlert[] => {
   const alerts: TravelAlert[] = [];
   
   countries.forEach(countryCode => {
     const alert = VIGNETTE_ALERTS[countryCode];
     if (alert) alerts.push(alert);
   });
   
   // Special case: Only add bridge toll if route passes through Fetești-Cernavodă
   if (countries.includes('RO') && routeCoordinates.length > 0) {
     if (routePassesThroughBridge(routeCoordinates)) {
       alerts.push(VIGNETTE_ALERTS.RO_BRIDGE);
     }
   }
   
   // Add speed limit info
   countries.forEach(countryCode => {
     const limits = COUNTRY_SPEED_LIMITS[countryCode];
     if (limits) {
       alerts.push({
         type: 'speed_limit',
         country: getCountryName(countryCode),
         countryCode,
         title: `Limite viteză ${getCountryName(countryCode)}`,
         description: limits.highway === 0 
           ? `Urban: ${limits.urban} km/h | Rural: ${limits.rural} km/h | Autostradă: fără limită`
           : `Urban: ${limits.urban} km/h | Rural: ${limits.rural} km/h | Autostradă: ${limits.highway} km/h`,
         icon: '🚗',
         priority: 3
       });
     }
   });
   
   return alerts.sort((a, b) => a.priority - b.priority);
 };
 
 export const getCountryName = (code: string): string => {
   const names: Record<string, string> = {
     RO: 'România', HU: 'Ungaria', BG: 'Bulgaria', AT: 'Austria',
     DE: 'Germania', CZ: 'Cehia', SK: 'Slovacia', PL: 'Polonia',
     RS: 'Serbia', HR: 'Croația', SI: 'Slovenia', UA: 'Ucraina', MD: 'Moldova'
   };
   return names[code] || code;
 };