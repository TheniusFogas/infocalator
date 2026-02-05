 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 
 export interface RealImage {
   url: string;
   source: 'wikimedia' | 'wikidata' | 'external' | 'placeholder';
   attribution?: string;
 }
 
 // Abstract art placeholders for when no real image is found
 const abstractArtPatterns = [
   'abstract-art-geometric',
   'abstract-landscape-modern',
   'abstract-nature-colorful',
   'abstract-minimalist-shapes',
   'abstract-watercolor-soft',
   'abstract-expressionist-vibrant',
 ];
 
 // Generate a deterministic abstract art placeholder
 function getAbstractPlaceholder(seed: string, width: number = 800, height: number = 600): string {
   const pattern = abstractArtPatterns[Math.abs(hashCode(seed)) % abstractArtPatterns.length];
   const hue = Math.abs(hashCode(seed + 'hue')) % 360;
   // Use a gradient background as abstract art
   return `https://dummyimage.com/${width}x${height}/${hslToHex(hue, 60, 50)}/${hslToHex((hue + 180) % 360, 40, 80)}.png&text=`;
 }
 
 function hashCode(str: string): number {
   let hash = 0;
   for (let i = 0; i < str.length; i++) {
     const char = str.charCodeAt(i);
     hash = ((hash << 5) - hash) + char;
     hash = hash & hash;
   }
   return hash;
 }
 
 function hslToHex(h: number, s: number, l: number): string {
   s /= 100;
   l /= 100;
   const a = s * Math.min(l, 1 - l);
   const f = (n: number) => {
     const k = (n + h / 30) % 12;
     const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
     return Math.round(255 * color).toString(16).padStart(2, '0');
   };
   return `${f(0)}${f(8)}${f(4)}`;
 }
 
 // In-memory cache for faster repeated lookups
 const imageCache = new Map<string, RealImage[]>();
 
 export function useRealImages(
   name: string,
   location?: string,
   type: 'attraction' | 'locality' | 'accommodation' | 'event' = 'attraction'
 ) {
   const [images, setImages] = useState<RealImage[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     if (!name) {
       setLoading(false);
       return;
     }
 
     const cacheKey = `${type}:${name}:${location || ''}`;
     
     // Check cache first
     if (imageCache.has(cacheKey)) {
       setImages(imageCache.get(cacheKey)!);
       setLoading(false);
       return;
     }
 
     const fetchImages = async () => {
       setLoading(true);
       setError(null);
 
       try {
         // Try fetching from edge function
         const { data, error: fetchError } = await supabase.functions.invoke('fetch-real-images', {
           body: { type, name, location }
         });
 
         if (fetchError) {
           console.error('Error fetching real images:', fetchError);
           // Fall back to Wikimedia direct search
           const wikimediaImages = await searchWikimediaDirectly(name, location);
           if (wikimediaImages.length > 0) {
             setImages(wikimediaImages);
             imageCache.set(cacheKey, wikimediaImages);
           } else {
             // Use abstract art placeholder
             const placeholder: RealImage = {
               url: getAbstractPlaceholder(name + (location || ''), 800, 600),
               source: 'placeholder',
               attribution: 'Abstract placeholder'
             };
             setImages([placeholder]);
           }
         } else if (data?.images && data.images.length > 0) {
           setImages(data.images);
           imageCache.set(cacheKey, data.images);
         } else {
           // Try direct Wikimedia search as fallback
           const wikimediaImages = await searchWikimediaDirectly(name, location);
           if (wikimediaImages.length > 0) {
             setImages(wikimediaImages);
             imageCache.set(cacheKey, wikimediaImages);
           } else {
             const placeholder: RealImage = {
               url: getAbstractPlaceholder(name + (location || ''), 800, 600),
               source: 'placeholder',
               attribution: 'Abstract placeholder'
             };
             setImages([placeholder]);
           }
         }
       } catch (err) {
         console.error('Image fetch error:', err);
         setError('Failed to fetch images');
         const placeholder: RealImage = {
           url: getAbstractPlaceholder(name + (location || ''), 800, 600),
           source: 'placeholder',
           attribution: 'Abstract placeholder'
         };
         setImages([placeholder]);
       } finally {
         setLoading(false);
       }
     };
 
     fetchImages();
   }, [name, location, type]);
 
   return { images, loading, error, mainImage: images[0] || null };
 }
 
 // Direct Wikimedia Commons search (client-side fallback)
 async function searchWikimediaDirectly(name: string, location?: string): Promise<RealImage[]> {
   try {
     const query = location ? `${name} ${location} Romania` : `${name} Romania`;
     const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=5&format=json&origin=*`;
     
     const searchRes = await fetch(searchUrl);
     if (!searchRes.ok) return [];
     
     const searchData = await searchRes.json();
     const titles = searchData.query?.search?.map((s: any) => s.title) || [];
     
     if (titles.length === 0) return [];
     
     // Get image info
     const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.join('|'))}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;
     
     const infoRes = await fetch(infoUrl);
     if (!infoRes.ok) return [];
     
     const infoData = await infoRes.json();
     const pages = infoData.query?.pages || {};
     
     const images: RealImage[] = [];
     for (const pageId of Object.keys(pages)) {
       const page = pages[pageId];
       const thumbUrl = page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url;
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
     console.error('Wikimedia direct search error:', error);
     return [];
   }
 }
 
 // Export utility to get abstract placeholder
 export function getAbstractArtPlaceholder(seed: string, width: number = 800, height: number = 600): string {
   return getAbstractPlaceholder(seed, width, height);
 }