import { useState } from "react";
import { MapPin, ArrowRightLeft, Navigation, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const RouteCalculator = () => {
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");

  const swapLocations = () => {
    const temp = departure;
    setDeparture(destination);
    setDestination(temp);
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
      <div className="flex flex-col lg:flex-row gap-4 items-end">
        {/* Departure Input */}
        <div className="flex-1 w-full">
          <label className="text-sm font-medium text-foreground mb-2 block">Plecare</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              placeholder="ex. București, România"
              className="pl-11 h-12 bg-background"
            />
          </div>
        </div>

        {/* Swap Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={swapLocations}
          className="h-12 w-12 shrink-0 hidden lg:flex"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </Button>

        {/* Destination Input */}
        <div className="flex-1 w-full">
          <label className="text-sm font-medium text-foreground mb-2 block">Destinație</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="ex. Brașov, România"
              className="pl-11 h-12 bg-background"
            />
          </div>
        </div>

        {/* Calculate Button */}
        <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0">
          <Navigation className="w-4 h-4 mr-2" />
          Calculează Ruta
        </Button>
      </div>
    </div>
  );
};

export const MapPlaceholder = () => {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="aspect-[16/9] lg:aspect-[21/9] bg-gradient-to-br from-secondary to-accent flex flex-col items-center justify-center p-8 text-center">
        {/* Animated target icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Target className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-primary/30 animate-pulse-ring" />
        </div>
        
        <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
          🗺️ Hartă Interactivă
        </h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Selectează punctul de plecare și destinația pentru a vedea ruta detaliată pe hartă
        </p>
        <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          Începe să planifici
          <Navigation className="w-4 h-4 ml-2" />
        </Button>
      </div>
      
      {/* Directions Panel Placeholder */}
      <div className="lg:hidden p-4 border-t border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Navigation className="w-4 h-4" />
          <span className="text-sm">Indicații de Orientare</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Selectează plecarea și destinația pentru a vedea indicațiile.
        </p>
      </div>
    </div>
  );
};
