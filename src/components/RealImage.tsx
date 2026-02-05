 import { useState, useEffect } from 'react';
 import { Loader2, ImageOff } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface RealImageProps {
   name: string;
   location?: string;
   type?: 'attraction' | 'locality' | 'accommodation' | 'event';
   fallbackKeywords?: string;
   className?: string;
   alt?: string;
   width?: number;
   height?: number;
 }
 
 // Abstract art color palette for fallbacks
 const abstractColors = [
   { bg: '#1a365d', accent: '#63b3ed' }, // Deep blue
   { bg: '#234e52', accent: '#81e6d9' }, // Teal
   { bg: '#44337a', accent: '#b794f4' }, // Purple
   { bg: '#702459', accent: '#ed64a6' }, // Pink
   { bg: '#744210', accent: '#f6ad55' }, // Orange
   { bg: '#22543d', accent: '#68d391' }, // Green
 ];
 
 // Generate deterministic color based on seed
 function getColorPair(seed: string): { bg: string; accent: string } {
   let hash = 0;
   for (let i = 0; i < seed.length; i++) {
     hash = ((hash << 5) - hash) + seed.charCodeAt(i);
     hash = hash & hash;
   }
   return abstractColors[Math.abs(hash) % abstractColors.length];
 }
 
 // In-memory image URL cache
 const imageCache = new Map<string, string>();
 
 export const RealImage = ({
   name,
   location,
   type = 'attraction',
   fallbackKeywords,
   className,
   alt,
   width = 800,
   height = 600
 }: RealImageProps) => {
   const [imageUrl, setImageUrl] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(false);
 
   const cacheKey = `${type}:${name}:${location || ''}`;
   const colors = getColorPair(name + (location || ''));
 
   useEffect(() => {
     // Check cache first
     if (imageCache.has(cacheKey)) {
       setImageUrl(imageCache.get(cacheKey)!);
       setLoading(false);
       return;
     }
 
     const fetchImage = async () => {
       setLoading(true);
       setError(false);
 
       try {
         // Try Wikimedia Commons search
         const query = location ? `${name} ${location} Romania` : `${name} Romania`;
         const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=1&format=json&origin=*`;
         
         const searchRes = await fetch(searchUrl);
         if (!searchRes.ok) throw new Error('Search failed');
         
         const searchData = await searchRes.json();
         const title = searchData.query?.search?.[0]?.title;
         
         if (title) {
           // Get image URL
           const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&iiurlwidth=${width}&format=json&origin=*`;
           const infoRes = await fetch(infoUrl);
           
           if (infoRes.ok) {
             const infoData = await infoRes.json();
             const pages = infoData.query?.pages || {};
             const page = Object.values(pages)[0] as any;
             const thumbUrl = page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url;
             
             if (thumbUrl) {
               imageCache.set(cacheKey, thumbUrl);
               setImageUrl(thumbUrl);
               setLoading(false);
               return;
             }
           }
         }
         
         // No image found - use abstract placeholder
         setError(true);
       } catch (err) {
         console.error('Image fetch error:', err);
         setError(true);
       } finally {
         setLoading(false);
       }
     };
 
     fetchImage();
   }, [name, location, type, cacheKey, width]);
 
   if (loading) {
     return (
       <div 
         className={cn(
           "flex items-center justify-center bg-muted animate-pulse",
           className
         )}
         style={{ aspectRatio: `${width}/${height}` }}
       >
         <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
       </div>
     );
   }
 
   if (error || !imageUrl) {
     // Abstract art fallback with gradient
     return (
       <div 
         className={cn("relative overflow-hidden", className)}
         style={{ 
           aspectRatio: `${width}/${height}`,
           background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent} 100%)`
         }}
       >
         {/* Abstract pattern overlay */}
         <div 
           className="absolute inset-0 opacity-30"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
           }}
         />
         <div className="absolute inset-0 flex items-center justify-center">
           <div className="text-white/60 text-center p-4">
             <ImageOff className="w-8 h-8 mx-auto mb-2" />
             <p className="text-sm font-medium">{name}</p>
             {location && <p className="text-xs opacity-75">{location}</p>}
           </div>
         </div>
       </div>
     );
   }
 
   return (
     <img
       src={imageUrl}
       alt={alt || `${name}${location ? ` - ${location}` : ''}`}
       className={className}
       onError={() => setError(true)}
     />
   );
 };