 import { useEffect } from 'react';
 
 interface SEOHeadProps {
   title: string;
   description: string;
   canonical?: string;
   image?: string;
   type?: 'website' | 'article';
   jsonLd?: object;
 }
 
 export const SEOHead = ({ 
   title, 
   description, 
   canonical,
   image = '/placeholder.svg',
   type = 'website',
   jsonLd
 }: SEOHeadProps) => {
   useEffect(() => {
     // Update document title
     document.title = title;
 
     // Helper to update or create meta tags
     const updateMeta = (name: string, content: string, property = false) => {
       const attr = property ? 'property' : 'name';
       let tag = document.querySelector(`meta[${attr}="${name}"]`);
       if (tag) {
         tag.setAttribute('content', content);
       } else {
         tag = document.createElement('meta');
         tag.setAttribute(attr, name);
         tag.setAttribute('content', content);
         document.head.appendChild(tag);
       }
     };
 
     // Basic meta tags
     updateMeta('description', description);
     
     // Open Graph tags
     updateMeta('og:title', title, true);
     updateMeta('og:description', description, true);
     updateMeta('og:type', type, true);
     updateMeta('og:image', image, true);
     if (canonical) {
       updateMeta('og:url', canonical, true);
     }
 
     // Twitter Card tags
     updateMeta('twitter:card', 'summary_large_image');
     updateMeta('twitter:title', title);
     updateMeta('twitter:description', description);
     updateMeta('twitter:image', image);
 
     // Canonical link
     if (canonical) {
       let canonicalTag = document.querySelector('link[rel="canonical"]');
       if (canonicalTag) {
         canonicalTag.setAttribute('href', canonical);
       } else {
         canonicalTag = document.createElement('link');
         canonicalTag.setAttribute('rel', 'canonical');
         canonicalTag.setAttribute('href', canonical);
         document.head.appendChild(canonicalTag);
       }
     }
 
     // JSON-LD structured data
     if (jsonLd) {
       let scriptTag = document.querySelector('script[type="application/ld+json"]');
       if (scriptTag) {
         scriptTag.textContent = JSON.stringify(jsonLd);
       } else {
         scriptTag = document.createElement('script');
         scriptTag.setAttribute('type', 'application/ld+json');
         scriptTag.textContent = JSON.stringify(jsonLd);
         document.head.appendChild(scriptTag);
       }
     }
 
     // Cleanup on unmount
     return () => {
       const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
       if (jsonLdScript) {
         jsonLdScript.remove();
       }
     };
   }, [title, description, canonical, image, type, jsonLd]);
 
   return null;
 };
 
 // Helper to generate attraction JSON-LD
 export const generateAttractionJsonLd = (attraction: {
   title: string;
   description: string;
   location: string;
   county?: string;
   category?: string;
   image?: string;
   lat?: number;
   lng?: number;
 }) => ({
   '@context': 'https://schema.org',
   '@type': 'TouristAttraction',
   name: attraction.title,
   description: attraction.description,
   image: attraction.image,
   address: {
     '@type': 'PostalAddress',
     addressLocality: attraction.location,
     addressRegion: attraction.county,
     addressCountry: 'RO',
   },
   ...(attraction.lat && attraction.lng && {
     geo: {
       '@type': 'GeoCoordinates',
       latitude: attraction.lat,
       longitude: attraction.lng,
     },
   }),
 });
 
 // Helper to generate accommodation JSON-LD  
 export const generateAccommodationJsonLd = (accommodation: {
   name: string;
   description: string;
   location: string;
   county?: string;
   stars?: number;
   priceRange?: string;
   image?: string;
 }) => ({
   '@context': 'https://schema.org',
   '@type': 'LodgingBusiness',
   name: accommodation.name,
   description: accommodation.description,
   image: accommodation.image,
   priceRange: accommodation.priceRange,
   starRating: accommodation.stars ? {
     '@type': 'Rating',
     ratingValue: accommodation.stars,
   } : undefined,
   address: {
     '@type': 'PostalAddress',
     addressLocality: accommodation.location,
     addressRegion: accommodation.county,
     addressCountry: 'RO',
   },
 });
 
 // Helper to generate local business JSON-LD
 export const generateLocalityJsonLd = (locality: {
   name: string;
   county: string;
   population?: number;
   lat?: number;
   lng?: number;
 }) => ({
   '@context': 'https://schema.org',
   '@type': 'City',
   name: locality.name,
   containedInPlace: {
     '@type': 'AdministrativeArea',
     name: locality.county,
   },
   ...(locality.lat && locality.lng && {
     geo: {
       '@type': 'GeoCoordinates',
       latitude: locality.lat,
       longitude: locality.lng,
     },
   }),
 });