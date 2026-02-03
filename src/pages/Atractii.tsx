import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AttractionCard } from "@/components/AttractionCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const attractions = [
  {
    title: "Drumul Peșterilor din Apuseni",
    description: "Drumul Peșterilor din Apuseni oferă o incursiune fascinantă în lumea subterană a Munților Apuseni, dezvăluind peisaje spectaculoase și formațiuni geologice unice.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Coiba_Mare_Portal.jpg/500px-Coiba_Mare_Portal.jpg",
    category: "Peșteră",
    location: "Bihor",
    views: 17,
    date: "10 Ianuarie 2026"
  },
  {
    title: "Craiova, Capitala Crăciunului din România",
    description: "Craiova se transformă într-o veritabilă capitală a Crăciunului în România, printr-un decor festiv de poveste și evenimente culturale captivante.",
    image: "https://image.stirileprotv.ro/media/images/1920x1080/Dec2025/62596676.jpg",
    category: "Alt",
    location: "Craiova",
    views: 42,
    date: "10 Ianuarie 2026"
  },
  {
    title: "Cascada Bigăr – Farmecul Natural al Munților Aninei",
    description: "Cascada Bigăr, situată în Munții Aninei din România, este renumită pentru frumusețea sa unică, apa căzând într-un mod spectaculos peste mușchiul verde.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Cascada_Big%C4%83r.JPG/800px-Cascada_Big%C4%83r.JPG",
    category: "Cascadă",
    location: "Caraș-Severin",
    views: 4,
    date: "10 Ianuarie 2026"
  },
  {
    title: "Castelul Bran – Legenda lui Dracula",
    description: "Castelul Bran, cunoscut popular ca și Castelul lui Dracula, este una dintre cele mai vizitate atracții turistice din România.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Castelul_Bran.jpg/800px-Castelul_Bran.jpg",
    category: "Castel",
    location: "Brașov",
    views: 156,
    date: "8 Ianuarie 2026"
  },
  {
    title: "Transfăgărășan – Cel mai frumos drum din lume",
    description: "Transfăgărășanul este considerat unul dintre cele mai spectaculoase drumuri din lume, oferind priveliști uimitoare ale Munților Făgăraș.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Transfagarasan_serpentine.jpg/800px-Transfagarasan_serpentine.jpg",
    category: "Drum",
    location: "Argeș",
    views: 89,
    date: "5 Ianuarie 2026"
  },
  {
    title: "Delta Dunării – Paradisul biodiversității",
    description: "Delta Dunării este a doua deltă ca mărime din Europa și găzduiește o biodiversitate extraordinară, fiind un paradis pentru iubitorii naturii.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Danube_Delta_2020.jpg/800px-Danube_Delta_2020.jpg",
    category: "Natură",
    location: "Tulcea",
    views: 67,
    date: "3 Ianuarie 2026"
  },
];

const categories = ["Toate Categoriile", "Castel", "Cascadă", "Peșteră", "Natură", "Drum", "Alt"];

const AtractiiPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toate Categoriile");

  const filteredAttractions = attractions.filter((attraction) => {
    const matchesSearch = attraction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         attraction.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Toate Categoriile" || 
                           attraction.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
              {filteredAttractions.length} destinații găsite
            </p>
          </div>
        </section>

        {/* Attractions Grid */}
        <section className="px-4 pb-12">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAttractions.map((attraction, index) => (
                <AttractionCard
                  key={index}
                  title={attraction.title}
                  description={attraction.description}
                  image={attraction.image}
                  category={attraction.category}
                  location={attraction.location}
                  views={attraction.views}
                  date={attraction.date}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AtractiiPage;
