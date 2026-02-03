import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CloudSun, 
  Search, 
  MapPin, 
  Thermometer, 
  Wind, 
  Droplets,
  Eye,
  Compass,
  Building2,
  Calendar,
  Navigation
} from "lucide-react";
import { fetchAttractions, Attraction, searchCities, City } from "@/services/routeService";
import { useDebounce } from "@/hooks/useDebounce";

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  feelsLike: number;
  icon: string;
}

const VremeaPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [nearbyAttractions, setNearbyAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [allAttractions, setAllAttractions] = useState<Attraction[]>([]);
  
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Load all attractions on mount
  useEffect(() => {
    const loadAttractions = async () => {
      const data = await fetchAttractions();
      setAllAttractions(data);
    };
    loadAttractions();
  }, []);

  // Search cities
  useEffect(() => {
    const search = async () => {
      if (debouncedQuery.length >= 2) {
        const results = await searchCities(debouncedQuery);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };
    search();
  }, [debouncedQuery]);

  // Fetch weather when city is selected
  const fetchWeather = async (city: City) => {
    if (!city.latitude || !city.longitude) return;
    
    setLoading(true);
    try {
      // Using Open-Meteo API (free, no API key needed)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility&timezone=auto`
      );
      
      if (response.ok) {
        const data = await response.json();
        const current = data.current;
        
        // Map weather codes to descriptions
        const weatherDescriptions: Record<number, string> = {
          0: "Senin",
          1: "Predominant senin",
          2: "Parțial înnorat",
          3: "Înnorat",
          45: "Ceață",
          48: "Ceață cu chiciură",
          51: "Burniță ușoară",
          53: "Burniță moderată",
          55: "Burniță densă",
          61: "Ploaie ușoară",
          63: "Ploaie moderată",
          65: "Ploaie abundentă",
          71: "Ninsoare ușoară",
          73: "Ninsoare moderată",
          75: "Ninsoare abundentă",
          80: "Averse ușoare",
          81: "Averse moderate",
          82: "Averse puternice",
          95: "Furtună",
          96: "Furtună cu grindină",
          99: "Furtună severă"
        };
        
        setWeather({
          temperature: Math.round(current.temperature_2m),
          description: weatherDescriptions[current.weather_code] || "Necunoscut",
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          visibility: Math.round(current.visibility / 1000),
          feelsLike: Math.round(current.apparent_temperature),
          icon: getWeatherIcon(current.weather_code)
        });
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
    
    // Find nearby attractions
    if (city.latitude && city.longitude) {
      const nearby = allAttractions.filter(attraction => {
        if (!attraction.latitude || !attraction.longitude) return false;
        const distance = calculateDistance(
          city.latitude!,
          city.longitude!,
          attraction.latitude,
          attraction.longitude
        );
        return distance <= 100; // 100km radius
      }).map(attraction => ({
        ...attraction,
        distance: calculateDistance(
          city.latitude!,
          city.longitude!,
          attraction.latitude!,
          attraction.longitude!
        )
      })).sort((a, b) => (a as any).distance - (b as any).distance).slice(0, 6);
      
      setNearbyAttractions(nearby);
    }
    
    setLoading(false);
  };

  const getWeatherIcon = (code: number): string => {
    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 48) return "🌫️";
    if (code <= 55) return "🌧️";
    if (code <= 65) return "🌧️";
    if (code <= 75) return "❄️";
    if (code <= 82) return "🌧️";
    return "⛈️";
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

  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
    setSearchQuery(city.name);
    setShowSuggestions(false);
    fetchWeather(city);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 px-4 text-center">
          <div className="container mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <CloudSun className="w-7 h-7 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Vremea în România
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Verifică vremea în orice localitate din România și descoperă atracțiile turistice din zonă.
            </p>
          </div>
        </section>

        {/* Search Section */}
        <section className="px-4 pb-8">
          <div className="container mx-auto max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Caută o localitate..."
                className="pl-12 h-14 text-lg bg-card border-border"
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  {suggestions.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleSelectCity(city)}
                      className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium text-foreground">{city.name}</span>
                        <span className="text-muted-foreground ml-2">({city.county})</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Weather Display */}
        {loading && (
          <section className="px-4 pb-8">
            <div className="container mx-auto max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="animate-pulse">
                  <CardContent className="p-8">
                    <div className="h-32 bg-muted rounded" />
                  </CardContent>
                </Card>
                <Card className="animate-pulse">
                  <CardContent className="p-8">
                    <div className="h-32 bg-muted rounded" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {selectedCity && weather && !loading && (
          <section className="px-4 pb-8">
            <div className="container mx-auto max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Weather Card */}
                <Card className="overflow-hidden">
                  <CardHeader className="bg-primary/5 pb-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-xl">{selectedCity.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{selectedCity.county}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <span className="text-6xl font-bold text-foreground">{weather.temperature}°</span>
                        <p className="text-lg text-muted-foreground mt-1">{weather.description}</p>
                      </div>
                      <span className="text-6xl">{weather.icon}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Thermometer className="w-4 h-4" />
                        <span>Simțit: {weather.feelsLike}°C</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Droplets className="w-4 h-4" />
                        <span>Umiditate: {weather.humidity}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Wind className="w-4 h-4" />
                        <span>Vânt: {weather.windSpeed} km/h</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        <span>Vizibilitate: {weather.visibility} km</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Compass className="w-5 h-5 text-primary" />
                      Explorează zona
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start gap-3" asChild>
                      <a 
                        href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(selectedCity.name + ', Romania')}&aid=YOUR_AFFILIATE_ID`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Building2 className="w-4 h-4" />
                        Cazări în {selectedCity.name}
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-3" asChild>
                      <a 
                        href={`https://www.google.com/maps/search/events+near+${encodeURIComponent(selectedCity.name + ', Romania')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Calendar className="w-4 h-4" />
                        Evenimente în zonă
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-3" asChild>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCity.latitude},${selectedCity.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="w-4 h-4" />
                        Navigare către {selectedCity.name}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* Nearby Attractions */}
        {selectedCity && nearbyAttractions.length > 0 && !loading && (
          <section className="px-4 pb-12">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Atracții în apropiere de {selectedCity.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearbyAttractions.map((attraction) => (
                  <Card key={attraction.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      {attraction.image_url && (
                        <img 
                          src={attraction.image_url} 
                          alt={attraction.title}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{attraction.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{attraction.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{attraction.category}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {(attraction as any).distance} km
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* No results message */}
        {selectedCity && nearbyAttractions.length === 0 && !loading && (
          <section className="px-4 pb-12">
            <div className="container mx-auto max-w-4xl text-center">
              <p className="text-muted-foreground">
                Nu am găsit atracții turistice în raza de 100km de {selectedCity.name}.
              </p>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default VremeaPage;
