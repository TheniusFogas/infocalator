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
 
// Validate image URL - exclude PDFs, logos, etc
function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  
  // Exclude PDFs and bad patterns
  const badPatterns = ['.pdf', '.doc', '.svg', 'logo', 'map', 'coat_of_arms', 'monitorul', 'blason', 'stemă', 'flag', 'icon', 'symbol'];
  for (const pattern of badPatterns) {
    if (lowerUrl.includes(pattern)) return false;
  }
  
  // Must have valid image extension
  return lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('.png') || lowerUrl.includes('.webp');
}

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
          // First try Wikipedia REST API for main image (most reliable)
          const wikiTitle = name.replace(/ /g, '_');
          const wikiUrl = `https://ro.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
         
          const wikiRes = await fetch(wikiUrl);
          if (wikiRes.ok) {
            const wikiData = await wikiRes.json();
            const wikiImage = wikiData.thumbnail?.source || wikiData.originalimage?.source;
            
            if (wikiImage && isValidImageUrl(wikiImage)) {
              imageCache.set(cacheKey, wikiImage);
              setImageUrl(wikiImage);
              setLoading(false);
              return;
            }
          }
         
          // Fallback: try Wikimedia Commons search with better query
          const query = location 
            ? `${name} ${location} Romania photograph -logo -map -coat` 
            : `${name} Romania photograph -logo -map -coat`;
          const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=5&format=json&origin=*`;
         
          const searchRes = await fetch(searchUrl);
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const titles = searchData.query?.search?.map((s: any) => s.title).filter((t: string) => {
              const lower = t.toLowerCase();
              return !lower.includes('.pdf') && !lower.includes('logo') && !lower.includes('map') && !lower.includes('coat');
            }) || [];
           
            if (titles.length > 0) {
              const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.slice(0, 3).join('|'))}&prop=imageinfo&iiprop=url|mime&iiurlwidth=${width}&format=json&origin=*`;
              const infoRes = await fetch(infoUrl);
              
              if (infoRes.ok) {
                const infoData = await infoRes.json();
                const pages = infoData.query?.pages || {};
                
                for (const pageId of Object.keys(pages)) {
                  const page = pages[pageId];
                  const imageInfo = page?.imageinfo?.[0];
                  const thumbUrl = imageInfo?.thumburl || imageInfo?.url;
                  const mimeType = imageInfo?.mime || '';
                  
                  if (thumbUrl && mimeType.startsWith('image/') && isValidImageUrl(thumbUrl)) {
                    imageCache.set(cacheKey, thumbUrl);
                    setImageUrl(thumbUrl);
                    setLoading(false);
                    return;
                  }
                }
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