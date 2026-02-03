import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CityCard, CityCard as CityCardMajor } from "@/components/CityCard";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Building2, Landmark, TrendingUp, Users } from "lucide-react";

const majorCities = [
  { name: "București", county: "București", population: 1883425 },
  { name: "Cluj-Napoca", county: "Cluj", population: 324576 },
  { name: "Timișoara", county: "Timiș", population: 319279 },
  { name: "Iași", county: "Iași", population: 290422 },
  { name: "Constanța", county: "Constanța", population: 283872 },
  { name: "Craiova", county: "Dolj", population: 269506 },
  { name: "Brașov", county: "Brașov", population: 253200 },
  { name: "Galați", county: "Galați", population: 249432 },
  { name: "Ploiești", county: "Prahova", population: 209945 },
  { name: "Oradea", county: "Bihor", population: 196367 },
];

const allCities = [
  { name: "București", county: "București", population: 1883425, type: "Oraș" },
  { name: "Cluj-Napoca", county: "Cluj", population: 324576, type: "Oraș" },
  { name: "Timișoara", county: "Timiș", population: 319279, type: "Oraș" },
  { name: "Iași", county: "Iași", population: 290422, type: "Oraș" },
  { name: "Constanța", county: "Constanța", population: 283872, type: "Oraș" },
  { name: "Craiova", county: "Dolj", population: 269506, type: "Oraș" },
  { name: "Brașov", county: "Brașov", population: 253200, type: "Oraș" },
  { name: "Galați", county: "Galați", population: 249432, type: "Oraș" },
  { name: "Ploiești", county: "Prahova", population: 209945, type: "Oraș" },
  { name: "Oradea", county: "Bihor", population: 196367, type: "Oraș" },
  { name: "Sibiu", county: "Sibiu", population: 169611, type: "Oraș" },
  { name: "Bacău", county: "Bacău", population: 144307, type: "Oraș" },
  { name: "Târgu Mureș", county: "Mureș", population: 134290, type: "Oraș" },
  { name: "Baia Mare", county: "Maramureș", population: 123738, type: "Oraș" },
  { name: "Buzău", county: "Buzău", population: 115494, type: "Oraș" },
  { name: "Botoșani", county: "Botoșani", population: 106847, type: "Oraș" },
  { name: "Satu Mare", county: "Satu Mare", population: 102441, type: "Oraș" },
  { name: "Râmnicu Vâlcea", county: "Vâlcea", population: 98776, type: "Oraș" },
  { name: "Suceava", county: "Suceava", population: 92121, type: "Oraș" },
  { name: "Piatra Neamț", county: "Neamț", population: 85055, type: "Oraș" },
  { name: "Drobeta-Turnu Severin", county: "Mehedinți", population: 92617, type: "Oraș" },
  { name: "Focșani", county: "Vrancea", population: 79315, type: "Oraș" },
  { name: "Târgoviște", county: "Dâmbovița", population: 79610, type: "Oraș" },
  { name: "Târgu Jiu", county: "Gorj", population: 82504, type: "Oraș" },
  { name: "Alba Iulia", county: "Alba", population: 63536, type: "Oraș" },
];

const counties = [
  "Toate", "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani", "Brașov", "Brăila",
  "București", "Buzău", "Caraș-Severin", "Cluj", "Constanța", "Covasna", "Călărași", "Dolj", "Dâmbovița",
  "Galați", "Giurgiu", "Gorj", "Harghita", "Hunedoara", "Ialomița", "Iași", "Maramureș", "Mehedinți",
  "Mureș", "Neamț", "Olt", "Prahova", "Satu Mare", "Sibiu", "Suceava", "Sălaj", "Teleorman", "Timiș",
  "Tulcea", "Vaslui", "Vrancea", "Vâlcea"
];

const cityTypes = ["Toate", "Oraș", "Oraș mic", "Sat", "Comună"];

const LocalitatiPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("Toate");
  const [selectedType, setSelectedType] = useState("Toate");

  const filteredCities = useMemo(() => {
    return allCities.filter((city) => {
      const matchesSearch = city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           city.county.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCounty = selectedCounty === "Toate" || city.county === selectedCounty;
      const matchesType = selectedType === "Toate" || city.type === selectedType;
      return matchesSearch && matchesCounty && matchesType;
    });
  }, [searchQuery, selectedCounty, selectedType]);

  // Group cities by county
  const citiesByCounty = useMemo(() => {
    const grouped: Record<string, typeof allCities> = {};
    filteredCities.forEach((city) => {
      if (!grouped[city.county]) {
        grouped[city.county] = [];
      }
      grouped[city.county].push(city);
    });
    return grouped;
  }, [filteredCities]);

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
              <StatCard icon={Building2} value="327" label="Toate Orașele" />
              <StatCard icon={Landmark} value="42" label="Județe" iconColor="text-warning" />
              <StatCard icon={TrendingUp} value="10" label="Orașe Majore" iconColor="text-success" />
              <StatCard icon={Users} value="19M+" label="Populație" iconColor="text-info" />
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
                <span className="text-sm text-muted-foreground">{filteredCities.length} rezultate</span>
              </div>
            </div>
          </div>
        </section>

        {/* Major Cities Section */}
        <section className="px-4 pb-8">
          <div className="container mx-auto">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Orașe Majore
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {majorCities.map((city, index) => (
                <CityCardMajor
                  key={index}
                  name={city.name}
                  county={city.county}
                  population={city.population}
                  type="major"
                />
              ))}
            </div>
          </div>
        </section>

        {/* All Cities by County */}
        <section className="px-4 pb-12">
          <div className="container mx-auto">
            <h2 className="text-xl font-bold text-foreground mb-6">Toate Orașele</h2>
            
            {Object.entries(citiesByCounty).map(([county, cities]) => (
              <div key={county} className="mb-8">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-primary" />
                  {county} ({cities.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {cities.map((city, index) => (
                    <CityCard
                      key={index}
                      name={city.name}
                      county={city.county}
                      population={city.population}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LocalitatiPage;
