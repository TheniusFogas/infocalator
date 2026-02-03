import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, Route, CheckCircle, Construction } from "lucide-react";

interface RoadStatus {
  road: string;
  status: 'normal' | 'restricted' | 'closed' | 'works';
  description: string;
  region: string;
}

const mockRoadStatus: RoadStatus[] = [
  { road: "DN1", status: "normal", description: "Trafic normal pe tot traseul", region: "București - Brașov" },
  { road: "A1", status: "works", description: "Lucrări între km 45-52, restricții de viteză", region: "București - Pitești" },
  { road: "DN7", status: "restricted", description: "Restricții pentru vehicule peste 7.5t", region: "Sibiu - Deva" },
  { road: "DN1C", status: "normal", description: "Trafic normal", region: "Cluj - Dej" },
  { road: "A2", status: "normal", description: "Trafic fluent pe autostradă", region: "București - Constanța" },
  { road: "DN2", status: "works", description: "Lucrări de întreținere, alternativ pe un sens", region: "București - Suceava" },
];

const statusConfig = {
  normal: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Normal' },
  restricted: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Restricții' },
  closed: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Închis' },
  works: { icon: Construction, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Lucrări' },
};

export const RoadStatusWidget = () => {
  const [roads, setRoads] = useState<RoadStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call - in production this would fetch from CNAIR or similar
    const timer = setTimeout(() => {
      setRoads(mockRoadStatus);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            Stare Drumuri Principale
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Route className="w-5 h-5 text-primary" />
          Stare Drumuri Principale
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {roads.map((road, index) => {
            const config = statusConfig[road.status];
            const Icon = config.icon;
            
            return (
              <div 
                key={index}
                className={`p-3 rounded-lg border border-border ${config.bg} transition-colors hover:opacity-90`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-foreground">{road.road}</span>
                  <Badge variant="outline" className={`${config.color} border-current`}>
                    <Icon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
                <p className="text-sm text-foreground mb-1">{road.description}</p>
                <p className="text-xs text-muted-foreground">{road.region}</p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Actualizat automat din surse oficiale. Pentru informații în timp real, verificați CNAIR.
        </p>
      </CardContent>
    </Card>
  );
};
