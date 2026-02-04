import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface AffiliateLink {
  id: string;
  platform: string;
  base_url: string;
  affiliate_id: string | null;
  tracking_params: string | null;
  priority: number;
  logo_url: string | null;
}

interface AffiliateBookingLinksProps {
  accommodationName: string;
  location: string;
  className?: string;
  showAll?: boolean;
}

export const AffiliateBookingLinks = ({ 
  accommodationName, 
  location, 
  className = '',
  showAll = false 
}: AffiliateBookingLinksProps) => {
  const [links, setLinks] = useState<AffiliateLink[]>([]);

  useEffect(() => {
    const fetchLinks = async () => {
      const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (!error && data) {
        setLinks(data);
      }
    };

    fetchLinks();
  }, []);

  const buildUrl = (link: AffiliateLink) => {
    const searchQuery = encodeURIComponent(`${accommodationName} ${location}`);
    let url = link.base_url;
    
    // Add search query based on platform
    if (link.platform === 'Booking.com') {
      url += `?ss=${searchQuery}`;
    } else if (link.platform === 'Airbnb') {
      url += `${searchQuery}/homes`;
    } else if (link.platform.includes('Travelminit') || link.platform.includes('Infopensiuni')) {
      url += `?q=${searchQuery}`;
    } else {
      url += `?search=${searchQuery}`;
    }
    
    // Add affiliate tracking if available
    if (link.affiliate_id) {
      url += `&aid=${link.affiliate_id}`;
    }
    if (link.tracking_params) {
      url += `&${link.tracking_params}`;
    }
    
    return url;
  };

  const displayLinks = showAll ? links : links.slice(0, 3);

  if (links.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm text-muted-foreground mb-3">Rezervă prin:</p>
      <div className="flex flex-wrap gap-2">
        {displayLinks.map((link) => (
          <Button
            key={link.id}
            variant="outline"
            size="sm"
            className="gap-2"
            asChild
          >
            <a 
              href={buildUrl(link)} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {link.platform}
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
};
