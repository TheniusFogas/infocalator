import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  Eye, 
  Calendar, 
  ArrowLeft, 
  Building2, 
  Navigation,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface Attraction {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string;
  location: string;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  views: number;
  created_at: string;
}

const AtractieDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [attraction, setAttraction] = useState<Attraction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttraction = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("attractions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching attraction:", error);
      } else if (data) {
        setAttraction(data);
        // Increment views
        await supabase
          .from("attractions")
          .update({ views: data.views + 1 })
          .eq("id", id);
      }
      setLoading(false);
    };

    loadAttraction();
  }, [id]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: ro });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-96 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!attraction) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Atracție negăsită</h1>
          <p className="text-muted-foreground mb-6">Ne pare rău, această atracție nu există.</p>
          <Button asChild>
            <Link to="/atractii">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Înapoi la atracții
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Breadcrumb */}
        <section className="px-4 py-4 border-b border-border">
          <div className="container mx-auto">
            <Link 
              to="/atractii" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Înapoi la atracții
            </Link>
          </div>
        </section>

        {/* Hero Image */}
        {attraction.image_url && (
          <section className="relative h-[40vh] md:h-[50vh] overflow-hidden">
            <img 
              src={attraction.image_url} 
              alt={attraction.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="container mx-auto">
                <Badge className="mb-3">{attraction.category}</Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{attraction.title}</h1>
              </div>
            </div>
          </section>
        )}

        {/* Content */}
        <section className="px-4 py-8">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {!attraction.image_url && (
                  <>
                    <Badge>{attraction.category}</Badge>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">{attraction.title}</h1>
                  </>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{attraction.location}{attraction.county && `, ${attraction.county}`}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{attraction.views} vizualizări</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(attraction.created_at)}</span>
                  </div>
                </div>

                <div className="prose prose-neutral max-w-none">
                  <p className="text-foreground leading-relaxed">
                    {attraction.description || "Nu există o descriere disponibilă pentru această atracție."}
                  </p>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Actions Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Explorează</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start gap-3" asChild>
                      <a 
                        href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(attraction.location + ', Romania')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Building2 className="w-4 h-4" />
                        Cazări în zonă
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    </Button>
                    
                    {attraction.latitude && attraction.longitude && (
                      <Button variant="outline" className="w-full justify-start gap-3" asChild>
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${attraction.latitude},${attraction.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation className="w-4 h-4" />
                          Navigare
                          <ExternalLink className="w-3 h-3 ml-auto" />
                        </a>
                      </Button>
                    )}
                    
                    <Button variant="outline" className="w-full justify-start gap-3" asChild>
                      <a 
                        href={`https://www.google.com/search?q=${encodeURIComponent(attraction.title + ' evenimente')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Calendar className="w-4 h-4" />
                        Evenimente în zonă
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Location Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Locație
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground font-medium">{attraction.location}</p>
                    {attraction.county && (
                      <p className="text-sm text-muted-foreground">Județul {attraction.county}</p>
                    )}
                    {attraction.latitude && attraction.longitude && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Coordonate: {attraction.latitude.toFixed(4)}, {attraction.longitude.toFixed(4)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AtractieDetailPage;
