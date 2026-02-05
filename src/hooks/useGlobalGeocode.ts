 import { useState, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { normalizeText } from '@/lib/textUtils';
 import { cacheSearchResults, getCachedSearchResults } from '@/lib/routeCache';
 
 export interface GeoLocation {
   id?: string;
   name: string;
   displayName: string;
   county?: string;
   country?: string;
   latitude: number;
   longitude: number;
   type: string;
   population?: number;
   isLocal?: boolean;
 }
 
 export const useGlobalGeocode = () => {
   const [isSearching, setIsSearching] = useState(false);
   
   const searchLocations = useCallback(async (query: string): Promise<GeoLocation[]> => {
     if (!query || query.length < 2) return [];
     
     const normalizedQuery = normalizeText(query);
     
     // Check cache first
     const cached = getCachedSearchResults(normalizedQuery);
     if (cached) return cached;
     
     setIsSearching(true);
     const results: GeoLocation[] = [];
     
     try {
       // 1. Search local localities table with ASCII-normalized search
       const { data: localData } = await supabase
         .from('localities')
         .select('*')
         .or(`name.ilike.%${query}%,name_ascii.ilike.%${normalizedQuery}%`)
         .order('population', { ascending: false, nullsFirst: false })
         .limit(8);
       
       if (localData && localData.length > 0) {
         localData.forEach(loc => {
           results.push({
             id: loc.id,
             name: loc.name,
             displayName: `${loc.name}, ${loc.county}, România`,
             county: loc.county,
             country: 'România',
             latitude: Number(loc.latitude),
             longitude: Number(loc.longitude),
             type: loc.locality_type,
             population: loc.population || 0,
             isLocal: true
           });
         });
       }
       
       // 2. Also search cities table as fallback
       const { data: citiesData } = await supabase
         .from('cities')
         .select('*')
         .ilike('name', `%${query}%`)
         .order('population', { ascending: false })
         .limit(5);
       
       if (citiesData && citiesData.length > 0) {
         citiesData.forEach(city => {
           // Avoid duplicates
           if (!results.find(r => normalizeText(r.name) === normalizeText(city.name) && r.county === city.county)) {
             results.push({
               id: city.id,
               name: city.name,
               displayName: `${city.name}, ${city.county}, România`,
               county: city.county,
               country: 'România',
               latitude: city.latitude || 0,
               longitude: city.longitude || 0,
               type: city.city_type,
               population: city.population,
               isLocal: true
             });
           }
         });
       }
       
       // 3. If no local results OR query might be international, use Nominatim
       if (results.length < 3) {
         const nominatimResults = await searchNominatim(query);
         
         nominatimResults.forEach(nom => {
           // Avoid duplicates with local results
           const isDuplicate = results.find(r => 
             normalizeText(r.name) === normalizeText(nom.name) &&
             (r.country === nom.country || (r.country === 'România' && nom.country === 'Romania'))
           );
           
           if (!isDuplicate) {
             results.push(nom);
           }
         });
       }
       
       // Cache results
       if (results.length > 0) {
         cacheSearchResults(normalizedQuery, results);
       }
       
       return results.slice(0, 10);
     } catch (error) {
       console.error('Search error:', error);
       return [];
     } finally {
       setIsSearching(false);
     }
   }, []);
   
   return { searchLocations, isSearching };
 };
 
 // Nominatim search for global locations
 async function searchNominatim(query: string): Promise<GeoLocation[]> {
   try {
     const response = await fetch(
       `https://nominatim.openstreetmap.org/search?` +
       `q=${encodeURIComponent(query)}&` +
       `format=json&addressdetails=1&limit=8&accept-language=ro`,
       { headers: { 'User-Agent': 'RomaniaTravel/1.0 (contact@disdis.ro)' } }
     );
     
     if (!response.ok) return [];
     
     const data = await response.json();
     
     return data
       .filter((item: any) => {
         // Filter to populated places
         const type = item.type || item.class;
         const validTypes = ['city', 'town', 'village', 'municipality', 'administrative', 'hamlet'];
         return validTypes.some(t => type?.includes(t)) || 
                item.class === 'place' || 
                item.class === 'boundary';
       })
       .map((item: any) => {
         const address = item.address || {};
         const name = address.city || address.town || address.village || 
                      address.municipality || item.name || '';
         const county = address.county || address.state || '';
         const country = address.country || '';
         
         return {
           name,
           displayName: item.display_name,
           county,
           country,
           latitude: parseFloat(item.lat),
           longitude: parseFloat(item.lon),
           type: item.type === 'city' ? 'Oraș' : 
                 item.type === 'town' ? 'Oraș' : 
                 item.type === 'village' ? 'Sat' : 'Localitate',
           isLocal: false
         };
       })
       .filter((loc: GeoLocation) => loc.name);
   } catch (error) {
     console.error('Nominatim search error:', error);
     return [];
   }
 }