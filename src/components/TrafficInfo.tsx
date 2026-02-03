import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, Lightbulb, Route, CircleDollarSign, Navigation } from "lucide-react";
import { localInfoApi, TrafficInfo as TrafficInfoType } from "@/lib/api/localInfo";
import { trafficStatusIcons } from "@/lib/categoryIcons";

interface TrafficInfoProps {
  location: string;
  county?: string;
}

const statusColors: Record<string, string> = {
  'Închis': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
  'Restricționat': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  'Lucrări': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
};

export const TrafficInfo = ({ location, county }: TrafficInfoProps) => {
  const [trafficInfo, setTrafficInfo] = useState<TrafficInfoType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrafficInfo = async () => {
      setLoading(true);
      setError(null);
      
      const response = await localInfoApi.searchTraffic(location, county);
      
      if (response.success && response.data?.trafficInfo) {
        setTrafficInfo(response.data.trafficInfo);
      } else {
        setError(response.error || "Nu s-au putut încărca informațiile de trafic");
      }
      
      setLoading(false);
    };

    fetchTrafficInfo();
  }, [location, county]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            Informații trafic
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Se verifică situația traficului...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !trafficInfo) {
    return null;
  }

  const hasContent = trafficInfo.restrictions?.length > 0 || trafficInfo.tips?.length > 0 || trafficInfo.tollInfo;

  if (!hasContent) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Route className="w-5 h-5 text-primary" />
          Informații trafic pentru {location}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Restricții */}
        {trafficInfo.restrictions?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-foreground flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Restricții rutiere
            </h4>
            <div className="space-y-2">
              {trafficInfo.restrictions.map((restriction, index) => {
                const StatusIcon = trafficStatusIcons[restriction.status] || trafficStatusIcons[restriction.icon || ''] || AlertTriangle;
                return (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${statusColors[restriction.status] || 'bg-muted'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium flex items-center gap-2">
                        <StatusIcon className="w-4 h-4" />
                        {restriction.road}
                      </span>
                      <Badge variant="outline">{restriction.status}</Badge>
                    </div>
                    <p className="text-sm">{restriction.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rute alternative */}
        {trafficInfo.alternativeRoutes && trafficInfo.alternativeRoutes.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-foreground flex items-center gap-2 text-sm">
              <Navigation className="w-4 h-4 text-primary" />
              Rute alternative
            </h4>
            <ul className="space-y-1">
              {trafficInfo.alternativeRoutes.map((route, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">→</span>
                  {route}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sfaturi */}
        {trafficInfo.tips?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-foreground flex items-center gap-2 text-sm">
              <Lightbulb className="w-4 h-4 text-primary" />
              Sfaturi pentru șoferi
            </h4>
            <ul className="space-y-1">
              {trafficInfo.tips.map((tip, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Taxe */}
        {trafficInfo.tollInfo && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <h4 className="font-medium text-foreground flex items-center gap-2 text-sm mb-1">
              <CircleDollarSign className="w-4 h-4 text-primary" />
              Informații taxe drum
            </h4>
            <p className="text-sm text-muted-foreground">{trafficInfo.tollInfo}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
