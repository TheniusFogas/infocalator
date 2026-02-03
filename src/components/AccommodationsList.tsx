import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2, Star, ChevronRight } from "lucide-react";
import { localInfoApi, Accommodation } from "@/lib/api/localInfo";
import { accommodationTypeIcons, amenityIcons, getCategoryIcon, getPlaceholderImage, priceRangeColors } from "@/lib/categoryIcons";

interface AccommodationsListProps {
  location: string;
  county?: string;
}

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
          {accommodations.map((accommodation, index) => {
            const TypeIcon = getCategoryIcon(accommodation.type, accommodationTypeIcons);
            const accommodationSlug = accommodation.slug || accommodation.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            
            return (
              <Link
                key={index}
                to={`/cazari/${accommodationSlug}?location=${encodeURIComponent(location)}${county ? `&county=${encodeURIComponent(county)}` : ''}`}
                className="group block"
              >
                <div className="flex gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 relative">
                    <img 
                      src={getPlaceholderImage(accommodation.imageKeywords || accommodation.name, 200, 200)}
                      alt={accommodation.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {accommodation.rating && (
                      <div className="absolute bottom-1 left-1 bg-background/90 rounded px-1.5 py-0.5 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">{accommodation.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-primary shrink-0" />
                        <Badge variant="outline" className="text-xs">{accommodation.type}</Badge>
                      </div>
                      {accommodation.priceRange && (
                        <Badge className={`shrink-0 ${priceRangeColors[accommodation.priceRange] || ''}`}>
                          {accommodation.priceRange}
                        </Badge>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {accommodation.name}
                    </h4>
                    
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{accommodation.description}</p>
                    
                    {/* Amenities */}
                    <div className="flex gap-2 flex-wrap">
                      {accommodation.amenities?.slice(0, 3).map((amenity, i) => {
                        const AmenityIcon = amenityIcons[amenity];
                        return (
                          <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {AmenityIcon && <AmenityIcon className="w-3 h-3" />}
                            {amenity}
                          </span>
                        );
                      })}
                      {accommodation.amenities && accommodation.amenities.length > 3 && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          +{accommodation.amenities.length - 3}
                        </span>
                      )}
                    </div>
                    
                    {/* Price */}
                    {accommodation.pricePerNight && (
                      <p className="text-sm font-medium text-primary mt-2">
                        de la {accommodation.pricePerNight.min} {accommodation.pricePerNight.currency}/noapte
                      </p>
                    )}
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 self-center" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
