 import { useState, useEffect } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { 
   Car, 
   TrendingUp, 
   Users, 
   Route, 
   AlertTriangle, 
   Fuel,
   Clock,
   MapPin,
   BarChart3
 } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 
 interface TrafficStat {
   id: string;
   stat_key: string;
   stat_type: string;
   stat_value: number;
   stat_unit: string | null;
   year: number | null;
   month: number | null;
 }
 
 const defaultStats = [
   { key: "vehicles_registered", label: "Vehicule Înmatriculate", value: 8945231, unit: "", icon: Car, color: "text-blue-500", bgColor: "bg-blue-500/10" },
   { key: "km_highways", label: "Km Autostrăzi", value: 1042, unit: "km", icon: Route, color: "text-green-500", bgColor: "bg-green-500/10" },
   { key: "km_national_roads", label: "Km Drumuri Naționale", value: 17848, unit: "km", icon: MapPin, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
   { key: "accidents_2024", label: "Accidente 2024", value: 34521, unit: "", icon: AlertTriangle, color: "text-red-500", bgColor: "bg-red-500/10" },
   { key: "fuel_stations", label: "Stații Carburant", value: 2847, unit: "", icon: Fuel, color: "text-purple-500", bgColor: "bg-purple-500/10" },
   { key: "avg_commute", label: "Timp Mediu Navetă", value: 42, unit: "min", icon: Clock, color: "text-orange-500", bgColor: "bg-orange-500/10" },
   { key: "traffic_growth", label: "Creștere Trafic YoY", value: 4.2, unit: "%", icon: TrendingUp, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
   { key: "drivers_license", label: "Permise Active", value: 7856432, unit: "", icon: Users, color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
 ];
 
 export const ImprovedTrafficStats = () => {
   const [stats, setStats] = useState<typeof defaultStats>(defaultStats);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const fetchStats = async () => {
       try {
         const { data, error } = await supabase
           .from('traffic_statistics')
           .select('*')
           .gt('expires_at', new Date().toISOString())
           .order('stat_key', { ascending: true });
 
         if (data && data.length > 0) {
           // Merge with default stats
           const updatedStats = defaultStats.map(stat => {
             const dbStat = data.find(d => d.stat_key === stat.key);
             if (dbStat) {
               return { ...stat, value: Number(dbStat.stat_value), unit: dbStat.stat_unit || stat.unit };
             }
             return stat;
           });
           setStats(updatedStats);
         }
       } catch (error) {
         console.error('Error fetching traffic stats:', error);
       } finally {
         setLoading(false);
       }
     };
 
     fetchStats();
   }, []);
 
   const formatValue = (value: number, unit: string) => {
     if (value >= 1000000) {
       return `${(value / 1000000).toFixed(1)}M`;
     }
     if (value >= 1000) {
       return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
     }
     return value.toLocaleString('ro-RO');
   };
 
   return (
     <section className="py-8 px-4 bg-muted/30">
       <div className="container mx-auto">
         <div className="flex items-center justify-between mb-6">
           <div>
             <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
               <BarChart3 className="w-6 h-6 text-primary" />
               Statistici Trafic România
             </h2>
             <p className="text-muted-foreground text-sm mt-1">
               Date actualizate despre infrastructura rutieră și traficul din România
             </p>
           </div>
           <Badge variant="secondary" className="hidden md:flex">
             Actualizat {new Date().getFullYear()}
           </Badge>
         </div>
 
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {stats.map((stat, index) => {
             const Icon = stat.icon;
             return (
               <Card 
                 key={stat.key}
                 className={`overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] ${loading ? 'animate-pulse' : ''}`}
               >
                 <CardContent className="p-4">
                   <div className="flex items-start justify-between mb-3">
                     <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                       <Icon className={`w-5 h-5 ${stat.color}`} />
                     </div>
                     {index < 2 && (
                       <Badge variant="outline" className="text-xs">
                         Live
                       </Badge>
                     )}
                   </div>
                   <div>
                     <p className="text-2xl md:text-3xl font-bold text-foreground">
                       {loading ? '...' : formatValue(stat.value, stat.unit)}
                       {stat.unit && !loading && (
                         <span className="text-sm font-normal text-muted-foreground ml-1">
                           {stat.unit}
                         </span>
                       )}
                     </p>
                     <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                       {stat.label}
                     </p>
                   </div>
                 </CardContent>
               </Card>
             );
           })}
         </div>
 
         {/* Sources */}
         <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
           <span>Surse:</span>
           <a href="https://www.drpciv.ro" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
             DRPCIV
           </a>
           <span>•</span>
           <a href="https://www.cnair.ro" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
             CNAIR
           </a>
           <span>•</span>
           <a href="https://www.politiaromana.ro" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
             Poliția Română
           </a>
           <span>•</span>
           <a href="https://insse.ro" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
             INS
           </a>
         </div>
       </div>
     </section>
   );
 };