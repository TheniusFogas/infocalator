import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  type?: 'website' | 'article' | 'place' | 'event';
  image?: string;
  jsonLd?: Record<string, unknown>;
}

export const useSEO = ({
  title,
  description,
  canonical,
  type = 'website',
  image,
  jsonLd,
}: SEOProps) => {
  useEffect(() => {
    // Update title
    document.title = `${title} | DrumBun România`;
    
    // Update meta tags
    const updateMeta = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    updateMeta('description', description);
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:type', type, true);
    
    if (image) {
      updateMeta('og:image', image, true);
      updateMeta('twitter:image', image);
    }
    
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }
    
    // Add JSON-LD
    if (jsonLd) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }
    
    return () => {
      // Cleanup JSON-LD on unmount
      const script = document.querySelector('script[type="application/ld+json"]');
      if (script) {
        script.remove();
      }
    };
  }, [title, description, canonical, type, image, jsonLd]);
};

// Helper to generate JSON-LD for different content types
export const generateEventJsonLd = (event: {
  title: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  city: string;
  ticketPrice?: string;
  ticketUrl?: string;
  organizer?: string;
  image?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: event.title,
  description: event.description,
  startDate: event.date,
  endDate: event.endDate || event.date,
  location: {
    '@type': 'Place',
    name: event.location,
    address: {
      '@type': 'PostalAddress',
      addressLocality: event.city,
      addressCountry: 'RO',
    },
  },
  organizer: event.organizer ? {
    '@type': 'Organization',
    name: event.organizer,
  } : undefined,
  offers: event.ticketPrice ? {
    '@type': 'Offer',
    price: event.ticketPrice.replace(/[^0-9]/g, ''),
    priceCurrency: 'RON',
    url: event.ticketUrl,
    availability: 'https://schema.org/InStock',
  } : undefined,
  image: event.image,
});

export const generateAccommodationJsonLd = (accommodation: {
  name: string;
  description: string;
  type: string;
  address?: string;
  city?: string;
  rating?: number;
  reviewCount?: number;
  priceMin?: number;
  image?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: accommodation.name,
  description: accommodation.description,
  '@additionalType': accommodation.type,
  address: accommodation.address ? {
    '@type': 'PostalAddress',
    streetAddress: accommodation.address,
    addressLocality: accommodation.city,
    addressCountry: 'RO',
  } : undefined,
  aggregateRating: accommodation.rating ? {
    '@type': 'AggregateRating',
    ratingValue: accommodation.rating,
    reviewCount: accommodation.reviewCount || 1,
  } : undefined,
  priceRange: accommodation.priceMin ? `de la ${accommodation.priceMin} RON` : undefined,
  image: accommodation.image,
});

export const generateAttractionJsonLd = (attraction: {
  title: string;
  description: string;
  category: string;
  location: string;
  city?: string;
  image?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'TouristAttraction',
  name: attraction.title,
  description: attraction.description,
  touristType: attraction.category,
  address: {
    '@type': 'PostalAddress',
    streetAddress: attraction.location,
    addressLocality: attraction.city,
    addressCountry: 'RO',
  },
  image: attraction.image,
});

export const generateLocalityJsonLd = (locality: {
  name: string;
  county: string;
  population?: number;
  latitude?: number;
  longitude?: number;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'City',
  name: locality.name,
  containedInPlace: {
    '@type': 'AdministrativeArea',
    name: `Județul ${locality.county}`,
  },
  geo: locality.latitude && locality.longitude ? {
    '@type': 'GeoCoordinates',
    latitude: locality.latitude,
    longitude: locality.longitude,
  } : undefined,
  population: locality.population ? {
    '@type': 'QuantitativeValue',
    value: locality.population,
  } : undefined,
});

export const generateBreadcrumbJsonLd = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const generateWebsiteJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'DrumBun România',
  description: 'Ghidul tău complet pentru călătorii în România. Descoperă atracții turistice, cazări, evenimente și informații despre drumuri.',
  url: window.location.origin,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${window.location.origin}/vremea?city={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});
