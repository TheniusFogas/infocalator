 import { supabase } from '@/integrations/supabase/client';
 
 export interface RealImage {
   url: string;
   source: 'wikimedia' | 'osm' | 'placeholder';
   attribution?: string;
 }
 
 // Cache for fetched images (in-memory)
 const imageCache: Map<string, RealImage[]> = new Map();
 
 // Fetch real images from Wikimedia/Wikidata
 export async function fetchRealImages(
   name: string,
   location?: string,
   type: 'attraction' | 'locality' | 'accommodation' | 'event' = 'attraction'
 ): Promise<RealImage[]> {
   const cacheKey = `${type}:${name}:${location || ''}`;
   
   // Check memory cache first
   if (imageCache.has(cacheKey)) {
     return imageCache.get(cacheKey)!;
   }
   
   try {
     const { data, error } = await supabase.functions.invoke('fetch-real-images', {
       body: { type, name, location }
     });
     
     if (error) {
       console.error('Error fetching images:', error);
       return [];
     }
     
     const images = data?.images || [];
     
     // Cache the results
     if (images.length > 0) {
       imageCache.set(cacheKey, images);
     }
     
     return images;
   } catch (error) {
     console.error('Image fetch failed:', error);
     return [];
   }
 }
 
 // Get Wikimedia Commons image URL directly (for known items)
 export function getWikimediaImageUrl(imageName: string, width: number = 640): string {
   if (!imageName) return '';
   
   // If it's already a full URL, return it
   if (imageName.startsWith('http')) {
     return imageName;
   }
   
   // Clean up the image name
   const cleanName = imageName.replace(/ /g, '_');
   
   // Generate Wikimedia Commons thumbnail URL
   // Note: This is a simplified version - real implementation would need MD5 hash
   return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(cleanName)}?width=${width}`;
 }
 
 // Get image URL with fallback to placeholder
 export function getImageWithFallback(
   imageUrl: string | null | undefined,
   keywords: string,
   width: number = 800,
   height: number = 600
 ): string {
   // If we have a real image URL, use it
   if (imageUrl && imageUrl.startsWith('http')) {
     return imageUrl;
   }
   
   // Fallback to placeholder with better keywords
   const seed = keywords.replace(/\s+/g, '-').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
   return `https://picsum.photos/seed/${seed}/${width}/${height}`;
 }
 
 // Search Wikimedia Commons directly from client (for immediate results)
 export async function searchWikimediaImages(query: string, limit: number = 3): Promise<RealImage[]> {
   try {
     // Search for files on Wikimedia Commons
     const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' Romania')}&srnamespace=6&srlimit=${limit}&format=json&origin=*`;
     
     const searchRes = await fetch(searchUrl);
     if (!searchRes.ok) return [];
     
     const searchData = await searchRes.json();
     const titles = searchData.query?.search?.map((s: any) => s.title) || [];
     
     if (titles.length === 0) return [];
     
     // Get image info
     const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.join('|'))}&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*`;
     
     const infoRes = await fetch(infoUrl);
     if (!infoRes.ok) return [];
     
     const infoData = await infoRes.json();
     const pages = infoData.query?.pages || {};
     
     const images: RealImage[] = [];
     for (const pageId of Object.keys(pages)) {
       const page = pages[pageId];
       const thumbUrl = page.imageinfo?.[0]?.thumburl;
       if (thumbUrl) {
         images.push({
           url: thumbUrl,
           source: 'wikimedia',
           attribution: 'Wikimedia Commons'
         });
       }
     }
     
     return images;
   } catch (error) {
     console.error('Wikimedia search error:', error);
     return [];
   }
 }