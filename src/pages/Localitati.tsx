import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CityCard } from "@/components/CityCard";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Building2, Landmark, TrendingUp, Users } from "lucide-react";
import { fetchCities, fetchMajorCities, City } from "@/services/routeService";

const counties = [
  "Toate", "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani", "Brașov", "Brăila",
  "București", "Buzău", "Caraș-Severin", "Cluj", "Constanța", "Covasna", "Călărași", "Dolj", "Dâmbovița",
  "Galați", "Giurgiu", "Gorj", "Harghita", "Hunedoara", "Ialomița", "Iași", "Maramureș", "Mehedinți",
  "Mureș", "Neamț", "Olt", "Prahova", "Satu Mare", "Sibiu", "Suceava", "Sălaj", "Teleorman", "Timiș",
  "Tulcea", "Vaslui", "Vrancea", "Vâlcea"
];

const cityTypes = ["Toate", "Oraș", "Oraș mic", "Sat", "Comună"];

const LocalitatiPage = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [majorCities, setMajorCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("Toate");
  const [selectedType, setSelectedType] = useState("Toate");

  useEffect(() => {
    const loadData = async () => {
      const [allCities, majors] = await Promise.all([
        fetchCities(),
        fetchMajorCities()
      ]);
      setCities(allCities);
      setMajorCities(majors);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredCities = useMemo(() => {
    return cities.filter((city) => {
      const matchesSearch = city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           city.county.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCounty = selectedCounty === "Toate" || city.county === selectedCounty;
      const matchesType = selectedType === "Toate" || city.city_type === selectedType;
      return matchesSearch && matchesCounty && matchesType;
    });
  }, [cities, searchQuery, selectedCounty, selectedType]);

  // Group cities by county
  const citiesByCounty = useMemo(() => {
    const grouped: Record<string, City[]> = {};
    filteredCities.forEach((city) => {
      if (!grouped[city.county]) {
        grouped[city.county] = [];
      }
      grouped[city.county].push(city);
    });
    return grouped;
  }, [filteredCities]);

  // Calculate total population
  const totalPopulation = useMemo(() => {
    return cities.reduce((sum, city) => sum + city.population, 0);
  }, [cities]);

  const formatPopulation = (pop: number) => {
    if (pop >= 1000000) {
      return `${(pop / 1000000).toFixed(0)}M+`;
    }
    return pop.toLocaleString();
  };

  // Get unique counties count
  const uniqueCounties = useMemo(() => {
    return new Set(cities.map(c => c.county)).size;
  }, [cities]);

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
              <StatCard icon={Building2} value={loading ? "..." : cities.length.toString()} label="Toate Orașele" />
              <StatCard icon={Landmark} value={loading ? "..." : uniqueCounties.toString()} label="Județe" iconColor="text-warning" />
              <StatCard icon={TrendingUp} value={loading ? "..." : majorCities.length.toString()} label="Orașe Majore" iconColor="text-success" />
              <StatCard icon={Users} value={loading ? "..." : formatPopulation(totalPopulation)} label="Populație" iconColor="text-info" />
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
                      {cityTypes.map((type) => (
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
                  {loading ? "Se încarcă..." : `${filteredCities.length} rezultate`}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Major Cities Section */}
        {!loading && majorCities.length > 0 && (
          <section className="px-4 pb-8">
            <div className="container mx-auto">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Orașe Majore
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {majorCities.map((city) => (
                  <CityCard
                    key={city.id}
                    name={city.name}
                    county={city.county}
                    population={city.population}
                    type="major"
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Cities by County */}
        <section className="px-4 pb-12">
          <div className="container mx-auto">
            <h2 className="text-xl font-bold text-foreground mb-6">Toate Orașele</h2>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="city-card animate-pulse">
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              Object.entries(citiesByCounty).map(([county, countyCities]) => (
                <div key={county} className="mb-8">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-primary" />
                    {county} ({countyCities.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {countyCities.map((city) => (
                      <CityCard
                        key={city.id}
                        name={city.name}
                        county={city.county}
                        population={city.population}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LocalitatiPage;
