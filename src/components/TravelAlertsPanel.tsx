 import { useState, useEffect, useMemo } from 'react';
 import { AlertTriangle, ExternalLink, ChevronDown, ChevronUp, Shield, Gauge, Ship, Coffee, Fuel, Building2, MapPin } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { TravelAlert, getAlertsForCountries, detectCountriesAlongRoute, COUNTRY_SPEED_LIMITS } from '@/lib/travelAlerts';
 
 interface TravelAlertsPanelProps {
   routeCoordinates: [number, number][];
   isVisible: boolean;
 }
 
 interface RouteService {
   type: 'fuel' | 'food' | 'rest' | 'hospital';
   name: string;
   location: string;
   distanceFromStart: number; // km
   coordinates?: [number, number];
 }
 
 // Fetch POIs along route using Overpass API
 const fetchRoutePOIs = async (coordinates: [number, number][]): Promise<RouteService[]> => {
   if (coordinates.length < 10) return [];
   
   const services: RouteService[] = [];
   
   try {
     // Sample 5-6 points along the route for POI searches
     const samplePoints = [
       coordinates[Math.floor(coordinates.length * 0.15)],
       coordinates[Math.floor(coordinates.length * 0.35)],
       coordinates[Math.floor(coordinates.length * 0.50)],
       coordinates[Math.floor(coordinates.length * 0.65)],
       coordinates[Math.floor(coordinates.length * 0.85)],
     ].filter(Boolean);
     
     // Estimate total distance
     const totalDistance = estimateRouteDistance(coordinates);
     
     for (let i = 0; i < samplePoints.length; i++) {
       const [lat, lon] = samplePoints[i];
       const distanceFromStart = Math.round((totalDistance * ((i + 1) / (samplePoints.length + 1))));
       
       // Query Overpass for nearby amenities
       const query = `
         [out:json][timeout:10];
         (
           node["amenity"="fuel"](around:5000,${lat},${lon});
           node["amenity"="restaurant"](around:5000,${lat},${lon});
           node["amenity"="fast_food"](around:5000,${lat},${lon});
           node["highway"="rest_area"](around:10000,${lat},${lon});
           node["highway"="services"](around:10000,${lat},${lon});
         );
         out body 5;
       `;
       
       try {
         const response = await fetch('https://overpass-api.de/api/interpreter', {
           method: 'POST',
           body: `data=${encodeURIComponent(query)}`,
           headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
         });
         
         if (response.ok) {
           const data = await response.json();
           
           // Get first fuel and first food
           const fuelPOI = data.elements?.find((e: any) => e.tags?.amenity === 'fuel');
           const foodPOI = data.elements?.find((e: any) => 
             e.tags?.amenity === 'restaurant' || e.tags?.amenity === 'fast_food'
           );
           const restPOI = data.elements?.find((e: any) => 
             e.tags?.highway === 'rest_area' || e.tags?.highway === 'services'
           );
           
           if (fuelPOI && services.filter(s => s.type === 'fuel').length < 3) {
             services.push({
               type: 'fuel',
               name: fuelPOI.tags?.name || fuelPOI.tags?.brand || 'Benzinărie',
               location: `La ~${distanceFromStart} km de start`,
               distanceFromStart,
               coordinates: [fuelPOI.lat, fuelPOI.lon],
             });
           }
           
           if (foodPOI && services.filter(s => s.type === 'food').length < 3) {
             services.push({
               type: 'food',
               name: foodPOI.tags?.name || foodPOI.tags?.cuisine || 'Restaurant',
               location: `La ~${distanceFromStart} km de start`,
               distanceFromStart,
               coordinates: [foodPOI.lat, foodPOI.lon],
             });
           }
           
           if (restPOI && services.filter(s => s.type === 'rest').length < 2) {
             services.push({
               type: 'rest',
               name: restPOI.tags?.name || 'Zonă de odihnă',
               location: `La ~${distanceFromStart} km de start`,
               distanceFromStart,
               coordinates: [restPOI.lat, restPOI.lon],
             });
           }
         }
       } catch (e) {
         // Continue with next point
       }
       
       // Delay to avoid rate limiting
       if (i < samplePoints.length - 1) {
         await new Promise(r => setTimeout(r, 200));
       }
     }
     
   } catch (error) {
     console.error('Failed to fetch route POIs:', error);
   }
   
   return services.sort((a, b) => a.distanceFromStart - b.distanceFromStart);
 };
 
 // Estimate distance from coordinates (rough calculation)
 const estimateRouteDistance = (coordinates: [number, number][]): number => {
   let distance = 0;
   for (let i = 1; i < coordinates.length; i++) {
     distance += haversineDistance(
       coordinates[i-1][0], coordinates[i-1][1],
       coordinates[i][0], coordinates[i][1]
     );
   }
   return Math.round(distance);
 };
 
 // Haversine formula for distance calculation
 const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
   const R = 6371; // Earth radius in km
   const dLat = (lat2 - lat1) * Math.PI / 180;
   const dLon = (lon2 - lon1) * Math.PI / 180;
   const a = 
     Math.sin(dLat/2) * Math.sin(dLat/2) +
     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
     Math.sin(dLon/2) * Math.sin(dLon/2);
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
   return R * c;
 };
 
 export const TravelAlertsPanel = ({ routeCoordinates, isVisible }: TravelAlertsPanelProps) => {
   const [alerts, setAlerts] = useState<TravelAlert[]>([]);
   const [countries, setCountries] = useState<string[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [isOpen, setIsOpen] = useState(true);
   const [services, setServices] = useState<RouteService[]>([]);
   const [loadingServices, setLoadingServices] = useState(false);
   
   useEffect(() => {
     if (!isVisible || routeCoordinates.length === 0) {
       setAlerts([]);
       setCountries([]);
       setServices([]);
       return;
     }
     
     const detectAlerts = async () => {
       setIsLoading(true);
       try {
         const detectedCountries = await detectCountriesAlongRoute(routeCoordinates);
         setCountries(detectedCountries);
         
         const routeAlerts = getAlertsForCountries(detectedCountries, routeCoordinates);
         setAlerts(routeAlerts);
       } catch (error) {
         console.error('Failed to detect countries:', error);
       } finally {
         setIsLoading(false);
       }
     };
     
     detectAlerts();
     
     // Also fetch POIs for recommendations
     const fetchServices = async () => {
       setLoadingServices(true);
       try {
         const pois = await fetchRoutePOIs(routeCoordinates);
         setServices(pois);
       } catch (e) {
         console.error('Failed to fetch POIs:', e);
       } finally {
         setLoadingServices(false);
       }
     };
     
     // Delay POI fetch to prioritize country detection
     const timer = setTimeout(fetchServices, 500);
     return () => clearTimeout(timer);
   }, [routeCoordinates, isVisible]);
   
   if (!isVisible || (alerts.length === 0 && services.length === 0 && !isLoading)) return null;
   
   const vignetteAlerts = alerts.filter(a => a.type === 'vignette' || a.type === 'toll');
   const speedAlerts = alerts.filter(a => a.type === 'speed_limit');
   const otherAlerts = alerts.filter(a => a.type !== 'vignette' && a.type !== 'toll' && a.type !== 'speed_limit');
   
   const fuelServices = services.filter(s => s.type === 'fuel');
   const foodServices = services.filter(s => s.type === 'food');
   const restServices = services.filter(s => s.type === 'rest');
   
   return (
     <Card className="border-primary/30 bg-primary/5">
       <Collapsible open={isOpen} onOpenChange={setIsOpen}>
         <CardHeader className="pb-2">
           <CollapsibleTrigger asChild>
             <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
               <CardTitle className="text-base flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5 text-primary" />
                 Alerte de Călătorie
                 {countries.length > 0 && (
                   <Badge variant="outline" className="ml-2 text-xs">
                     {countries.length} {countries.length === 1 ? 'țară' : 'țări'}
                   </Badge>
                 )}
               </CardTitle>
               {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
             </Button>
           </CollapsibleTrigger>
         </CardHeader>
         
         <CollapsibleContent>
           <CardContent className="pt-2 space-y-4">
             {isLoading ? (
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                 Se detectează țările pe traseu...
               </div>
             ) : (
               <>
                 {/* Vignette & Toll Alerts */}
                 {vignetteAlerts.length > 0 && (
                   <div className="space-y-2">
                     <h4 className="text-sm font-medium flex items-center gap-2">
                       <Shield className="w-4 h-4 text-primary" />
                       Viniete și Taxe
                     </h4>
                     {vignetteAlerts.map((alert, idx) => (
                       <div 
                         key={idx} 
                         className="bg-background rounded-lg p-3 border border-border"
                       >
                         <div className="flex items-start justify-between gap-2">
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-1">
                               <span className="text-lg">{alert.icon}</span>
                               <span className="font-medium text-sm">{alert.title}</span>
                             </div>
                             <p className="text-xs text-muted-foreground">{alert.description}</p>
                           </div>
                           {alert.link && (
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="shrink-0 text-xs h-8"
                               onClick={() => window.open(alert.link, '_blank')}
                             >
                               <ExternalLink className="w-3 h-3 mr-1" />
                               {alert.linkText || 'Detalii'}
                             </Button>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
                 
                 {/* Speed Limits */}
                 {speedAlerts.length > 0 && (
                   <div className="space-y-2">
                     <h4 className="text-sm font-medium flex items-center gap-2">
                       <Gauge className="w-4 h-4 text-primary" />
                       Limite de Viteză
                     </h4>
                     <div className="grid grid-cols-1 gap-2">
                       {speedAlerts.map((alert, idx) => (
                         <div 
                           key={idx}
                           className="bg-background rounded-lg p-2 border border-border flex items-center gap-2"
                         >
                           <span className="text-lg">{alert.icon}</span>
                           <div className="flex-1">
                             <span className="text-xs font-medium">{alert.country}:</span>
                             <span className="text-xs text-muted-foreground ml-1">
                               {alert.description.split(':')[1]}
                             </span>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
                 
                 {/* Countries Summary */}
                 {countries.length > 1 && (
                   <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                     <span className="font-medium">Țări tranzitate: </span>
                     {countries.map((c, i) => (
                       <span key={c}>
                         {getCountryName(c)}
                         {i < countries.length - 1 && ' → '}
                       </span>
                     ))}
                   </div>
                 )}
                 
                 {/* Route Services / POI Recommendations */}
                 {(services.length > 0 || loadingServices) && (
                   <div className="space-y-2 pt-2 border-t border-border">
                     <h4 className="text-sm font-medium flex items-center gap-2">
                       <MapPin className="w-4 h-4 text-primary" />
                       Opriri Recomandate
                     </h4>
                     
                     {loadingServices ? (
                       <div className="flex items-center gap-2 text-xs text-muted-foreground">
                         <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                         Se caută benzinării și restaurante pe traseu...
                       </div>
                     ) : (
                       <div className="space-y-2">
                         {/* Fuel Stations */}
                         {fuelServices.length > 0 && (
                           <div className="bg-background rounded-lg p-2 border border-border">
                             <div className="flex items-center gap-2 mb-1">
                               <Fuel className="w-4 h-4 text-amber-500" />
                               <span className="text-xs font-medium">Benzinării</span>
                             </div>
                             <div className="space-y-1">
                               {fuelServices.slice(0, 2).map((s, i) => (
                                 <p key={i} className="text-xs text-muted-foreground pl-6">
                                   {s.name} - {s.location}
                                 </p>
                               ))}
                             </div>
                           </div>
                         )}
                         
                         {/* Restaurants */}
                         {foodServices.length > 0 && (
                           <div className="bg-background rounded-lg p-2 border border-border">
                             <div className="flex items-center gap-2 mb-1">
                               <Coffee className="w-4 h-4 text-orange-500" />
                               <span className="text-xs font-medium">Mâncare</span>
                             </div>
                             <div className="space-y-1">
                               {foodServices.slice(0, 2).map((s, i) => (
                                 <p key={i} className="text-xs text-muted-foreground pl-6">
                                   {s.name} - {s.location}
                                 </p>
                               ))}
                             </div>
                           </div>
                         )}
                         
                         {/* Rest Areas */}
                         {restServices.length > 0 && (
                           <div className="bg-background rounded-lg p-2 border border-border">
                             <div className="flex items-center gap-2 mb-1">
                               <Building2 className="w-4 h-4 text-green-500" />
                               <span className="text-xs font-medium">Zone de odihnă</span>
                             </div>
                             <div className="space-y-1">
                               {restServices.slice(0, 2).map((s, i) => (
                                 <p key={i} className="text-xs text-muted-foreground pl-6">
                                   {s.name} - {s.location}
                                 </p>
                               ))}
                             </div>
                           </div>
                         )}
                       </div>
                     )}
                   </div>
                 )}
               </>
             )}
           </CardContent>
         </CollapsibleContent>
       </Collapsible>
     </Card>
   );
 };
 
 // Helper to get country name
 const getCountryName = (code: string): string => {
   const names: Record<string, string> = {
     RO: 'România', HU: 'Ungaria', BG: 'Bulgaria', AT: 'Austria',
     DE: 'Germania', CZ: 'Cehia', SK: 'Slovacia', PL: 'Polonia',
     RS: 'Serbia', HR: 'Croația', SI: 'Slovenia', UA: 'Ucraina', MD: 'Moldova'
   };
   return names[code] || code;
 };