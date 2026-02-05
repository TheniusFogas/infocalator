import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
 import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
 import { Loader2, Search, MapPin, Star, Home, Building2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getPlaceholderImage, accommodationTypeIcons, getCategoryIcon } from "@/lib/categoryIcons";
 import { localInfoApi } from "@/lib/api/localInfo";
 import { useDebounce } from "@/hooks/useDebounce";

interface CachedAccommodation {
  id: string;
  slug: string;
  name: string;
  type: string;
  location: string;
  county: string | null;
  description: string | null;
  rating: number | null;
  price_range: string | null;
  image_keywords: string | null;
}

 // Popular Romanian cities for initial search
 const POPULAR_LOCATIONS = [
   "București", "Brașov", "Cluj-Napoca", "Sibiu", "Timișoara", 
   "Constanța", "Iași", "Oradea", "Sighișoara", "Sinaia"
 ];
 
const CazariList = () => {
  const [accommodations, setAccommodations] = useState<CachedAccommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
   const [searchingNew, setSearchingNew] = useState(false);
   const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
 
   const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    const fetchAccommodations = async () => {
       setLoading(true);
      const { data, error } = await supabase
        .from('cached_accommodations')
        .select('id, slug, name, type, location, county, description, rating, price_range, image_keywords')
        .gt('expires_at', new Date().toISOString())
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(50);

      if (!error && data) {
        setAccommodations(data);
      }
      setLoading(false);
    };

    fetchAccommodations();
  }, []);

   // Search for new accommodations when user types
   useEffect(() => {
     const searchNewAccommodations = async () => {
       if (debouncedSearch.length < 3) return;
       
       // Check if we already have results for this location
       const existingResults = accommodations.filter(acc => 
         acc.location.toLowerCase().includes(debouncedSearch.toLowerCase())
       );
       
       if (existingResults.length > 3) return; // Already have results
       
       setSearchingNew(true);
       try {
         const result = await localInfoApi.searchAccommodations(debouncedSearch);
         if (result.success && result.data?.accommodations?.length) {
           // Refresh from database after AI has cached results
           const { data } = await supabase
             .from('cached_accommodations')
             .select('id, slug, name, type, location, county, description, rating, price_range, image_keywords')
             .ilike('location', `%${debouncedSearch}%`)
             .gt('expires_at', new Date().toISOString())
             .limit(20);
           
           if (data?.length) {
             setAccommodations(prev => {
               const newItems = data.filter(d => !prev.some(p => p.id === d.id));
               return [...prev, ...newItems];
             });
           }
         }
       } catch (error) {
         console.error('Error searching accommodations:', error);
       } finally {
         setSearchingNew(false);
       }
     };
 
     searchNewAccommodations();
   }, [debouncedSearch]);
 
   const handleLocationClick = async (location: string) => {
     setSelectedLocation(location);
     setSearchQuery(location);
     setSearchingNew(true);
 
     try {
       const result = await localInfoApi.searchAccommodations(location);
       if (result.success) {
         // Refresh from database
         const { data } = await supabase
           .from('cached_accommodations')
           .select('id, slug, name, type, location, county, description, rating, price_range, image_keywords')
           .ilike('location', `%${location}%`)
           .gt('expires_at', new Date().toISOString())
           .limit(20);
         
         if (data?.length) {
           setAccommodations(prev => {
             const newItems = data.filter(d => !prev.some(p => p.id === d.id));
             return [...prev, ...newItems];
           });
         }
       }
     } catch (error) {
       console.error('Error:', error);
     } finally {
       setSearchingNew(false);
     }
   };
 
  const filteredAccommodations = accommodations.filter(acc =>
    acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (acc.type && acc.type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
           <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
             <Building2 className="w-8 h-8 text-primary" />
             Cazări în România
           </h1>
          <p className="text-muted-foreground">Descoperă cele mai bune opțiuni de cazare</p>
        </div>

         {/* Quick Location Buttons */}
         <div className="flex flex-wrap gap-2 mb-6">
           {POPULAR_LOCATIONS.map(loc => (
             <Button
               key={loc}
               variant={selectedLocation === loc ? "default" : "outline"}
               size="sm"
               onClick={() => handleLocationClick(loc)}
               disabled={searchingNew}
             >
               {loc}
             </Button>
           ))}
         </div>
 
         <div className="relative mb-6 max-w-md flex gap-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
             placeholder="Caută cazări în orice localitate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
           {searchingNew && (
             <div className="flex items-center gap-2 text-muted-foreground">
               <RefreshCw className="w-4 h-4 animate-spin" />
               <span className="text-sm">Caut...</span>
             </div>
           )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Se încarcă cazările...</span>
          </div>
        ) : filteredAccommodations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nicio cazare găsită</h3>
              <p className="text-muted-foreground">
                 {searchQuery 
                   ? `Căutăm cazări în "${searchQuery}"... Încearcă alt nume de localitate.`
                   : "Selectează o localitate populară sau caută după nume pentru a găsi cazări."
                 }
              </p>
               {!searchQuery && (
                 <div className="flex flex-wrap justify-center gap-2 mt-4">
                   {POPULAR_LOCATIONS.slice(0, 5).map(loc => (
                     <Button
                       key={loc}
                       variant="secondary"
                       size="sm"
                       onClick={() => handleLocationClick(loc)}
                     >
                       Cazări în {loc}
                     </Button>
                   ))}
                 </div>
               )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccommodations.map((acc) => {
              const TypeIcon = getCategoryIcon(acc.type || '', accommodationTypeIcons);
              return (
                <Link
                  key={acc.id}
                  to={`/cazari/${acc.slug}?location=${encodeURIComponent(acc.location)}${acc.county ? `&county=${encodeURIComponent(acc.county)}` : ''}`}
                  className="group block"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all hover:border-primary/50">
                    <div className="aspect-video relative">
                      <img
                        src={getPlaceholderImage(acc.image_keywords || acc.name, 600, 400)}
                        alt={acc.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className="gap-1 bg-background/90 text-foreground">
                          <TypeIcon className="w-3 h-3" />
                          {acc.type}
                        </Badge>
                      </div>
                      {acc.rating && (
                        <Badge className="absolute top-2 right-2 bg-green-500 text-white">
                          <Star className="w-3 h-3 fill-white mr-1" />
                          {acc.rating}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {acc.name}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {acc.location}{acc.county ? `, ${acc.county}` : ''}
                      </p>
                      {acc.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {acc.description}
                        </p>
                      )}
                      {acc.price_range && (
                        <Badge variant="secondary" className="mt-2">
                          {acc.price_range}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
         
         {/* Help Text */}
         <div className="mt-8 text-center text-sm text-muted-foreground">
           <p>
             Nu găsești cazarea dorită? Caută după numele localității și sistemul va căuta automat opțiuni noi.
           </p>
         </div>
      </main>

      <Footer />
    </div>
  );
};

export default CazariList;