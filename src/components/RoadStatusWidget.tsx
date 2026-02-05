import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
 import { AlertTriangle, Loader2, Route, CheckCircle, Construction, ExternalLink } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";

interface RoadStatus {
  road: string;
  status: 'normal' | 'restricted' | 'closed' | 'works';
  description: string;
  region: string;
   source_url?: string;
}

const mockRoadStatus: RoadStatus[] = [
   { road: "DN1", status: "normal", description: "Trafic normal pe tot traseul", region: "București - Brașov", source_url: "https://www.infotrafic.ro" },
   { road: "A1", status: "works", description: "Lucrări între km 45-52, restricții de viteză 80 km/h", region: "București - Pitești", source_url: "https://www.cnair.ro" },
   { road: "DN7", status: "restricted", description: "Restricții pentru vehicule peste 7.5t în weekend", region: "Sibiu - Deva", source_url: "https://www.cnair.ro" },
   { road: "A3", status: "normal", description: "Trafic fluent, viteza recomandată 130 km/h", region: "București - Ploiești", source_url: "https://www.cnair.ro" },
   { road: "A2", status: "normal", description: "Trafic fluent pe autostradă", region: "București - Constanța", source_url: "https://www.cnair.ro" },
   { road: "DN2", status: "works", description: "Lucrări de întreținere, alternativ pe un sens km 120-135", region: "București - Suceava", source_url: "https://www.infotrafic.ro" },
   { road: "DN1A", status: "normal", description: "Trafic normal, posibil aglomerat în weekend", region: "Ploiești - Brașov", source_url: "https://www.infotrafic.ro" },
   { road: "A10", status: "works", description: "Construcție în desfășurare, circulație pe un sens", region: "Sebeș - Turda", source_url: "https://www.cnair.ro" },
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
   const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
     const fetchRoadConditions = async () => {
       try {
         // Try to fetch from database first
         const { data, error } = await supabase
           .from('road_conditions')
           .select('*')
           .gt('expires_at', new Date().toISOString())
           .order('road_name', { ascending: true })
           .limit(10);
 
         if (data && data.length > 0) {
           setRoads(data.map(r => ({
             road: r.road_name,
             status: r.condition_status as RoadStatus['status'],
             description: r.description || '',
             region: r.segment_start && r.segment_end ? `${r.segment_start} - ${r.segment_end}` : r.road_type,
             source_url: r.source_url || undefined
           })));
         } else {
           // Fallback to mock data
           setRoads(mockRoadStatus);
         }
         setLastUpdated(new Date());
       } catch (error) {
         console.error('Error fetching road conditions:', error);
         setRoads(mockRoadStatus);
       } finally {
         setLoading(false);
       }
     };
 
     fetchRoadConditions();
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
                 <div className="flex items-center gap-2">
                   <span className="font-bold text-foreground">{road.road}</span>
                   {road.source_url && (
                     <a 
                       href={road.source_url}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="text-muted-foreground hover:text-primary transition-colors"
                       title="Vezi sursa"
                     >
                       <ExternalLink className="w-3 h-3" />
                     </a>
                   )}
                 </div>
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
       <div className="mt-4 pt-4 border-t border-border">
         <div className="flex flex-wrap items-center justify-between gap-2">
           <p className="text-xs text-muted-foreground">
             Actualizat: {lastUpdated.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
           </p>
           <div className="flex items-center gap-3">
             <a 
               href="https://www.infotrafic.ro/" 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-xs text-primary hover:underline flex items-center gap-1"
             >
               InfoTrafic.ro <ExternalLink className="w-3 h-3" />
             </a>
             <a 
               href="https://www.cnair.ro" 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-xs text-primary hover:underline flex items-center gap-1"
             >
               CNAIR.ro <ExternalLink className="w-3 h-3" />
             </a>
           </div>
         </div>
        </div>
      </CardContent>
    </Card>
  );
};
