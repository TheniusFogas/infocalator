import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdZoneProps {
  zoneKey: string;
  className?: string;
}

interface AdZoneData {
  ad_code: string | null;
  is_active: boolean;
}

export const AdZone = ({ zoneKey, className = '' }: AdZoneProps) => {
  const [adCode, setAdCode] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const fetchAdZone = async () => {
      const { data, error } = await supabase
        .from('ad_zones')
        .select('ad_code, is_active')
        .eq('zone_key', zoneKey)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        setAdCode(data.ad_code);
        setIsActive(data.is_active);
      }
    };

    fetchAdZone();
  }, [zoneKey]);

  // Don't render anything if ad is not active or has no code
  if (!isActive || !adCode) {
    return null;
  }

  return (
    <div 
      className={`ad-zone ${className}`}
      dangerouslySetInnerHTML={{ __html: adCode }}
    />
  );
};
