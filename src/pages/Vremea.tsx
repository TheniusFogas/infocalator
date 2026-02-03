import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
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
  Navigation
} from "lucide-react";
import { searchCities, City } from "@/services/routeService";
import { localInfoApi, GeocodeResult } from "@/lib/api/localInfo";
import { useDebounce } from "@/hooks/useDebounce";
import { WeatherForecast } from "@/components/WeatherForecast";
import { EventsList } from "@/components/EventsList";
import { AccommodationsList } from "@/components/AccommodationsList";
import { AIAttractionsList } from "@/components/AIAttractionsList";
import { TrafficInfo } from "@/components/TrafficInfo";
import { Button } from "@/components/ui/button";

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  feelsLike: number;
  icon: string;
}

interface SelectedLocation {
  name: string;
  county: string;
  latitude: number;
  longitude: number;
  type: string;
}

const VremeaPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [suggestions, setSuggestions] = useState<(City | GeocodeResult)[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Search both database cities and geocoded locations
  useEffect(() => {
    const search = async () => {
      if (debouncedQuery.length >= 2) {
        // Search in database first
        const dbResults = await searchCities(debouncedQuery);
        
        // If we have less than 5 results, supplement with geocoding for villages/communes
        let geocodeResults: GeocodeResult[] = [];
        if (dbResults.length < 5) {
          geocodeResults = await localInfoApi.geocodeLocation(debouncedQuery);
        }
        
        // Combine and deduplicate
        const combined: (City | GeocodeResult)[] = [
          ...dbResults,
          ...geocodeResults.filter(geo => 
            !dbResults.some(db => 
              db.name.toLowerCase() === geo.name.toLowerCase() && 
              db.county.toLowerCase() === (geo.county || '').toLowerCase()
            )
          )
        ];
        
        setSuggestions(combined.slice(0, 10));
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };
    search();
  }, [debouncedQuery]);

  // Fetch weather when location is selected
  const fetchWeather = async (location: SelectedLocation) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility&timezone=auto`
      );
      
      if (response.ok) {
        const data = await response.json();
        const current = data.current;
        
        const weatherDescriptions: Record<number, string> = {
          0: "Senin", 1: "Predominant senin", 2: "Parțial înnorat", 3: "Înnorat",
          45: "Ceață", 48: "Ceață cu chiciură", 51: "Burniță ușoară",
          53: "Burniță moderată", 55: "Burniță densă", 61: "Ploaie ușoară",
          63: "Ploaie moderată", 65: "Ploaie abundentă", 71: "Ninsoare ușoară",
          73: "Ninsoare moderată", 75: "Ninsoare abundentă", 80: "Averse ușoare",
          81: "Averse moderate", 82: "Averse puternice", 95: "Furtună",
          96: "Furtună cu grindină", 99: "Furtună severă"
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

  const handleSelectLocation = (item: City | GeocodeResult) => {
    const isCity = 'population' in item;
    
    const location: SelectedLocation = isCity ? {
      name: item.name,
      county: item.county,
      latitude: item.latitude!,
      longitude: item.longitude!,
      type: item.city_type
    } : {
      name: item.name,
      county: item.county || '',
      latitude: item.latitude,
      longitude: item.longitude,
      type: item.type
    };
    
    setSelectedLocation(location);
    setSearchQuery(item.name);
    setShowSuggestions(false);
    fetchWeather(location);
  };

  const getLocationType = (item: City | GeocodeResult): string => {
    if ('population' in item) {
      return item.city_type;
    }
    return item.type;
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
              Verifică vremea în orice localitate din România - orașe, sate sau comune - și descoperă atracțiile turistice, evenimentele și cazările din zonă.
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
                placeholder="Caută o localitate (oraș, sat, comună)..."
                className="pl-12 h-14 text-lg bg-card border-border"
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  {suggestions.map((item, index) => (
                    <button
                      key={`${'id' in item ? item.id : index}-${item.name}`}
                      onClick={() => handleSelectLocation(item)}
                      className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <span className="font-medium text-foreground">{item.name}</span>
                        <span className="text-muted-foreground ml-2">
                          ({'county' in item && item.county ? item.county : ''})
                        </span>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {getLocationType(item)}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <section className="px-4 pb-8">
            <div className="container mx-auto max-w-6xl">
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

        {/* Weather Display */}
        {selectedLocation && weather && !loading && (
          <>
            <section className="px-4 pb-8">
              <div className="container mx-auto max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Main Weather Card */}
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-primary/5 pb-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-primary" />
                        <div>
                          <CardTitle className="text-xl">{selectedLocation.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {selectedLocation.type} • {selectedLocation.county}
                          </p>
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
                        Acțiuni rapide
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start gap-3" asChild>
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.latitude},${selectedLocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation className="w-4 h-4" />
                          Navigare către {selectedLocation.name}
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* 7-Day Forecast */}
                <WeatherForecast 
                  latitude={selectedLocation.latitude} 
                  longitude={selectedLocation.longitude} 
                  cityName={selectedLocation.name}
                />
              </div>
            </section>

            {/* AI-Generated Content Sections */}
            <section className="px-4 pb-8">
              <div className="container mx-auto max-w-6xl space-y-6">
                {/* Events */}
                <EventsList location={selectedLocation.name} county={selectedLocation.county} />
                
                {/* Accommodations */}
                <AccommodationsList location={selectedLocation.name} county={selectedLocation.county} />
                
                {/* Attractions */}
                <AIAttractionsList location={selectedLocation.name} county={selectedLocation.county} />
                
                {/* Traffic Info */}
                <TrafficInfo location={selectedLocation.name} county={selectedLocation.county} />
              </div>
            </section>
          </>
        )}

        {/* Initial State */}
        {!selectedLocation && !loading && (
          <section className="px-4 pb-12">
            <div className="container mx-auto max-w-4xl text-center">
              <p className="text-muted-foreground">
                Caută o localitate pentru a vedea vremea și informațiile din zonă.
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
