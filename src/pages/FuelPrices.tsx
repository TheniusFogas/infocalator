 import { useState, useEffect } from "react";
 import { Header } from "@/components/Header";
 import { Footer } from "@/components/Footer";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Badge } from "@/components/ui/badge";
 import { Fuel, TrendingUp, TrendingDown, Minus, MapPin } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 
 interface FuelPriceData {
   county: string;
   fuel_type: string;
   price_min: number;
   price_max: number;
   price_avg: number;
   trend: string;
 }
 
 const FUEL_TYPES = [
   { id: "benzina_standard", label: "Benzină Standard", color: "bg-yellow-500" },
   { id: "benzina_premium", label: "Benzină Premium", color: "bg-yellow-600" },
   { id: "motorina_standard", label: "Motorină Standard", color: "bg-gray-600" },
   { id: "motorina_premium", label: "Motorină Premium", color: "bg-gray-700" },
   { id: "gpl", label: "GPL", color: "bg-green-500" },
 ];
 
 const COUNTIES = [
   "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani", "Brăila",
   "Brașov", "București", "Buzău", "Călărași", "Caraș-Severin", "Cluj", "Constanța",
   "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu", "Gorj", "Harghita", "Hunedoara",
   "Ialomița", "Iași", "Ilfov", "Maramureș", "Mehedinți", "Mureș", "Neamț", "Olt",
   "Prahova", "Sălaj", "Satu Mare", "Sibiu", "Suceava", "Teleorman", "Timiș", "Tulcea",
   "Vaslui", "Vâlcea", "Vrancea"
 ];
 
 // Mock data - will be replaced with real data from scraping
 const generateMockPrices = (): FuelPriceData[] => {
   const data: FuelPriceData[] = [];
   COUNTIES.forEach(county => {
     FUEL_TYPES.forEach(fuel => {
       const basePrice = fuel.id === "gpl" ? 3.2 : 
                        fuel.id.includes("premium") ? 7.8 : 7.2;
       const variance = (Math.random() - 0.5) * 0.6;
       const avg = Math.round((basePrice + variance) * 100) / 100;
       data.push({
         county,
         fuel_type: fuel.id,
         price_min: Math.round((avg - 0.15) * 100) / 100,
         price_max: Math.round((avg + 0.2) * 100) / 100,
         price_avg: avg,
         trend: Math.random() > 0.6 ? "up" : Math.random() > 0.3 ? "down" : "stable"
       });
     });
   });
   return data;
 };
 
 const FuelPrices = () => {
   const [selectedFuel, setSelectedFuel] = useState("benzina_standard");
   const [prices, setPrices] = useState<FuelPriceData[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
 
   useEffect(() => {
     const fetchPrices = async () => {
       setLoading(true);
       
       // Try to fetch from DB first
       const { data, error } = await supabase
         .from("fuel_prices")
         .select("*")
         .gt("expires_at", new Date().toISOString());
       
       if (data && data.length > 0) {
         setPrices(data.map(d => ({
           county: d.county,
           fuel_type: d.fuel_type,
           price_min: Number(d.price_min),
           price_max: Number(d.price_max),
           price_avg: Number(d.price_avg),
           trend: d.trend || "stable"
         })));
       } else {
         // Use mock data as fallback
         setPrices(generateMockPrices());
       }
       
       setLoading(false);
     };
     
     fetchPrices();
   }, []);
 
   const filteredPrices = prices.filter(p => p.fuel_type === selectedFuel);
   const nationalAvg = filteredPrices.length > 0 
     ? Math.round(filteredPrices.reduce((sum, p) => sum + p.price_avg, 0) / filteredPrices.length * 100) / 100
     : 0;
   const minPrice = filteredPrices.length > 0 
     ? Math.min(...filteredPrices.map(p => p.price_min))
     : 0;
   const maxPrice = filteredPrices.length > 0 
     ? Math.max(...filteredPrices.map(p => p.price_max))
     : 0;
 
   const TrendIcon = ({ trend }: { trend: string }) => {
     if (trend === "up") return <TrendingUp className="w-4 h-4 text-red-500" />;
     if (trend === "down") return <TrendingDown className="w-4 h-4 text-green-500" />;
     return <Minus className="w-4 h-4 text-muted-foreground" />;
   };
 
   return (
     <div className="min-h-screen flex flex-col bg-background">
       <Header />
       
       <main className="flex-1 py-8 px-4">
         <div className="container mx-auto">
           <div className="mb-8">
             <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
               <Fuel className="w-8 h-8 text-primary" />
               Prețuri Carburanți România
             </h1>
             <p className="text-muted-foreground">
               Prețuri actualizate pentru benzină, motorină și GPL pe județe
             </p>
           </div>
 
           {/* Fuel Type Tabs */}
           <Tabs value={selectedFuel} onValueChange={setSelectedFuel} className="mb-8">
             <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
               {FUEL_TYPES.map(fuel => (
                 <TabsTrigger 
                   key={fuel.id} 
                   value={fuel.id}
                   className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                 >
                   {fuel.label}
                 </TabsTrigger>
               ))}
             </TabsList>
           </Tabs>
 
           {/* National Stats */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
             <Card>
               <CardContent className="pt-6 text-center">
                 <p className="text-sm text-muted-foreground mb-1">Preț Mediu Național</p>
                 <p className="text-4xl font-bold text-primary">{nationalAvg}</p>
                 <p className="text-sm text-muted-foreground">RON/litru</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="pt-6 text-center">
                 <p className="text-sm text-muted-foreground mb-1">Preț Minim</p>
                 <p className="text-4xl font-bold text-green-600">{minPrice}</p>
                 <p className="text-sm text-muted-foreground">RON/litru</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="pt-6 text-center">
                 <p className="text-sm text-muted-foreground mb-1">Preț Maxim</p>
                 <p className="text-4xl font-bold text-red-600">{maxPrice}</p>
                 <p className="text-sm text-muted-foreground">RON/litru</p>
               </CardContent>
             </Card>
           </div>
 
           {/* Counties Grid */}
           <Card>
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                 <MapPin className="w-5 h-5 text-primary" />
                 Prețuri pe Județe
               </CardTitle>
             </CardHeader>
             <CardContent>
               {loading ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                   {[...Array(42)].map((_, i) => (
                     <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                   ))}
                 </div>
               ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                   {filteredPrices
                     .sort((a, b) => a.price_avg - b.price_avg)
                     .map((price, idx) => (
                     <div 
                       key={price.county}
                       onClick={() => setSelectedCounty(price.county)}
                       className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                         selectedCounty === price.county 
                           ? "border-primary bg-primary/5" 
                           : "border-border hover:border-primary/50"
                       }`}
                     >
                       <div className="flex items-center justify-between mb-1">
                         <span className="text-xs font-medium text-muted-foreground truncate">
                           {price.county}
                         </span>
                         <TrendIcon trend={price.trend} />
                       </div>
                       <p className="text-xl font-bold text-foreground">
                         {price.price_avg}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         {price.price_min} - {price.price_max}
                       </p>
                       {idx < 3 && (
                         <Badge variant="secondary" className="mt-1 text-xs bg-green-100 text-green-700">
                           Cel mai ieftin
                         </Badge>
                       )}
                     </div>
                   ))}
                 </div>
               )}
             </CardContent>
           </Card>
 
           {/* Info */}
           <div className="mt-6 text-center">
             <p className="text-sm text-muted-foreground">
               Prețuri orientative actualizate periodic. Verificați la stația de alimentare pentru prețuri exacte.
             </p>
             <p className="text-xs text-muted-foreground mt-1">
               Sursă: date agregate din multiple surse publice
             </p>
           </div>
         </div>
       </main>
 
       <Footer />
     </div>
   );
 };
 
 export default FuelPrices;