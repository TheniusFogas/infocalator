 import { useState, useEffect, useCallback } from "react";
 import { MapPin, ArrowRightLeft, Navigation, Clock, Route as RouteIcon, Fuel, ChevronDown, ChevronUp, Settings, History, Globe } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
 import { RouteMap } from "@/components/RouteMap";
 import { TravelAlertsPanel } from "@/components/TravelAlertsPanel";
 import { useDebounce } from "@/hooks/useDebounce";
 import { useGlobalGeocode, GeoLocation } from "@/hooks/useGlobalGeocode";
 import { cacheRoute, getCachedRoute, getRecentRoutes, CachedRoute } from "@/lib/routeCache";
 import { supabase } from "@/integrations/supabase/client";
 
 interface RouteStep {
   instruction: string;
   distance: number;
   duration: number;
   name: string;
   type: string;
 }
 
 interface RouteResult {
   distance: number;
   duration: number;
   coordinates: [number, number][];
   steps: RouteStep[];
   fuelCost: number;
   tollCost: number;
 }
 
 interface AlternativeRoute extends RouteResult {
   name: string;
   description: string;
   savings?: { time?: number; distance?: number; fuel?: number };
 }
 
 const DEFAULT_FUEL_CONSUMPTION = 7; // L/100km
 const DEFAULT_FUEL_PRICE = 7.25; // RON/L
 
 export const AdvancedRouteCalculator = () => {
   const [departure, setDeparture] = useState("");
   const [destination, setDestination] = useState("");
   const [departureLocation, setDepartureLocation] = useState<GeoLocation | null>(null);
   const [destinationLocation, setDestinationLocation] = useState<GeoLocation | null>(null);
   const [departureSuggestions, setDepartureSuggestions] = useState<GeoLocation[]>([]);
   const [destinationSuggestions, setDestinationSuggestions] = useState<GeoLocation[]>([]);
   const [showDepartureSuggestions, setShowDepartureSuggestions] = useState(false);
   const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
   const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
   const [alternativeRoutes, setAlternativeRoutes] = useState<AlternativeRoute[]>([]);
   const [selectedAltIndex, setSelectedAltIndex] = useState(-1);
   const [isCalculating, setIsCalculating] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [showSteps, setShowSteps] = useState(true);
   const [recentRoutes, setRecentRoutes] = useState<CachedRoute[]>([]);
   
   // Fuel calculation settings
   const [fuelConsumption, setFuelConsumption] = useState(DEFAULT_FUEL_CONSUMPTION);
   const [fuelPrice, setFuelPrice] = useState(DEFAULT_FUEL_PRICE);
   
   // Global geocoding hook
   const { searchLocations, isSearching } = useGlobalGeocode();
   
   const debouncedDeparture = useDebounce(departure, 300);
   const debouncedDestination = useDebounce(destination, 300);
 
   // Load recent routes on mount
   useEffect(() => {
     setRecentRoutes(getRecentRoutes(5));
   }, []);
 
   useEffect(() => {
     const search = async () => {
       const results = await searchLocations(debouncedDeparture);
       setDepartureSuggestions(results);
       setShowDepartureSuggestions(results.length > 0);
     };
     if (debouncedDeparture.length >= 2 && !departureLocation) search();
   }, [debouncedDeparture, departureLocation, searchLocations]);
 
   useEffect(() => {
     const search = async () => {
       const results = await searchLocations(debouncedDestination);
       setDestinationSuggestions(results);
       setShowDestinationSuggestions(results.length > 0);
     };
     if (debouncedDestination.length >= 2 && !destinationLocation) search();
   }, [debouncedDestination, destinationLocation, searchLocations]);
 
   const selectDeparture = (location: GeoLocation) => {
     setDeparture(location.name);
     setDepartureLocation(location);
     setShowDepartureSuggestions(false);
     setRouteResult(null);
     setSelectedAltIndex(-1);
   };
 
   const selectDestination = (location: GeoLocation) => {
     setDestination(location.name);
     setDestinationLocation(location);
     setShowDestinationSuggestions(false);
     setRouteResult(null);
     setSelectedAltIndex(-1);
   };
 
   const swapLocations = () => {
     const tempName = departure;
     const tempLocation = departureLocation;
     setDeparture(destination);
     setDepartureLocation(destinationLocation);
     setDestination(tempName);
     setDestinationLocation(tempLocation);
     setRouteResult(null);
     setSelectedAltIndex(-1);
   };
 
   const parseOSRMSteps = (legs: any[]): RouteStep[] => {
     const steps: RouteStep[] = [];
     
     legs.forEach(leg => {
       leg.steps?.forEach((step: any) => {
         const maneuver = step.maneuver;
         let instruction = "";
         
         switch (maneuver.type) {
           case "depart":
             instruction = `Pleacă spre ${step.name || "drum"}`;
             break;
           case "arrive":
             instruction = "Ai ajuns la destinație";
             break;
           case "turn":
             const turnDir = maneuver.modifier === "left" ? "stânga" : 
                            maneuver.modifier === "right" ? "dreapta" : 
                            maneuver.modifier === "slight left" ? "ușor stânga" :
                            maneuver.modifier === "slight right" ? "ușor dreapta" : "";
             instruction = `Virează la ${turnDir} pe ${step.name || "drum"}`;
             break;
           case "new name":
             instruction = `Continuă pe ${step.name || "drum"}`;
             break;
           case "merge":
             instruction = `Intră pe ${step.name || "autostradă"}`;
             break;
           case "on ramp":
             instruction = `Ia rampa spre ${step.name || "autostradă"}`;
             break;
           case "off ramp":
             instruction = `Ieși pe ${step.name || "drum"}`;
             break;
           case "fork":
             instruction = `La bifurcație, continuă pe ${step.name || "drum"}`;
             break;
           case "roundabout":
             const exit = maneuver.exit || 1;
             instruction = `La sensul giratoriu, ia ieșirea ${exit} spre ${step.name || "drum"}`;
             break;
           default:
             instruction = `Continuă pe ${step.name || "drum"}`;
         }
         
         if (step.distance > 50) {
           steps.push({
             instruction,
             distance: Math.round(step.distance / 1000 * 10) / 10,
             duration: Math.round(step.duration / 60),
             name: step.name || "",
             type: maneuver.type
           });
         }
       });
     });
     
     return steps;
   };
 
   const handleCalculateRoute = async () => {
     if (!departureLocation || !destinationLocation) return;
 
     setIsCalculating(true);
     setAlternativeRoutes([]);
     setSelectedAltIndex(-1);
     
     try {
       // Check cache first
       const cached = getCachedRoute(departureLocation.name, destinationLocation.name);
       if (cached) {
         setRouteResult({
           distance: cached.distance,
           duration: cached.duration,
           coordinates: cached.coordinates,
           steps: cached.steps || [],
           fuelCost: cached.fuelCost,
           tollCost: 0
         });
         if (cached.alternatives) {
           setAlternativeRoutes(cached.alternatives);
         }
         setIsCalculating(false);
         return;
       }
       
       // Primary route
       const response = await fetch(
         `https://router.project-osrm.org/route/v1/driving/` +
         `${departureLocation.longitude},${departureLocation.latitude};` +
         `${destinationLocation.longitude},${destinationLocation.latitude}` +
         `?overview=full&geometries=geojson&steps=true&alternatives=true`
       );
       
       const data = await response.json();
       
       if (data.code !== "Ok" || !data.routes?.length) {
         throw new Error("Nu s-a putut calcula ruta");
       }
       
       const primaryRoute = data.routes[0];
       const distance = Math.round(primaryRoute.distance / 1000);
       const duration = Math.round(primaryRoute.duration / 60);
       const fuelNeeded = (distance * fuelConsumption) / 100;
       const fuelCost = Math.round(fuelNeeded * fuelPrice * 100) / 100;
       
       const coordinates: [number, number][] = primaryRoute.geometry.coordinates.map(
         (coord: [number, number]) => [coord[1], coord[0]]
       );
       
       const steps = parseOSRMSteps(primaryRoute.legs);
       
       setRouteResult({
         distance,
         duration,
         coordinates,
         steps,
         fuelCost,
         tollCost: 0
       });
       
       const alternatives: AlternativeRoute[] = [];
       
       // Parse alternative routes
       if (data.routes.length > 1) {
         data.routes.slice(1, 4).forEach((route: any, idx: number) => {
           const altDistance = Math.round(route.distance / 1000);
           const altDuration = Math.round(route.duration / 60);
           const altFuelNeeded = (altDistance * fuelConsumption) / 100;
           const altFuelCost = Math.round(altFuelNeeded * fuelPrice * 100) / 100;
           const altCoordinates: [number, number][] = route.geometry.coordinates.map(
             (coord: [number, number]) => [coord[1], coord[0]]
           );
           
           alternatives.push({
             name: `Rută alternativă ${idx + 1}`,
             description: altDistance > distance ? "Mai lungă dar poate mai rapidă" : "Mai scurtă",
             distance: altDistance,
             duration: altDuration,
             coordinates: altCoordinates,
             steps: parseOSRMSteps(route.legs),
             fuelCost: altFuelCost,
             tollCost: 0,
             savings: {
               time: duration - altDuration,
               distance: distance - altDistance,
               fuel: Math.round((fuelCost - altFuelCost) * 100) / 100
             }
           });
         });
         setAlternativeRoutes(alternatives);
       }
       
       // Cache the result
       cacheRoute({
         fromName: departureLocation.name,
         toName: destinationLocation.name,
         distance,
         duration,
         coordinates,
         steps,
         fuelCost,
         alternatives
       });
       
       // Update recent routes
       setRecentRoutes(getRecentRoutes(5));
       
       // Save route to DB for statistics
       await supabase.from("saved_routes").upsert({
         from_name: departureLocation.name,
         to_name: destinationLocation.name,
         distance_km: distance,
         duration_minutes: duration,
         fuel_consumption_estimate: fuelNeeded,
         view_count: 1
       }, { onConflict: 'from_name,to_name' });
       
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
 
   const handleSelectAlternative = (index: number) => {
     setSelectedAltIndex(index);
     if (alternativeRoutes[index]) {
       setRouteResult(alternativeRoutes[index]);
     }
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
               <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
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
                       ({location.county || location.country || location.type})
                     </span>
                     {location.population && location.population > 10000 && (
                       <Badge variant="secondary" className="ml-auto text-xs">
                         {(location.population / 1000).toFixed(0)}k
                       </Badge>
                     )}
                     {!location.isLocal && (
                       <Badge variant="outline" className="ml-auto text-xs">
                         Global
                       </Badge>
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
               <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-500" />
               <Input
                 value={destination}
                 onChange={(e) => {
                   setDestination(e.target.value);
                   setDestinationLocation(null);
                 }}
                 onFocus={() => destinationSuggestions.length > 0 && setShowDestinationSuggestions(true)}
                 placeholder="ex. Cluj-Napoca, Berlin, Milano..."
                 className="pl-11 h-12 bg-background"
               />
             </div>
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
                       ({location.county || location.country || location.type})
                     </span>
                     {!location.isLocal && (
                       <Badge variant="outline" className="ml-auto text-xs">
                         Global
                       </Badge>
                     )}
                   </button>
                 ))}
               </div>
             )}
           </div>
 
           {/* Settings Button */}
           <Button
             variant="outline"
             size="icon"
             onClick={() => setShowSettings(!showSettings)}
             className="h-12 w-12 shrink-0"
           >
             <Settings className="w-4 h-4" />
           </Button>
 
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
 
         {/* Fuel Settings */}
         <Collapsible open={showSettings} onOpenChange={setShowSettings}>
           <CollapsibleContent className="mt-4 pt-4 border-t border-border">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                 <label className="text-sm font-medium text-foreground mb-2 block">
                   Consum mediu (L/100km)
                 </label>
                 <Input
                   type="number"
                   value={fuelConsumption}
                   onChange={(e) => setFuelConsumption(parseFloat(e.target.value) || DEFAULT_FUEL_CONSUMPTION)}
                   min={3}
                   max={30}
                   step={0.5}
                   className="h-10"
                 />
               </div>
               <div>
                 <label className="text-sm font-medium text-foreground mb-2 block">
                   Preț carburant (RON/L)
                 </label>
                 <Input
                   type="number"
                   value={fuelPrice}
                   onChange={(e) => setFuelPrice(parseFloat(e.target.value) || DEFAULT_FUEL_PRICE)}
                   min={1}
                   max={15}
                   step={0.05}
                   className="h-10"
                 />
               </div>
               <div>
                 <label className="text-sm font-medium text-foreground mb-2 block">
                   Căutări recente
                 </label>
                 {recentRoutes.length > 0 ? (
                   <div className="flex flex-wrap gap-1">
                     {recentRoutes.slice(0, 3).map((route, idx) => (
                       <Badge 
                         key={idx}
                         variant="outline" 
                         className="cursor-pointer hover:bg-accent text-xs"
                         onClick={() => {
                           setDeparture(route.fromName);
                           setDestination(route.toName);
                         }}
                       >
                         <History className="w-3 h-3 mr-1" />
                         {route.fromName} → {route.toName}
                       </Badge>
                     ))}
                   </div>
                 ) : (
                   <p className="text-xs text-muted-foreground">Nicio căutare recentă</p>
                 )}
               </div>
             </div>
           </CollapsibleContent>
         </Collapsible>
       </div>
 
       {/* Map and Results Section */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Map */}
         <div className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden h-[500px]">
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
             alternativeRoutes={alternativeRoutes.map(alt => ({
               coordinates: alt.coordinates,
               name: alt.name,
               distance: alt.distance,
               duration: alt.duration
             }))}
             selectedAlternativeIndex={selectedAltIndex}
             onSelectAlternative={handleSelectAlternative}
           />
         </div>
 
         {/* Route Info Panel */}
         <div className="space-y-4">
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-lg flex items-center gap-2">
                 <Navigation className="w-5 h-5 text-primary" />
                 Indicații de Orientare
               </CardTitle>
             </CardHeader>
             <CardContent>
               {routeResult ? (
                 <div className="space-y-4">
                   {/* Route Summary */}
                   <div className="grid grid-cols-2 gap-3">
                     <div className="bg-secondary/50 rounded-lg p-3 text-center">
                       <RouteIcon className="w-5 h-5 text-primary mx-auto mb-1" />
                       <p className="text-2xl font-bold text-foreground">{routeResult.distance}</p>
                       <p className="text-xs text-muted-foreground">km</p>
                     </div>
                     <div className="bg-secondary/50 rounded-lg p-3 text-center">
                       <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                       <p className="text-2xl font-bold text-foreground">{formatDuration(routeResult.duration)}</p>
                       <p className="text-xs text-muted-foreground">durată</p>
                     </div>
                   </div>
                   
                   {/* Fuel Cost */}
                   <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                     <Fuel className="w-5 h-5 text-primary" />
                     <div>
                       <p className="text-sm text-muted-foreground">Cost combustibil estimat</p>
                       <p className="text-xl font-bold text-foreground">{routeResult.fuelCost} RON</p>
                       <p className="text-xs text-muted-foreground">
                         ({((routeResult.distance * fuelConsumption) / 100).toFixed(1)}L la {fuelConsumption}L/100km)
                       </p>
                     </div>
                   </div>
                   
                   <Separator />
                   
                   {/* Steps */}
                   <Collapsible open={showSteps} onOpenChange={setShowSteps}>
                     <CollapsibleTrigger asChild>
                       <Button variant="ghost" className="w-full justify-between">
                         Traseu detaliat ({routeResult.steps.length} pași)
                         {showSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                       </Button>
                     </CollapsibleTrigger>
                     <CollapsibleContent>
                       <div className="space-y-2 max-h-64 overflow-y-auto mt-2">
                         {routeResult.steps.map((step, idx) => (
                           <div key={idx} className="flex items-start gap-2 text-sm p-2 rounded hover:bg-muted/50">
                             <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                               <span className="text-xs font-medium text-primary">{idx + 1}</span>
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="text-foreground">{step.instruction}</p>
                               <p className="text-xs text-muted-foreground">
                                 {step.distance} km · {step.duration} min
                               </p>
                             </div>
                           </div>
                         ))}
                       </div>
                     </CollapsibleContent>
                   </Collapsible>
                 </div>
               ) : (
                 <p className="text-muted-foreground text-sm">
                   Selectează plecarea și destinația pentru a vedea indicațiile.
                 </p>
               )}
             </CardContent>
           </Card>
 
           {/* Alternative Routes */}
           {alternativeRoutes.length > 0 && (
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm flex items-center gap-2">
                   <RouteIcon className="w-4 h-4 text-muted-foreground" />
                   Rute Alternative
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-2">
                 {alternativeRoutes.map((alt, idx) => (
                   <div 
                     key={idx}
                     className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                       selectedAltIndex === idx 
                         ? 'border-primary bg-primary/5' 
                         : 'border-border hover:border-primary/50'
                     }`}
                     onClick={() => handleSelectAlternative(idx)}
                   >
                     <div className="flex items-center justify-between mb-1">
                       <span className="font-medium text-sm">{alt.name}</span>
                       <Badge variant="outline" className="text-xs">
                         {alt.distance} km
                       </Badge>
                     </div>
                     <p className="text-xs text-muted-foreground mb-2">{alt.description}</p>
                     <div className="flex gap-2 text-xs">
                       {alt.savings?.time && alt.savings.time > 0 && (
                         <Badge variant="secondary" className="text-emerald-600">
                           -{alt.savings.time} min
                         </Badge>
                       )}
                       {alt.savings?.fuel && alt.savings.fuel > 0 && (
                         <Badge variant="secondary" className="text-emerald-600">
                           -{alt.savings.fuel} RON
                         </Badge>
                       )}
                     </div>
                   </div>
                 ))}
               </CardContent>
             </Card>
           )}
           
           {/* Travel Alerts */}
           <TravelAlertsPanel 
             routeCoordinates={routeResult?.coordinates || []}
             isVisible={!!routeResult}
           />
         </div>
       </div>
     </div>
   );
 };