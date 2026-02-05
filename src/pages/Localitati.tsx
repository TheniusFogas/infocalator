 import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CityCard } from "@/components/CityCard";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Button } from "@/components/ui/button";
 import { Search, Building2, Landmark, TrendingUp, Users, Loader2, ChevronDown } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { useDebounce } from "@/hooks/useDebounce";
 
 interface Locality {
   id: string;
   name: string;
   county: string;
   population: number | null;
   locality_type: string;
   latitude: number;
   longitude: number;
   is_county_seat: boolean | null;
 }

const counties = [
  "Toate", "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani", "Brașov", "Brăila",
  "București", "Buzău", "Caraș-Severin", "Cluj", "Constanța", "Covasna", "Călărași", "Dolj", "Dâmbovița",
  "Galați", "Giurgiu", "Gorj", "Harghita", "Hunedoara", "Ialomița", "Iași", "Maramureș", "Mehedinți",
  "Mureș", "Neamț", "Olt", "Prahova", "Satu Mare", "Sibiu", "Suceava", "Sălaj", "Teleorman", "Timiș",
  "Tulcea", "Vaslui", "Vrancea", "Vâlcea"
];

 const localityTypes = ["Toate", "Municipiu", "Oraș", "Comună", "Sat", "Stațiune"];
 
 const ITEMS_PER_PAGE = 100;

const LocalitatiPage = () => {
  const navigate = useNavigate();
   const [localities, setLocalities] = useState<Locality[]>([]);
   const [majorLocalities, setMajorLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(true);
   const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("Toate");
   const [selectedType, setSelectedType] = useState("Toate");
   const [totalCount, setTotalCount] = useState(0);
   const [currentPage, setCurrentPage] = useState(0);
   const [hasMore, setHasMore] = useState(true);
   
   const debouncedSearch = useDebounce(searchQuery, 300);
 
   // Fetch total counts and major localities
   const fetchInitialData = useCallback(async () => {
     try {
       // Get total count
       const { count } = await supabase
         .from('localities')
         .select('*', { count: 'exact', head: true });
       
       setTotalCount(count || 0);
       
       // Get major localities (municipalities and large cities)
       const { data: majors } = await supabase
         .from('localities')
         .select('*')
         .or('locality_type.eq.Municipiu,is_county_seat.eq.true')
         .order('population', { ascending: false, nullsFirst: false })
         .limit(50);
       
       setMajorLocalities(majors || []);
     } catch (error) {
       console.error('Error fetching initial data:', error);
     }
   }, []);
 
   // Fetch filtered localities with pagination
   const fetchLocalities = useCallback(async (page: number, append: boolean = false) => {
     if (page === 0) {
       setLoading(true);
     } else {
       setLoadingMore(true);
     }
     
     try {
       let query = supabase
         .from('localities')
         .select('*');
       
       // Apply search filter
       if (debouncedSearch) {
         const searchLower = debouncedSearch.toLowerCase()
           .normalize('NFD')
           .replace(/[\u0300-\u036f]/g, '')
           .replace(/ș|Ș/g, 's')
           .replace(/ț|Ț/g, 't')
           .replace(/ă|Ă/g, 'a')
           .replace(/â|Â/g, 'a')
           .replace(/î|Î/g, 'i');
         
         query = query.or(`name_ascii.ilike.%${searchLower}%,name.ilike.%${debouncedSearch}%`);
       }
       
       // Apply county filter
       if (selectedCounty !== "Toate") {
         query = query.eq('county', selectedCounty);
       }
       
       // Apply type filter
       if (selectedType !== "Toate") {
         query = query.eq('locality_type', selectedType);
       }
       
       // Order and paginate
       query = query
         .order('population', { ascending: false, nullsFirst: false })
         .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);
       
       const { data, error } = await query;
       
       if (error) throw error;
       
       if (append) {
         setLocalities(prev => [...prev, ...(data || [])]);
       } else {
         setLocalities(data || []);
       }
       
       setHasMore((data?.length || 0) === ITEMS_PER_PAGE);
       setCurrentPage(page);
     } catch (error) {
       console.error('Error fetching localities:', error);
     } finally {
       setLoading(false);
       setLoadingMore(false);
     }
   }, [debouncedSearch, selectedCounty, selectedType]);

  useEffect(() => {
     fetchInitialData();
  }, []);
 
   useEffect(() => {
     fetchLocalities(0);
   }, [debouncedSearch, selectedCounty, selectedType]);
 
   const loadMore = () => {
     if (!loadingMore && hasMore) {
       fetchLocalities(currentPage + 1, true);
     }
   };

   // Group localities by county
   const localitiesByCounty = useMemo(() => {
     const grouped: Record<string, Locality[]> = {};
     localities.forEach((loc) => {
       if (!grouped[loc.county]) {
         grouped[loc.county] = [];
      }
       grouped[loc.county].push(loc);
    });
     // Sort counties alphabetically
     const sorted: Record<string, Locality[]> = {};
     Object.keys(grouped).sort().forEach(key => {
       sorted[key] = grouped[key];
     });
     return sorted;
   }, [localities]);

  const formatPopulation = (pop: number) => {
    if (pop >= 1000000) {
      return `${(pop / 1000000).toFixed(0)}M+`;
    }
    return pop.toLocaleString();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-8 px-4">
          <div className="container mx-auto">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Landmark className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Toate Localitățile din România
                </h1>
                <p className="text-muted-foreground mt-1">
                  Parcurge toate orașele, comunele și satele din România. Calculează distanțe și planifică-ți rutele.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <StatCard icon={Building2} value={loading ? "..." : totalCount.toLocaleString()} label="Total Localități" />
               <StatCard icon={Landmark} value="42" label="Județe" iconColor="text-warning" />
               <StatCard icon={TrendingUp} value={loading ? "..." : majorLocalities.length.toString()} label="Municipii" iconColor="text-success" />
               <StatCard icon={Users} value={loading ? "..." : localities.length.toLocaleString()} label="Afișate" iconColor="text-info" />
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="px-4 pb-8">
          <div className="container mx-auto">
            <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Input */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1">
                    <Search className="w-4 h-4" />
                    Caută după nume sau județ...
                  </label>
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Caută după nume sau județ..."
                    className="h-11 bg-background"
                  />
                </div>

                {/* County Filter */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1">
                    <Landmark className="w-4 h-4" />
                    Filtrează după Județ
                  </label>
                  <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                    <SelectTrigger className="h-11 bg-background">
                      <SelectValue placeholder="Toate" />
                    </SelectTrigger>
                    <SelectContent>
                      {counties.map((county) => (
                        <SelectItem key={county} value={county}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    Filtrează după Tip
                  </label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="h-11 bg-background">
                      <SelectValue placeholder="Toate" />
                    </SelectTrigger>
                    <SelectContent>
                       {localityTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">
                   {loading ? "Se încarcă..." : `${localities.length} din ${totalCount.toLocaleString()} localități`}
                </span>
              </div>
            </div>
          </div>
        </section>

         {/* Major Localities Section */}
         {!loading && majorLocalities.length > 0 && !debouncedSearch && selectedCounty === "Toate" && selectedType === "Toate" && (
          <section className="px-4 pb-8">
            <div className="container mx-auto">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                 Municipii și Reședințe de Județ
              </h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {majorLocalities.slice(0, 20).map((loc) => (
                  <CityCard
                     key={loc.id}
                     name={loc.name}
                     county={loc.county}
                     population={loc.population || 0}
                    type="major"
                     cityType={loc.locality_type}
                     onClick={() => navigate(`/localitati/${loc.id}`)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

         {/* All Localities by County */}
        <section className="px-4 pb-12">
          <div className="container mx-auto">
             <h2 className="text-xl font-bold text-foreground mb-6">
               {debouncedSearch || selectedCounty !== "Toate" || selectedType !== "Toate" 
                 ? "Rezultate" 
                 : "Toate Localitățile"}
             </h2>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="city-card animate-pulse">
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
             ) : localities.length === 0 ? (
               <div className="text-center py-12 text-muted-foreground">
                 <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                 <p>Nu s-au găsit localități pentru criteriile selectate.</p>
                 <p className="text-sm mt-2">Încearcă să modifici filtrele sau termenul de căutare.</p>
               </div>
            ) : (
               <>
                 {Object.entries(localitiesByCounty).map(([county, countyLocalities]) => (
                   <div key={county} className="mb-8">
                     <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                       <Landmark className="w-4 h-4 text-primary" />
                       {county} ({countyLocalities.length})
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                       {countyLocalities.map((loc) => (
                         <CityCard
                           key={loc.id}
                           name={loc.name}
                           county={loc.county}
                           population={loc.population || 0}
                           cityType={loc.locality_type}
                           onClick={() => navigate(`/localitati/${loc.id}`)}
                         />
                       ))}
                     </div>
                  </div>
                 ))}
                 
                 {/* Load More Button */}
                 {hasMore && (
                   <div className="flex justify-center mt-8">
                     <Button
                       variant="outline"
                       size="lg"
                       onClick={loadMore}
                       disabled={loadingMore}
                       className="min-w-[200px]"
                     >
                       {loadingMore ? (
                         <>
                           <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                           Se încarcă...
                         </>
                       ) : (
                         <>
                           <ChevronDown className="w-4 h-4 mr-2" />
                           Încarcă mai multe
                         </>
                       )}
                     </Button>
                   </div>
                 )}
               </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LocalitatiPage;
