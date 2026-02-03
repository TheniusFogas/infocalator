import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AttractionCard } from "@/components/AttractionCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { fetchAttractions, Attraction } from "@/services/routeService";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const categories = ["Toate Categoriile", "Castel", "Cascadă", "Peșteră", "Natură", "Drum", "Alt"];

const AtractiiPage = () => {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toate Categoriile");

  useEffect(() => {
    const loadAttractions = async () => {
      const data = await fetchAttractions();
      setAttractions(data);
      setLoading(false);
    };
    loadAttractions();
  }, []);

  const filteredAttractions = attractions.filter((attraction) => {
    const matchesSearch = attraction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (attraction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === "Toate Categoriile" || 
                           attraction.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: ro });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 px-4 text-center">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Atracții Turistice România
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explorează cele mai frumoase destinații din România. De la castele medievale la peisaje naturale uimitoare.
            </p>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="px-4 pb-8">
          <div className="container mx-auto">
            <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Caută atracții..."
                    className="pl-11 h-12 bg-background"
                  />
                </div>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-12 bg-background">
                    <SelectValue placeholder="Selectează categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Results Count */}
        <section className="px-4 pb-4">
          <div className="container mx-auto">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">
              {loading ? "Se încarcă..." : `${filteredAttractions.length} destinații găsite`}
            </p>
          </div>
        </section>

        {/* Attractions Grid */}
        <section className="px-4 pb-12">
          <div className="container mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="attraction-card animate-pulse">
                    <div className="h-48 bg-muted" />
                    <div className="p-5 space-y-3">
                      <div className="h-6 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAttractions.map((attraction) => (
                  <AttractionCard
                    key={attraction.id}
                    title={attraction.title}
                    description={attraction.description || ""}
                    image={attraction.image_url || "https://via.placeholder.com/400x300"}
                    category={attraction.category}
                    location={attraction.location}
                    views={attraction.views}
                    date={formatDate(attraction.created_at)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AtractiiPage;
