import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RouteCalculator, MapPlaceholder } from "@/components/RouteCalculator";
import { RouteCard } from "@/components/RouteCard";
import { TrafficStats } from "@/components/TrafficStats";
import { Navigation } from "lucide-react";

const popularRoutes = [
  { from: "București", to: "Constanța", distance: 225 },
  { from: "București", to: "Brașov", distance: 166 },
  { from: "București", to: "Cluj-Napoca", distance: 450 },
  { from: "Cluj-Napoca", to: "Timișoara", distance: 320 },
  { from: "București", to: "Sibiu", distance: 280 },
  { from: "București", to: "Iași", distance: 385 },
  { from: "Timișoara", to: "Arad", distance: 55 },
  { from: "Constanța", to: "Mangalia", distance: 43 },
  { from: "București", to: "Pitești", distance: 110 },
  { from: "Cluj-Napoca", to: "Oradea", distance: 155 },
  { from: "București", to: "Craiova", distance: 227 },
  { from: "Brașov", to: "Sibiu", distance: 143 },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Route Calculator Section */}
        <section className="py-6 px-4">
          <div className="container mx-auto">
            <RouteCalculator />
          </div>
        </section>

        {/* Map Section */}
        <section className="px-4 pb-8">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MapPlaceholder />
              </div>
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-2 text-foreground mb-4">
                  <Navigation className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Indicații de Orientare</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Selectează plecarea și destinația pentru a vedea indicațiile.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Routes Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8">Rute Populare în România</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {popularRoutes.map((route, index) => (
                <RouteCard
                  key={index}
                  from={route.from}
                  to={route.to}
                  distance={route.distance}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Traffic Stats Section */}
        <TrafficStats />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
