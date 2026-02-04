import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { getPlaceholderImage, attractionCategoryIcons, getCategoryIcon } from '@/lib/categoryIcons';

interface CachedAttraction {
  id: string;
  slug: string;
  title: string;
  category: string;
  location: string;
  county: string | null;
  image_keywords: string | null;
}

interface RecommendedAttractionsProps {
  currentSlug?: string;
  location?: string;
  limit?: number;
}

export const RecommendedAttractions = ({ 
  currentSlug, 
  location,
  limit = 4 
}: RecommendedAttractionsProps) => {
  const [attractions, setAttractions] = useState<CachedAttraction[]>([]);

  useEffect(() => {
    const fetchAttractions = async () => {
      let query = supabase
        .from('cached_attractions')
        .select('id, slug, title, category, location, county, image_keywords')
        .gt('expires_at', new Date().toISOString())
        .limit(limit + 1);

      if (location) {
        query = query.eq('location', location);
      }

      const { data, error } = await query;

      if (!error && data) {
        const filtered = data
          .filter(attr => attr.slug !== currentSlug)
          .slice(0, limit);
        setAttractions(filtered);
      }
    };

    fetchAttractions();
  }, [currentSlug, location, limit]);

  if (attractions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground text-sm">Atracții în zonă</h3>
      <div className="grid grid-cols-2 gap-2">
        {attractions.map((attr) => {
          const CategoryIcon = getCategoryIcon(attr.category, attractionCategoryIcons);
          return (
            <Link
              key={attr.id}
              to={`/atractii-ai/${attr.slug}?location=${encodeURIComponent(attr.location)}${attr.county ? `&county=${encodeURIComponent(attr.county)}` : ''}`}
              className="group block"
            >
              <div className="rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all bg-card">
                <div className="aspect-video relative">
                  <img
                    src={getPlaceholderImage(attr.image_keywords || attr.title, 300, 200)}
                    alt={attr.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <Badge className="absolute top-1 left-1 bg-background/90 text-foreground text-xs px-1.5 py-0.5 gap-1">
                    <CategoryIcon className="w-3 h-3" />
                    {attr.category}
                  </Badge>
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {attr.title}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    {attr.location}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
