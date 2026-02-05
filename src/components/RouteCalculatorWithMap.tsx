import { useState, useEffect, useCallback } from "react";
 import { MapPin, ArrowRightLeft, Navigation, Clock, Route as RouteIcon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RouteMap } from "@/components/RouteMap";
 import { calculateRoute, RouteResult } from "@/services/routeService";
 import { useGlobalGeocode, GeoLocation } from "@/hooks/useGlobalGeocode";
import { useDebounce } from "@/hooks/useDebounce";
 import { Badge } from "@/components/ui/badge";

export const RouteCalculatorWithMap = () => {
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
   const [departureLocation, setDepartureLocation] = useState<GeoLocation | null>(null);
   const [destinationLocation, setDestinationLocation] = useState<GeoLocation | null>(null);
   const [departureSuggestions, setDepartureSuggestions] = useState<GeoLocation[]>([]);
   const [destinationSuggestions, setDestinationSuggestions] = useState<GeoLocation[]>([]);
  const [showDepartureSuggestions, setShowDepartureSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
   const { searchLocations, isSearching } = useGlobalGeocode();
   
  const debouncedDeparture = useDebounce(departure, 300);
  const debouncedDestination = useDebounce(destination, 300);

  // Search for departure cities
  useEffect(() => {
    const search = async () => {
      if (debouncedDeparture.length >= 2) {
         const results = await searchLocations(debouncedDeparture);
         setDepartureSuggestions(results);
         setShowDepartureSuggestions(results.length > 0);
      } else {
        setDepartureSuggestions([]);
        setShowDepartureSuggestions(false);
      }
    };
     if (!departureLocation) search();
   }, [debouncedDeparture, departureLocation, searchLocations]);

  // Search for destination cities
  useEffect(() => {
    const search = async () => {
      if (debouncedDestination.length >= 2) {
         const results = await searchLocations(debouncedDestination);
         setDestinationSuggestions(results);
         setShowDestinationSuggestions(results.length > 0);
      } else {
        setDestinationSuggestions([]);
        setShowDestinationSuggestions(false);
      }
    };
     if (!destinationLocation) search();
   }, [debouncedDestination, destinationLocation, searchLocations]);

   const selectDeparture = (location: GeoLocation) => {
     setDeparture(location.name);
     setDepartureLocation(location);
    setShowDepartureSuggestions(false);
    setRouteResult(null);
  };

   const selectDestination = (location: GeoLocation) => {
     setDestination(location.name);
     setDestinationLocation(location);
    setShowDestinationSuggestions(false);
    setRouteResult(null);
  };

  const swapLocations = () => {
    const tempName = departure;
     const tempLocation = departureLocation;
    setDeparture(destination);
     setDepartureLocation(destinationLocation);
    setDestination(tempName);
     setDestinationLocation(tempLocation);
    setRouteResult(null);
  };

  const handleCalculateRoute = async () => {
     if (!departureLocation?.latitude || !departureLocation?.longitude || 
         !destinationLocation?.latitude || !destinationLocation?.longitude) {
      return;
    }

    setIsCalculating(true);
    try {
      const result = await calculateRoute(
         departureLocation.latitude,
         departureLocation.longitude,
         destinationLocation.latitude,
         destinationLocation.longitude
      );
      setRouteResult(result);
    } catch (error) {
      console.error("Route calculation error:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    return `${hours}h ${mins}min`;
  };

   const canCalculate = departureLocation?.latitude && destinationLocation?.latitude;

  return (
    <div className="space-y-6">
      {/* Route Calculator Input */}
      <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {/* Departure Input */}
          <div className="flex-1 w-full relative">
            <label className="text-sm font-medium text-foreground mb-2 block">Plecare</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={departure}
                onChange={(e) => {
                  setDeparture(e.target.value);
                   setDepartureLocation(null);
                }}
                onFocus={() => departureSuggestions.length > 0 && setShowDepartureSuggestions(true)}
                 placeholder="ex. București, Viena, Paris..."
                className="pl-11 h-12 bg-background"
              />
               {isSearching && (
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
               )}
            </div>
            {/* Suggestions dropdown */}
            {showDepartureSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                 {departureSuggestions.map((location, idx) => (
                  <button
                     key={location.id || idx}
                     onClick={() => selectDeparture(location)}
                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-2"
                  >
                     {location.isLocal ? (
                       <MapPin className="w-4 h-4 text-primary" />
                     ) : (
                       <Globe className="w-4 h-4 text-muted-foreground" />
                     )}
                     <span className="font-medium">{location.name}</span>
                     <span className="text-sm text-muted-foreground">
                       ({location.county || location.country})
                     </span>
                     {!location.isLocal && (
                       <Badge variant="outline" className="ml-auto text-xs">Global</Badge>
                     )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={swapLocations}
            className="h-12 w-12 shrink-0 hidden lg:flex"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </Button>

          {/* Destination Input */}
          <div className="flex-1 w-full relative">
            <label className="text-sm font-medium text-foreground mb-2 block">Destinație</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <Input
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                   setDestinationLocation(null);
                }}
                onFocus={() => destinationSuggestions.length > 0 && setShowDestinationSuggestions(true)}
                 placeholder="ex. Brașov, Berlin, Milano..."
                className="pl-11 h-12 bg-background"
              />
            </div>
            {/* Suggestions dropdown */}
            {showDestinationSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                 {destinationSuggestions.map((location, idx) => (
                  <button
                     key={location.id || idx}
                     onClick={() => selectDestination(location)}
                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-2"
                  >
                     {location.isLocal ? (
                       <MapPin className="w-4 h-4 text-primary" />
                     ) : (
                       <Globe className="w-4 h-4 text-muted-foreground" />
                     )}
                     <span className="font-medium">{location.name}</span>
                     <span className="text-sm text-muted-foreground">
                       ({location.county || location.country})
                     </span>
                     {!location.isLocal && (
                       <Badge variant="outline" className="ml-auto text-xs">Global</Badge>
                     )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Calculate Button */}
          <Button 
            onClick={handleCalculateRoute}
            disabled={!canCalculate || isCalculating}
            className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
          >
            {isCalculating ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
            ) : (
              <Navigation className="w-4 h-4 mr-2" />
            )}
            Calculează Ruta
          </Button>
        </div>
      </div>

      {/* Map and Results Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden h-[400px]">
          <RouteMap
             startCoords={departureLocation?.latitude && departureLocation?.longitude 
               ? [departureLocation.latitude, departureLocation.longitude] 
              : undefined}
             endCoords={destinationLocation?.latitude && destinationLocation?.longitude 
               ? [destinationLocation.latitude, destinationLocation.longitude] 
              : undefined}
             startName={departureLocation?.name}
             endName={destinationLocation?.name}
            routeCoordinates={routeResult?.coordinates || []}
          />
        </div>

        {/* Route Info Panel */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 text-foreground mb-4">
            <Navigation className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Indicații de Orientare</h3>
          </div>
          
          {routeResult ? (
            <div className="space-y-4">
              {/* Route Summary */}
              <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <RouteIcon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Distanță</p>
                    <p className="text-xl font-bold text-foreground">{routeResult.distance} km</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Durată estimată</p>
                    <p className="text-xl font-bold text-foreground">{formatDuration(routeResult.duration)}</p>
                  </div>
                </div>
              </div>
              
              {/* Route Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                   <div className="w-3 h-3 rounded-full bg-emerald-500" />
                   <span className="font-medium">{departureLocation?.name}</span>
                </div>
                <div className="ml-1.5 border-l-2 border-dashed border-muted-foreground/30 h-8" />
                <div className="flex items-center gap-2 text-sm">
                   <div className="w-3 h-3 rounded-full bg-rose-500" />
                   <span className="font-medium">{destinationLocation?.name}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Selectează plecarea și destinația pentru a vedea indicațiile.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
