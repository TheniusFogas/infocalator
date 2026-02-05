 import { useState, useEffect } from "react";
 import { Link } from "react-router-dom";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Calendar, MapPin, Loader2, Clock, ChevronRight } from "lucide-react";
import { localInfoApi, Event } from "@/lib/api/localInfo";
import { buildDetailUrl, generateSlug } from "@/lib/urlUtils";
 
 interface SidebarEventsListProps {
   location: string;
   county?: string;
 }
 
 export const SidebarEventsList = ({ location, county }: SidebarEventsListProps) => {
  const [events, setEvents] = useState<Event[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     const fetchEvents = async () => {
       setLoading(true);
       setError(null);
       
       const response = await localInfoApi.searchEvents(location, county);
       
       if (response.success && response.data?.events) {
         // Show max 5 events in sidebar
         setEvents(response.data.events.slice(0, 5));
       } else {
         setError(response.error || "Nu s-au putut încărca evenimentele");
       }
       
       setLoading(false);
     };
 
     fetchEvents();
   }, [location, county]);
 
   if (loading) {
     return (
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-base flex items-center gap-2">
             <Calendar className="w-4 h-4 text-primary" />
             Evenimente în {location}
           </CardTitle>
         </CardHeader>
         <CardContent className="flex items-center justify-center py-4">
           <Loader2 className="w-5 h-5 animate-spin text-primary" />
         </CardContent>
       </Card>
     );
   }
 
   if (error || events.length === 0) {
     return (
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-base flex items-center gap-2">
             <Calendar className="w-4 h-4 text-primary" />
             Evenimente în {location}
           </CardTitle>
         </CardHeader>
         <CardContent>
           <p className="text-sm text-muted-foreground">
             {error || "Nu sunt evenimente programate în această perioadă."}
           </p>
         </CardContent>
       </Card>
     );
   }
 
   const formatDate = (dateStr: string) => {
     const date = new Date(dateStr);
     return date.toLocaleDateString('ro-RO', { 
       day: 'numeric', 
       month: 'short' 
     });
   };
 
   return (
     <Card>
       <CardHeader className="pb-3">
         <CardTitle className="text-base flex items-center gap-2">
           <Calendar className="w-4 h-4 text-primary" />
           Evenimente în {location}
         </CardTitle>
       </CardHeader>
       <CardContent className="space-y-3">
         {events.map((event, index) => {
            const eventSlug = event.slug || generateSlug(event.title);
           
           return (
             <Link
               key={index}
                to={buildDetailUrl('evenimente', eventSlug, location, county)}
               className="group block"
             >
               <div className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors">
                 {/* Date badge */}
                 <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                   {event.date ? (
                     <>
                       <span className="text-xs text-primary font-medium">
                         {new Date(event.date).toLocaleDateString('ro-RO', { month: 'short' })}
                       </span>
                       <span className="text-lg font-bold text-primary leading-none">
                         {new Date(event.date).getDate()}
                       </span>
                     </>
                   ) : (
                     <Calendar className="w-5 h-5 text-primary" />
                   )}
                 </div>
                 
                 {/* Content */}
                 <div className="flex-1 min-w-0">
                   <h4 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                     {event.title}
                   </h4>
                   <p className="text-xs text-muted-foreground line-clamp-1">
                     {event.location || event.city}
                   </p>
                   {event.time && (
                     <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                       <Clock className="w-3 h-3" />
                       {event.time}
                     </div>
                   )}
                 </div>
                 
                 <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 self-center" />
               </div>
             </Link>
           );
         })}
         
         {events.length >= 5 && (
           <Link 
             to={`/evenimente?location=${encodeURIComponent(location)}`}
             className="block text-center text-sm text-primary hover:underline pt-2"
           >
             Vezi toate evenimentele →
           </Link>
         )}
       </CardContent>
     </Card>
   );
 };