import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RouteCalculatorWithMap } from "@/components/RouteCalculatorWithMap";
import { RouteCard } from "@/components/RouteCard";
import { TrafficStats } from "@/components/TrafficStats";
import { RoadStatusWidget } from "@/components/RoadStatusWidget";
import { FuelPricesWidget } from "@/components/FuelPricesWidget";
import { UsefulLinksWidget } from "@/components/UsefulLinksWidget";
import { TourismCategoriesWidget } from "@/components/TourismCategoriesWidget";
import { fetchRoutes, Route } from "@/services/routeService";

const Index = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoutes = async () => {
      const data = await fetchRoutes();
      setRoutes(data);
      setLoading(false);
    };
    loadRoutes();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Route Calculator Section with Map */}
        <section className="py-6 px-4">
          <div className="container mx-auto">
            <RouteCalculatorWithMap />
          </div>
        </section>

        {/* Road Status Section */}
        <section className="py-6 px-4">
          <div className="container mx-auto">
            <RoadStatusWidget />
          </div>
        </section>

        {/* Tourism Categories */}
        <section className="py-6 px-4">
          <div className="container mx-auto">
            <TourismCategoriesWidget />
          </div>
        </section>

        {/* Popular Routes Section */}
        <section className="py-6 px-4">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">Rute Populare în România</h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="route-card animate-pulse">
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {routes.map((route) => (
                  <RouteCard
                    key={route.id}
                    from={route.from_city}
                    to={route.to_city}
                    distance={route.distance_km}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Fuel Prices */}
        <section className="py-6 px-4">
          <div className="container mx-auto">
            <FuelPricesWidget />
          </div>
        </section>

        {/* Traffic Stats Section */}
        <TrafficStats />

        {/* Useful Links */}
        <section className="py-6 px-4">
          <div className="container mx-auto">
            <UsefulLinksWidget />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
