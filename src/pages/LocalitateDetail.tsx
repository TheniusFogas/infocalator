import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Users, 
  ArrowLeft, 
  Building2, 
  Navigation,
  CloudSun,
  Calendar,
  ExternalLink,
  Landmark
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAttractions, Attraction } from "@/services/routeService";

interface City {
  id: string;
  name: string;
  county: string;
  population: number;
  city_type: string;
  latitude: number | null;
  longitude: number | null;
  is_major: boolean;
}

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
}

const LocalitateDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [city, setCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const [nearbyAttractions, setNearbyAttractions] = useState<Attraction[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const loadCity = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching city:", error);
      } else if (data) {
        setCity(data);
        
        // Fetch weather
        if (data.latitude && data.longitude) {
          fetchWeather(data.latitude, data.longitude);
          fetchNearbyAttractions(data.latitude, data.longitude);
        }
      }
      setLoading(false);
    };

    loadCity();
  }, [id]);

  const fetchWeather = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`
      );
      
      if (response.ok) {
        const data = await response.json();
        const weatherDescriptions: Record<number, string> = {
          0: "Senin", 1: "Predominant senin", 2: "Parțial înnorat", 3: "Înnorat",
          45: "Ceață", 48: "Ceață cu chiciură", 51: "Burniță ușoară",
          61: "Ploaie ușoară", 63: "Ploaie moderată", 71: "Ninsoare ușoară",
          80: "Averse ușoare", 95: "Furtună"
        };
        
        const code = data.current.weather_code;
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          description: weatherDescriptions[code] || "Necunoscut",
          icon: code === 0 ? "☀️" : code <= 3 ? "⛅" : code <= 48 ? "🌫️" : code <= 65 ? "🌧️" : "❄️"
        });
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  };

  const fetchNearbyAttractions = async (lat: number, lng: number) => {
    const allAttractions = await fetchAttractions();
    const nearby = allAttractions.filter(attraction => {
      if (!attraction.latitude || !attraction.longitude) return false;
      const distance = calculateDistance(lat, lng, attraction.latitude, attraction.longitude);
      return distance <= 50;
    }).slice(0, 4);
    setNearbyAttractions(nearby);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const formatPopulation = (pop: number) => {
    return pop.toLocaleString("ro-RO");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-48 bg-muted rounded" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!city) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Localitate negăsită</h1>
          <p className="text-muted-foreground mb-6">Ne pare rău, această localitate nu există.</p>
          <Button asChild>
            <Link to="/localitati">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Înapoi la localități
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
              to="/localitati" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Înapoi la localități
            </Link>
          </div>
        </section>

        {/* Hero */}
        <section className="px-4 py-8 bg-card border-b border-border">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary">{city.city_type}</Badge>
                  {city.is_major && <Badge>Oraș Major</Badge>}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{city.name}</h1>
                <p className="text-lg text-muted-foreground flex items-center gap-2 mt-1">
                  <Landmark className="w-4 h-4" />
                  Județul {city.county}
                </p>
              </div>
              
              {weather && (
                <div className="flex items-center gap-3 bg-background rounded-xl p-4 border border-border">
                  <span className="text-4xl">{weather.icon}</span>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{weather.temperature}°C</p>
                    <p className="text-sm text-muted-foreground">{weather.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="px-4 py-8">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informații</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Populație</p>
                          <p className="font-semibold text-foreground">{formatPopulation(city.population)} locuitori</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Landmark className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Județ</p>
                          <p className="font-semibold text-foreground">{city.county}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Nearby Attractions */}
                {nearbyAttractions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Atracții în apropiere
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {nearbyAttractions.map((attraction) => (
                          <Link 
                            key={attraction.id} 
                            to={`/atractii/${attraction.id}`}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                          >
                            {attraction.image_url && (
                              <img 
                                src={attraction.image_url} 
                                alt={attraction.title}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{attraction.title}</p>
                              <p className="text-sm text-muted-foreground">{attraction.category}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
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
                        href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city.name + ', Romania')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Building2 className="w-4 h-4" />
                        Cazări în {city.name}
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start gap-3" asChild>
                      <Link to={`/vremea?city=${encodeURIComponent(city.name)}`}>
                        <CloudSun className="w-4 h-4" />
                        Vremea în {city.name}
                      </Link>
                    </Button>
                    
                    {city.latitude && city.longitude && (
                      <Button variant="outline" className="w-full justify-start gap-3" asChild>
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${city.latitude},${city.longitude}`}
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
                        href={`https://www.google.com/search?q=${encodeURIComponent(city.name + ' evenimente')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Calendar className="w-4 h-4" />
                        Evenimente
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Location Card */}
                {city.latitude && city.longitude && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        Coordonate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LocalitateDetailPage;
