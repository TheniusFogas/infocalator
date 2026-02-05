 // Travel alerts configuration for different countries
 
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
     description: 'Podul peste Dunăre necesită taxă separată de rovinieta (aproximativ 10-30 RON).',
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
 
 // Detect countries along route by sampling coordinates
 export const detectCountriesAlongRoute = async (
   coordinates: [number, number][]
 ): Promise<string[]> => {
   if (coordinates.length === 0) return [];
   
   const countries = new Set<string>();
   
   // Sample coordinates at regular intervals (every ~50km or at least 10 points)
   const sampleSize = Math.min(10, Math.ceil(coordinates.length / 50));
   const step = Math.floor(coordinates.length / sampleSize);
   
   const samples = [
     coordinates[0], // Start
     coordinates[coordinates.length - 1], // End
     ...Array.from({ length: sampleSize - 2 }, (_, i) => 
       coordinates[Math.min((i + 1) * step, coordinates.length - 1)]
     )
   ];
   
   // Batch detect countries
   const results = await Promise.all(
     samples.map(([lat, lon]) => detectCountryFromCoordinate(lat, lon))
   );
   
   results.forEach(country => {
     if (country) countries.add(country);
   });
   
   return Array.from(countries);
 };
 
 // Get alerts for detected countries
 export const getAlertsForCountries = (countries: string[]): TravelAlert[] => {
   const alerts: TravelAlert[] = [];
   
   countries.forEach(countryCode => {
     const alert = VIGNETTE_ALERTS[countryCode];
     if (alert) alerts.push(alert);
     
     // Special cases
     if (countryCode === 'RO' && countries.includes('RO')) {
       alerts.push(VIGNETTE_ALERTS.RO_BRIDGE);
     }
   });
   
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
 
 const getCountryName = (code: string): string => {
   const names: Record<string, string> = {
     RO: 'România', HU: 'Ungaria', BG: 'Bulgaria', AT: 'Austria',
     DE: 'Germania', CZ: 'Cehia', SK: 'Slovacia', PL: 'Polonia',
     RS: 'Serbia', HR: 'Croația', SI: 'Slovenia', UA: 'Ucraina', MD: 'Moldova'
   };
   return names[code] || code;
 };