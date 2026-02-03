import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Loader2, Ticket, Clock, ChevronRight } from "lucide-react";
import { localInfoApi, Event } from "@/lib/api/localInfo";
import { eventCategoryIcons, getCategoryIcon, getPlaceholderImage } from "@/lib/categoryIcons";

interface EventsListProps {
  location: string;
  county?: string;
}

export const EventsList = ({ location, county }: EventsListProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      
      const response = await localInfoApi.searchEvents(location, county);
      
      if (response.success && response.data?.events) {
        setEvents(response.data.events);
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
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Evenimente în {location}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Se caută evenimente...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Evenimente în {location}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Evenimente în {location}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {events.map((event, index) => {
            const CategoryIcon = getCategoryIcon(event.category, eventCategoryIcons);
            const eventSlug = event.slug || event.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            
            return (
              <Link
                key={index}
                to={`/evenimente/${eventSlug}?location=${encodeURIComponent(location)}${county ? `&county=${encodeURIComponent(county)}` : ''}`}
                className="group block"
              >
                <div className="flex gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                    <img 
                      src={getPlaceholderImage(event.imageKeywords || event.title, 200, 200)}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="w-4 h-4 text-primary shrink-0" />
                        <Badge variant="secondary" className="text-xs">{event.category}</Badge>
                      </div>
                      {event.isPaid ? (
                        <Badge className="bg-primary/10 text-primary shrink-0">
                          <Ticket className="w-3 h-3 mr-1" />
                          {event.ticketPrice || 'Cu plată'}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 shrink-0">Gratuit</Badge>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {event.title}
                    </h4>
                    
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{event.description}</p>
                    
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {event.date}
                      </span>
                      {event.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 self-center" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
