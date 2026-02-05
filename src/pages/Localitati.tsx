 import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CityCard } from "@/components/CityCard";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Button } from "@/components/ui/button";
 import { Search, Building2, Landmark, TrendingUp, Users, Loader2, ChevronDown, Navigation } from "lucide-react";
 import { MapPin } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { useDebounce } from "@/hooks/useDebounce";
 import { useGlobalGeocode, GeoLocation } from "@/hooks/useGlobalGeocode";
 import { Slider } from "@/components/ui/slider";
 
 interface Locality {
   id: string;
   name: string;
   county: string;
   population: number | null;
   locality_type: string;
   latitude: number;
   longitude: number;
   is_county_seat: boolean | null;
   distance?: number; // km from selected locality
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
 const DEFAULT_RADIUS_KM = 30;
 
 // Haversine formula for distance between two coordinates
 function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
   const R = 6371; // Earth radius in km
   const dLat = (lat2 - lat1) * Math.PI / 180;
   const dLon = (lon2 - lon1) * Math.PI / 180;
   const a = 
     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
     Math.sin(dLon / 2) * Math.sin(dLon / 2);
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
   return R * c;
 }

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
   
   // Autocomplete state
   const { searchLocations, isSearching: isSearchingGlobal } = useGlobalGeocode();
   const [suggestions, setSuggestions] = useState<GeoLocation[]>([]);
   const [showSuggestions, setShowSuggestions] = useState(false);
   const searchRef = useRef<HTMLDivElement>(null);
   
   // Nearby localities state
   const [selectedLocality, setSelectedLocality] = useState<GeoLocation | null>(null);
   const [nearbyLocalities, setNearbyLocalities] = useState<Locality[]>([]);
   const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
   const [loadingNearby, setLoadingNearby] = useState(false);
 
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
 
   // Autocomplete search
   useEffect(() => {
     if (debouncedSearch.length >= 2) {
       searchLocations(debouncedSearch).then(results => {
         setSuggestions(results.filter(r => r.isLocal)); // Only local results
         setShowSuggestions(true);
       });
     } else {
       setSuggestions([]);
       setShowSuggestions(false);
     }
   }, [debouncedSearch, searchLocations]);
 
   // Close suggestions on click outside
   useEffect(() => {
     const handleClickOutside = (e: MouseEvent) => {
       if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
         setShowSuggestions(false);
       }
     };
     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);
 
   // Fetch nearby localities when a locality is selected
   const fetchNearbyLocalities = useCallback(async (lat: number, lng: number, radius: number) => {
     setLoadingNearby(true);
     try {
       // Get all localities and filter by distance (Supabase doesn't have native geo queries)
       const { data } = await supabase
         .from('localities')
         .select('*')
         .gte('latitude', lat - (radius / 111)) // rough bounding box
         .lte('latitude', lat + (radius / 111))
         .gte('longitude', lng - (radius / (111 * Math.cos(lat * Math.PI / 180))))
         .lte('longitude', lng + (radius / (111 * Math.cos(lat * Math.PI / 180))));
       
       if (data) {
         // Calculate exact distance and filter
         const nearby = data
           .map(loc => ({
             ...loc,
             distance: calculateDistance(lat, lng, loc.latitude, loc.longitude)
           }))
           .filter(loc => loc.distance <= radius && loc.distance > 0.5) // Exclude the selected one
           .sort((a, b) => a.distance - b.distance);
         
         setNearbyLocalities(nearby);
       }
     } catch (error) {
       console.error('Error fetching nearby:', error);
     } finally {
       setLoadingNearby(false);
     }
   }, []);
 
   const handleSuggestionClick = (suggestion: GeoLocation) => {
     setShowSuggestions(false);
     setSearchQuery(suggestion.name);
     setSelectedLocality(suggestion);
     
     // Fetch nearby localities
     if (suggestion.latitude && suggestion.longitude) {
       fetchNearbyLocalities(suggestion.latitude, suggestion.longitude, radiusKm);
     }
   };
   
   const handleViewDetail = (localityId: string) => {
     navigate(`/localitati/${localityId}`);
   };
   
   // Update nearby when radius changes
   useEffect(() => {
     if (selectedLocality?.latitude && selectedLocality?.longitude) {
       fetchNearbyLocalities(selectedLocality.latitude, selectedLocality.longitude, radiusKm);
     }
   }, [radiusKm, selectedLocality, fetchNearbyLocalities]);
   
   // Clear selection when search is cleared
   useEffect(() => {
     if (!searchQuery) {
       setSelectedLocality(null);
       setNearbyLocalities([]);
     }
   }, [searchQuery]);
 
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
                <div ref={searchRef} className="relative">
                  <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1">
                    <Search className="w-4 h-4" />
                    Caută localitate...
                  </label>
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.length >= 2) {
                        setShowSuggestions(true);
                      }
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    placeholder="Caută localitate (ex: Craiova, Târgu Jiu)..."
                    className="h-11 bg-background"
                  />
                  
                  {/* Autocomplete Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.id || index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 border-b border-border last:border-0"
                        >
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{suggestion.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {suggestion.county && `${suggestion.county}, `}{suggestion.type}
                              {suggestion.population && suggestion.population > 0 && ` • ${suggestion.population.toLocaleString()} loc.`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Loading indicator */}
                  {isSearchingGlobal && searchQuery.length >= 2 && (
                    <div className="absolute right-3 top-[38px]">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                {/* Radius Slider - shown when locality is selected */}
                {selectedLocality && (
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1">
                      <Navigation className="w-4 h-4" />
                      Rază căutare: {radiusKm} km
                    </label>
                    <Slider
                      value={[radiusKm]}
                      onValueChange={(v) => setRadiusKm(v[0])}
                      min={5}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                )}

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
                {selectedLocality ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {loadingNearby ? "Se caută..." : `${nearbyLocalities.length} localități în raza de ${radiusKm} km de ${selectedLocality.name}`}
                    </span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => handleViewDetail(selectedLocality.id!)}
                      className="text-primary"
                    >
                      Vezi detalii {selectedLocality.name} →
                    </Button>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {loading ? "Se încarcă..." : `${localities.length} din ${totalCount.toLocaleString()} localități`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
 
        {/* Nearby Localities Section - shown when a locality is selected */}
        {selectedLocality && nearbyLocalities.length > 0 && (
          <section className="px-4 pb-8">
            <div className="container mx-auto">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary" />
                Localități în apropiere de {selectedLocality.name}
                <span className="text-sm font-normal text-muted-foreground">({radiusKm} km)</span>
              </h2>
              {loadingNearby ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {nearbyLocalities.slice(0, 20).map((loc) => (
                    <CityCard
                      key={loc.id}
                      name={loc.name}
                      county={loc.county}
                      population={loc.population || 0}
                      cityType={loc.locality_type}
                      onClick={() => handleViewDetail(loc.id)}
                      extra={
                        <span className="text-xs text-primary font-medium">
                          {loc.distance?.toFixed(1)} km
                        </span>
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Major Localities Section - hide when searching nearby */}
        {!selectedLocality && !loading && majorLocalities.length > 0 && !debouncedSearch && selectedCounty === "Toate" && selectedType === "Toate" && (
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

        {/* All Localities by County - hide when searching nearby */}
        {!selectedLocality && (
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
        )}
      </main>

      <Footer />
    </div>
  );
};

export default LocalitatiPage;
