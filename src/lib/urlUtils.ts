 /**
  * Generate URL with city in path
  * Format: /:oras/:type/:slug
  */
 
 function normalizeForUrl(text: string): string {
   return text
     .toLowerCase()
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
     .replace(/[^a-z0-9]+/g, '-')
     .replace(/^-+|-+$/g, '');
 }
 
 export function generateSlug(text: string): string {
   return normalizeForUrl(text).substring(0, 60);
 }
 
 export function buildDetailUrl(
   type: 'cazari' | 'atractii' | 'restaurante' | 'evenimente',
   slug: string,
   location: string,
   county?: string
 ): string {
   const normalizedLocation = normalizeForUrl(location);
   
   // For legacy compatibility, if location is generic, use query params
   if (!normalizedLocation || normalizedLocation === 'romania') {
     const params = new URLSearchParams();
     params.set('location', location);
     if (county) params.set('county', county);
     return `/${type}/${slug}?${params.toString()}`;
   }
   
   // New format: /oras/type/slug
   let url = `/${normalizedLocation}/${type}/${slug}`;
   if (county) {
     url += `?county=${encodeURIComponent(county)}`;
   }
   return url;
 }