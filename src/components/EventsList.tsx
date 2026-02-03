import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Loader2 } from "lucide-react";
import { localInfoApi, Event } from "@/lib/api/localInfo";

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
        <div className="space-y-4">
          {events.map((event, index) => (
            <div 
              key={index} 
              className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-medium text-foreground">{event.title}</h4>
                <Badge variant="secondary" className="shrink-0">{event.category}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {event.date}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
