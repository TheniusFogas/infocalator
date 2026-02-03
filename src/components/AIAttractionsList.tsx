import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Landmark, MapPin, Loader2, Lightbulb } from "lucide-react";
import { localInfoApi, AIAttraction } from "@/lib/api/localInfo";

interface AIAttractionsListProps {
  location: string;
  county?: string;
}

const categoryColors: Record<string, string> = {
  'Muzeu': 'bg-blue-500/10 text-blue-600',
  'Natură': 'bg-green-500/10 text-green-600',
  'Istoric': 'bg-amber-500/10 text-amber-600',
  'Religios': 'bg-purple-500/10 text-purple-600',
  'Recreere': 'bg-cyan-500/10 text-cyan-600',
  'Traseu': 'bg-orange-500/10 text-orange-600',
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
          {attractions.map((attraction, index) => (
            <div 
              key={index} 
              className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-foreground">{attraction.title}</h4>
                <Badge className={categoryColors[attraction.category] || ''}>
                  {attraction.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{attraction.description}</p>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {attraction.location}
                </span>
                {attraction.tips && (
                  <span className="flex items-start gap-1 bg-primary/5 p-2 rounded">
                    <Lightbulb className="w-3 h-3 mt-0.5 text-primary" />
                    <span>{attraction.tips}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
