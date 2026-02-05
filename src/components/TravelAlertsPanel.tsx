 import { useState, useEffect } from 'react';
 import { AlertTriangle, ExternalLink, ChevronDown, ChevronUp, Shield, Gauge, Ship } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { TravelAlert, getAlertsForCountries, detectCountriesAlongRoute, COUNTRY_SPEED_LIMITS } from '@/lib/travelAlerts';
 
 interface TravelAlertsPanelProps {
   routeCoordinates: [number, number][];
   isVisible: boolean;
 }
 
 export const TravelAlertsPanel = ({ routeCoordinates, isVisible }: TravelAlertsPanelProps) => {
   const [alerts, setAlerts] = useState<TravelAlert[]>([]);
   const [countries, setCountries] = useState<string[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [isOpen, setIsOpen] = useState(true);
   
   useEffect(() => {
     if (!isVisible || routeCoordinates.length === 0) {
       setAlerts([]);
       setCountries([]);
       return;
     }
     
     const detectAlerts = async () => {
       setIsLoading(true);
       try {
         const detectedCountries = await detectCountriesAlongRoute(routeCoordinates);
         setCountries(detectedCountries);
         
         const routeAlerts = getAlertsForCountries(detectedCountries);
         setAlerts(routeAlerts);
       } catch (error) {
         console.error('Failed to detect countries:', error);
       } finally {
         setIsLoading(false);
       }
     };
     
     detectAlerts();
   }, [routeCoordinates, isVisible]);
   
   if (!isVisible || (alerts.length === 0 && !isLoading)) return null;
   
   const vignetteAlerts = alerts.filter(a => a.type === 'vignette' || a.type === 'toll');
   const speedAlerts = alerts.filter(a => a.type === 'speed_limit');
   const otherAlerts = alerts.filter(a => a.type !== 'vignette' && a.type !== 'toll' && a.type !== 'speed_limit');
   
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
                     {countries.join(' → ')}
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