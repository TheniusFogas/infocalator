import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Landmark, MapPin, Loader2, Lightbulb, Clock, Ticket, ChevronRight } from "lucide-react";
import { localInfoApi, AIAttraction } from "@/lib/api/localInfo";
import { attractionCategoryIcons, getCategoryIcon, getPlaceholderImage } from "@/lib/categoryIcons";
import { buildDetailUrl, generateSlug } from "@/lib/urlUtils";

interface AIAttractionsListProps {
  location: string;
  county?: string;
}

const categoryColors: Record<string, string> = {
  'Muzeu': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'Natură': 'bg-green-500/10 text-green-600 dark:text-green-400',
  'Istoric': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'Religios': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  'Recreere': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'Traseu': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'Castel': 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  'Cascadă': 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  'Peșteră': 'bg-stone-500/10 text-stone-600 dark:text-stone-400',
  'Lac': 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
};

export const AIAttractionsList = ({ location, county }: AIAttractionsListProps) => {
  const [attractions, setAttractions] = useState<AIAttraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttractions = async () => {
      setLoading(true);
      setError(null);
      
      const response = await localInfoApi.searchAttractions(location, county);
      
      if (response.success && response.data?.attractions) {
        setAttractions(response.data.attractions);
      } else {
        setError(response.error || "Nu s-au putut încărca atracțiile");
      }
      
      setLoading(false);
    };

    fetchAttractions();
  }, [location, county]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            Atracții turistice în {location}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Se caută atracții turistice...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            Atracții turistice în {location}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (attractions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Landmark className="w-5 h-5 text-primary" />
          Atracții turistice în {location}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attractions.map((attraction, index) => {
            const CategoryIcon = getCategoryIcon(attraction.category, attractionCategoryIcons);
            const attractionSlug = attraction.slug || generateSlug(attraction.title);
            
            return (
              <Link
                key={index}
                to={buildDetailUrl('atractii', attractionSlug, location, county)}
                className="group block"
              >
                <div className="flex gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 relative">
                    <img 
                      src={getPlaceholderImage(attraction.imageKeywords || attraction.title, 200, 200)}
                      alt={attraction.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute bottom-1 left-1 bg-background/90 rounded p-1">
                      <CategoryIcon className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Badge className={categoryColors[attraction.category] || 'bg-muted text-muted-foreground'}>
                        {attraction.category}
                      </Badge>
                      {attraction.isPaid ? (
                        <Badge variant="outline" className="shrink-0">
                          <Ticket className="w-3 h-3 mr-1" />
                          {attraction.entryFee || 'Cu plată'}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 shrink-0">Gratuit</Badge>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {attraction.title}
                    </h4>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{attraction.description}</p>
                    
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {attraction.location}
                      </span>
                      {attraction.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {attraction.duration}
                        </span>
                      )}
                    </div>
                    
                    {attraction.tips && (
                      <div className="flex items-start gap-1 bg-primary/5 p-2 rounded mt-2 text-xs">
                        <Lightbulb className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                        <span className="text-muted-foreground line-clamp-1">{attraction.tips}</span>
                      </div>
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
