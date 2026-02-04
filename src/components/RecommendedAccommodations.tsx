import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { getPlaceholderImage } from '@/lib/categoryIcons';

interface CachedAccommodation {
  id: string;
  slug: string;
  name: string;
  type: string;
  location: string;
  county: string | null;
  rating: number | null;
  price_range: string | null;
  image_keywords: string | null;
}

interface RecommendedAccommodationsProps {
  currentSlug?: string;
  location?: string;
  limit?: number;
}

export const RecommendedAccommodations = ({ 
  currentSlug, 
  location,
  limit = 4 
}: RecommendedAccommodationsProps) => {
  const [accommodations, setAccommodations] = useState<CachedAccommodation[]>([]);

  useEffect(() => {
    const fetchAccommodations = async () => {
      let query = supabase
        .from('cached_accommodations')
        .select('id, slug, name, type, location, county, rating, price_range, image_keywords')
        .gt('expires_at', new Date().toISOString())
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(limit + 1); // Get one extra to filter out current

      if (location) {
        query = query.eq('location', location);
      }

      const { data, error } = await query;

      if (!error && data) {
        const filtered = data
          .filter(acc => acc.slug !== currentSlug)
          .slice(0, limit);
        setAccommodations(filtered);
      }
    };

    fetchAccommodations();
  }, [currentSlug, location, limit]);

  if (accommodations.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground text-sm">Alte cazări recomandate</h3>
      <div className="grid grid-cols-2 gap-2">
        {accommodations.map((acc) => (
          <Link
            key={acc.id}
            to={`/cazari/${acc.slug}?location=${encodeURIComponent(acc.location)}${acc.county ? `&county=${encodeURIComponent(acc.county)}` : ''}`}
            className="group block"
          >
            <div className="rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all bg-card">
              <div className="aspect-video relative">
                <img
                  src={getPlaceholderImage(acc.image_keywords || acc.name, 300, 200)}
                  alt={acc.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                {acc.rating && (
                  <Badge className="absolute top-1 right-1 bg-background/90 text-foreground text-xs px-1.5 py-0.5">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-0.5" />
                    {acc.rating}
                  </Badge>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {acc.name}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  {acc.location}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
