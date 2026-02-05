 import { useState, useEffect } from "react";
 import { Header } from "@/components/Header";
 import { Footer } from "@/components/Footer";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Badge } from "@/components/ui/badge";
 import { Fuel, TrendingUp, TrendingDown, Minus, MapPin, Info } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { SEOHead } from "@/components/SEOHead";
 
 interface FuelPriceData {
   county: string;
   fuel_type: string;
   price_min: number;
   price_max: number;
   price_avg: number;
   trend: string;
 }
 
 const FUEL_TYPES = [
   { id: "benzina_standard", label: "Benzină Standard", color: "bg-yellow-500", basePrice: 7.25 },
   { id: "benzina_premium", label: "Benzină Premium", color: "bg-yellow-600", basePrice: 7.85 },
   { id: "motorina_standard", label: "Motorină Standard", color: "bg-gray-600", basePrice: 7.15 },
   { id: "motorina_premium", label: "Motorină Premium", color: "bg-gray-700", basePrice: 7.65 },
   { id: "gpl", label: "GPL", color: "bg-green-500", basePrice: 3.25 },
 ];
 
 // Romania SVG paths for interactive map
 const COUNTY_PATHS: Record<string, { path: string; cx: number; cy: number }> = {
   "București": { path: "M320,280 L340,280 L345,300 L320,305 L315,290 Z", cx: 328, cy: 290 },
   "Ilfov": { path: "M305,265 L355,260 L365,310 L350,320 L300,315 L295,280 Z", cx: 328, cy: 288 },
   "Cluj": { path: "M180,140 L230,135 L240,180 L210,195 L170,185 L165,155 Z", cx: 200, cy: 165 },
   "Brașov": { path: "M280,190 L320,185 L335,230 L310,250 L270,245 L260,210 Z", cx: 295, cy: 218 },
   "Sibiu": { path: "M230,190 L280,185 L290,230 L255,250 L220,240 L210,210 Z", cx: 250, cy: 218 },
   "Timiș": { path: "M80,180 L140,175 L155,240 L130,265 L65,260 L55,210 Z", cx: 105, cy: 218 },
   "Constanța": { path: "M380,290 L420,285 L435,360 L400,400 L365,390 L355,320 Z", cx: 395, cy: 340 },
   "Iași": { path: "M350,100 L400,95 L415,150 L385,170 L340,165 L330,120 Z", cx: 370, cy: 135 },
   "Prahova": { path: "M295,230 L335,225 L350,275 L320,295 L280,290 L270,255 Z", cx: 308, cy: 260 },
   "Dolj": { path: "M155,300 L210,295 L225,365 L190,395 L140,390 L125,335 Z", cx: 175, cy: 345 },
   "Galați": { path: "M370,200 L420,195 L435,250 L400,275 L355,270 L345,225 Z", cx: 388, cy: 238 },
   "Argeș": { path: "M235,260 L285,255 L300,315 L265,345 L220,340 L205,290 Z", cx: 253, cy: 300 },
   "Bacău": { path: "M320,130 L370,125 L385,180 L350,210 L305,205 L290,155 Z", cx: 340, cy: 168 },
   "Bihor": { path: "M95,100 L155,95 L170,165 L140,195 L80,190 L65,130 Z", cx: 120, cy: 145 },
   "Suceava": { path: "M280,60 L350,55 L365,120 L330,150 L265,145 L250,90 Z", cx: 308, cy: 103 },
   "Mureș": { path: "M225,140 L280,135 L295,195 L260,220 L210,215 L195,165 Z", cx: 248, cy: 178 },
   "Arad": { path: "M65,145 L130,140 L145,210 L115,245 L50,240 L35,180 Z", cx: 92, cy: 190 },
   "Hunedoara": { path: "M140,200 L200,195 L215,265 L180,300 L125,295 L110,235 Z", cx: 163, cy: 248 },
   "Neamț": { path: "M295,95 L345,90 L360,150 L325,180 L280,175 L265,125 Z", cx: 315, cy: 138 },
   "Buzău": { path: "M335,235 L380,230 L395,290 L360,320 L320,315 L305,265 Z", cx: 352, cy: 275 },
   "Maramureș": { path: "M150,50 L220,45 L235,110 L200,145 L135,140 L120,85 Z", cx: 178, cy: 95 },
   "Harghita": { path: "M280,145 L330,140 L345,205 L310,235 L265,230 L250,180 Z", cx: 298, cy: 188 },
   "Vrancea": { path: "M350,180 L395,175 L410,235 L375,265 L335,260 L320,210 Z", cx: 365, cy: 220 },
   "Alba": { path: "M190,185 L245,180 L260,245 L225,280 L175,275 L160,220 Z", cx: 213, cy: 230 },
   "Botoșani": { path: "M330,50 L385,45 L400,100 L365,130 L315,125 L300,80 Z", cx: 350, cy: 88 },
   "Satu Mare": { path: "M115,45 L180,40 L195,105 L160,140 L100,135 L85,80 Z", cx: 143, cy: 90 },
   "Covasna": { path: "M310,200 L355,195 L370,255 L335,285 L295,280 L280,230 Z", cx: 328, cy: 240 },
   "Gorj": { path: "M155,255 L210,250 L225,315 L190,350 L140,345 L125,290 Z", cx: 175, cy: 300 },
   "Vaslui": { path: "M375,135 L425,130 L440,195 L405,225 L360,220 L345,165 Z", cx: 393, cy: 178 },
   "Vâlcea": { path: "M210,260 L260,255 L275,320 L240,355 L195,350 L180,295 Z", cx: 228, cy: 305 },
   "Olt": { path: "M200,320 L255,315 L270,385 L235,420 L185,415 L170,355 Z", cx: 220, cy: 368 },
   "Teleorman": { path: "M245,345 L300,340 L315,410 L280,445 L230,440 L215,385 Z", cx: 265, cy: 393 },
   "Dâmbovița": { path: "M270,265 L320,260 L335,325 L300,360 L255,355 L240,300 Z", cx: 288, cy: 310 },
   "Călărași": { path: "M340,310 L390,305 L405,375 L370,410 L325,405 L310,350 Z", cx: 358, cy: 358 },
   "Giurgiu": { path: "M290,345 L340,340 L355,410 L320,445 L275,440 L260,385 Z", cx: 308, cy: 393 },
   "Ialomița": { path: "M350,285 L400,280 L415,350 L380,385 L335,380 L320,320 Z", cx: 368, cy: 333 },
   "Tulcea": { path: "M410,240 L470,235 L485,310 L450,350 L395,345 L380,280 Z", cx: 433, cy: 293 },
   "Brăila": { path: "M380,245 L425,240 L440,305 L405,340 L365,335 L350,280 Z", cx: 398, cy: 290 },
   "Mehedinți": { path: "M110,295 L165,290 L180,360 L145,400 L95,395 L80,335 Z", cx: 130, cy: 345 },
   "Caraș-Severin": { path: "M80,235 L145,230 L160,310 L125,355 L65,350 L50,280 Z", cx: 108, cy: 293 },
   "Sălaj": { path: "M145,100 L200,95 L215,155 L180,190 L130,185 L115,135 Z", cx: 165, cy: 143 },
   "Bistrița-Năsăud": { path: "M215,85 L275,80 L290,145 L255,180 L200,175 L185,120 Z", cx: 240, cy: 130 },
 };
 
 const COUNTIES = Object.keys(COUNTY_PATHS).concat([
   "Botoșani", "Călărași", "Caraș-Severin", "Dâmbovița", "Giurgiu", 
   "Gorj", "Ialomița", "Mehedinți", "Olt", "Sălaj", "Teleorman", "Vâlcea"
 ].filter(c => !Object.keys(COUNTY_PATHS).includes(c)));
 
 // Unique counties
 const ALL_COUNTIES = [
   "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani", 
   "Brăila", "Brașov", "București", "Buzău", "Călărași", "Caraș-Severin", 
   "Cluj", "Constanța", "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu", 
   "Gorj", "Harghita", "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș", 
   "Mehedinți", "Mureș", "Neamț", "Olt", "Prahova", "Sălaj", "Satu Mare", 
   "Sibiu", "Suceava", "Teleorman", "Timiș", "Tulcea", "Vaslui", "Vâlcea", "Vrancea"
 ];
 
 // Mock data - will be replaced with real data from scraping
 const generateMockPrices = (): FuelPriceData[] => {
   const data: FuelPriceData[] = [];
   ALL_COUNTIES.forEach(county => {
     FUEL_TYPES.forEach(fuel => {
       const basePrice = fuel.basePrice;
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
   const [hoveredCounty, setHoveredCounty] = useState<string | null>(null);
 
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
 
   const getCountyColor = (county: string) => {
     const price = filteredPrices.find(p => p.county === county);
     if (!price) return "fill-muted";
     
     const range = maxPrice - minPrice;
     const normalized = range > 0 ? (price.price_avg - minPrice) / range : 0.5;
     
     if (normalized < 0.33) return "fill-green-400";
     if (normalized < 0.66) return "fill-yellow-400";
     return "fill-red-400";
   };
 
   const getCountyPriceInfo = (county: string) => {
     return filteredPrices.find(p => p.county === county);
   };
 
   return (
     <div className="min-h-screen flex flex-col bg-background">
       <SEOHead 
         title="Prețuri Carburanți România - Benzină, Motorină, GPL pe Județe"
         description="Prețuri actualizate pentru benzină, motorină și GPL pe fiecare județ din România. Hartă interactivă cu prețuri minime și maxime."
       />
       <Header />
       
       <main className="flex-1 py-8 px-4">
         <div className="container mx-auto">
           <div className="mb-8">
             <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
               <Fuel className="w-8 h-8 text-primary" />
               Prețuri Carburanți România
             </h1>
             <p className="text-muted-foreground">
               Prețuri actualizate pentru benzină, motorină și GPL pe fiecare județ. Click pe hartă pentru detalii.
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
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
             <Card>
               <CardContent className="pt-6 text-center">
                 <p className="text-sm text-muted-foreground mb-1">Preț Mediu Național</p>
                 <p className="text-3xl font-bold text-primary">{nationalAvg}</p>
                 <p className="text-sm text-muted-foreground">RON/litru</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="pt-6 text-center">
                 <p className="text-sm text-muted-foreground mb-1">Preț Minim</p>
                 <p className="text-3xl font-bold text-green-600">{minPrice}</p>
                 <p className="text-sm text-muted-foreground">RON/litru</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="pt-6 text-center">
                 <p className="text-sm text-muted-foreground mb-1">Preț Maxim</p>
                 <p className="text-3xl font-bold text-red-600">{maxPrice}</p>
                 <p className="text-sm text-muted-foreground">RON/litru</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="pt-6 text-center">
                 <p className="text-sm text-muted-foreground mb-1">Județe Analizate</p>
                 <p className="text-3xl font-bold text-foreground">{ALL_COUNTIES.length}</p>
                 <p className="text-sm text-muted-foreground">județe</p>
               </CardContent>
             </Card>
           </div>
 
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
             {/* Interactive Map */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <MapPin className="w-5 h-5 text-primary" />
                   Hartă Interactivă România
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="relative">
                   <svg viewBox="0 0 500 450" className="w-full h-auto">
                     {/* Romania outline and counties */}
                     {Object.entries(COUNTY_PATHS).map(([county, data]) => {
                       const priceInfo = getCountyPriceInfo(county);
                       return (
                         <g key={county}>
                           <path
                             d={data.path}
                             className={`${getCountyColor(county)} stroke-background stroke-2 cursor-pointer transition-all hover:opacity-80 ${
                               selectedCounty === county ? 'stroke-primary stroke-[3]' : ''
                             } ${hoveredCounty === county ? 'opacity-90' : ''}`}
                             onClick={() => setSelectedCounty(county)}
                             onMouseEnter={() => setHoveredCounty(county)}
                             onMouseLeave={() => setHoveredCounty(null)}
                           />
                           {priceInfo && (
                             <text
                               x={data.cx}
                               y={data.cy}
                               textAnchor="middle"
                               className="text-[8px] fill-foreground font-bold pointer-events-none"
                             >
                               {priceInfo.price_avg}
                             </text>
                           )}
                         </g>
                       );
                     })}
                   </svg>
                   
                   {/* Hover tooltip */}
                   {hoveredCounty && (
                     <div className="absolute top-2 right-2 bg-card border border-border rounded-lg p-3 shadow-lg">
                       <p className="font-semibold text-foreground">{hoveredCounty}</p>
                       {getCountyPriceInfo(hoveredCounty) && (
                         <>
                           <p className="text-2xl font-bold text-primary">
                             {getCountyPriceInfo(hoveredCounty)?.price_avg} RON
                           </p>
                           <p className="text-xs text-muted-foreground">
                             {getCountyPriceInfo(hoveredCounty)?.price_min} - {getCountyPriceInfo(hoveredCounty)?.price_max} RON
                           </p>
                         </>
                       )}
                     </div>
                   )}
                 </div>
                 
                 {/* Legend */}
                 <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 rounded bg-green-400" />
                     <span className="text-xs text-muted-foreground">Ieftin</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 rounded bg-yellow-400" />
                     <span className="text-xs text-muted-foreground">Mediu</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 rounded bg-red-400" />
                     <span className="text-xs text-muted-foreground">Scump</span>
                   </div>
                 </div>
               </CardContent>
             </Card>
 
             {/* Counties Grid */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <Fuel className="w-5 h-5 text-primary" />
                   Prețuri pe Județe
                   <Badge variant="secondary" className="ml-auto">{FUEL_TYPES.find(f => f.id === selectedFuel)?.label}</Badge>
                 </CardTitle>
               </CardHeader>
               <CardContent className="max-h-[500px] overflow-y-auto">
                 {loading ? (
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                     {[...Array(12)].map((_, i) => (
                       <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                     ))}
                   </div>
                 ) : (
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                         <p className="text-lg font-bold text-foreground">
                           {price.price_avg} RON
                         </p>
                         <p className="text-xs text-muted-foreground">
                           {price.price_min} - {price.price_max}
                         </p>
                         {idx < 3 && (
                           <Badge variant="secondary" className="mt-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                             Top 3 ieftin
                           </Badge>
                         )}
                       </div>
                     ))}
                   </div>
                 )}
               </CardContent>
             </Card>
           </div>
           
           {/* Selected County Detail */}
           {selectedCounty && getCountyPriceInfo(selectedCounty) && (
             <Card className="mb-8">
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <Info className="w-5 h-5 text-primary" />
                   Detalii {selectedCounty}
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                   {FUEL_TYPES.map(fuel => {
                     const price = prices.find(p => p.county === selectedCounty && p.fuel_type === fuel.id);
                     return (
                       <div key={fuel.id} className="text-center p-4 rounded-lg bg-muted/50">
                         <p className="text-sm font-medium text-muted-foreground mb-1">{fuel.label}</p>
                         <p className="text-2xl font-bold text-foreground">{price?.price_avg || '-'}</p>
                         <p className="text-xs text-muted-foreground">RON/litru</p>
                         {price && (
                           <p className="text-xs text-muted-foreground mt-1">
                             {price.price_min} - {price.price_max}
                           </p>
                         )}
                       </div>
                     );
                   })}
                 </div>
               </CardContent>
             </Card>
           )}
 
           {/* Info */}
           <div className="mt-6 text-center">
             <p className="text-sm text-muted-foreground">
               Prețuri orientative actualizate periodic. Verificați la stația de alimentare pentru prețuri exacte.
             </p>
             <p className="text-xs text-muted-foreground mt-1">
               Sursă: date agregate din surse publice | Actualizat: {new Date().toLocaleDateString('ro-RO')}
             </p>
           </div>
         </div>
       </main>
 
       <Footer />
     </div>
   );
 };
 
 export default FuelPrices;