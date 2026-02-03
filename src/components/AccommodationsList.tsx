import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2, Wifi, Car, UtensilsCrossed } from "lucide-react";
import { localInfoApi, Accommodation } from "@/lib/api/localInfo";

interface AccommodationsListProps {
  location: string;
  county?: string;
}

const amenityIcons: Record<string, React.ReactNode> = {
  'WiFi': <Wifi className="w-3 h-3" />,
  'Parcare': <Car className="w-3 h-3" />,
  'Restaurant': <UtensilsCrossed className="w-3 h-3" />,
};

const getPriceColor = (price: string) => {
  switch (price.toLowerCase()) {
    case 'buget': return 'bg-green-500/10 text-green-600';
    case 'mediu': return 'bg-yellow-500/10 text-yellow-600';
    case 'premium': return 'bg-purple-500/10 text-purple-600';
    default: return '';
  }
};

export const AccommodationsList = ({ location, county }: AccommodationsListProps) => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccommodations = async () => {
      setLoading(true);
      setError(null);
      
      const response = await localInfoApi.searchAccommodations(location, county);
      
      if (response.success && response.data?.accommodations) {
        setAccommodations(response.data.accommodations);
      } else {
        setError(response.error || "Nu s-au putut încărca cazările");
      }
      
      setLoading(false);
    };

    fetchAccommodations();
  }, [location, county]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Cazări în {location}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Se caută cazări...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Cazări în {location}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (accommodations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Cazări în {location}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accommodations.map((accommodation, index) => (
            <div 
              key={index} 
              className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-foreground line-clamp-1">{accommodation.name}</h4>
                <Badge variant="outline" className="shrink-0">{accommodation.type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{accommodation.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {accommodation.amenities?.slice(0, 3).map((amenity, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {amenityIcons[amenity] || null}
                      {amenity}
                    </span>
                  ))}
                </div>
                {accommodation.priceRange && (
                  <Badge className={getPriceColor(accommodation.priceRange)}>
                    {accommodation.priceRange}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
