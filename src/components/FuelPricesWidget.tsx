import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Fuel, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface FuelPrice {
  type: string;
  price: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

// Mock data - in production would fetch from API
const fuelPrices: FuelPrice[] = [
  { type: "Benzină Standard", price: 7.25, trend: 'down', change: -0.05 },
  { type: "Benzină Premium", price: 7.89, trend: 'stable', change: 0 },
  { type: "Motorină Standard", price: 7.45, trend: 'up', change: 0.03 },
  { type: "Motorină Premium", price: 7.99, trend: 'down', change: -0.02 },
  { type: "GPL", price: 3.25, trend: 'stable', change: 0 },
];

const trendConfig = {
  up: { icon: TrendingUp, color: 'text-red-500', label: 'Creștere' },
  down: { icon: TrendingDown, color: 'text-green-500', label: 'Scădere' },
  stable: { icon: Minus, color: 'text-muted-foreground', label: 'Stabil' },
};

export const FuelPricesWidget = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Fuel className="w-5 h-5 text-primary" />
          Prețuri Carburanți (medie națională)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {fuelPrices.map((fuel, index) => {
            const config = trendConfig[fuel.trend];
            const Icon = config.icon;
            
            return (
              <div 
                key={index}
                className="text-center p-4 rounded-lg bg-muted/50 border border-border"
              >
                <p className="text-sm text-muted-foreground mb-1">{fuel.type}</p>
                <p className="text-2xl font-bold text-foreground">{fuel.price.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mb-2">lei/litru</p>
                <Badge variant="outline" className={`${config.color} border-current text-xs`}>
                  <Icon className="w-3 h-3 mr-1" />
                  {fuel.change !== 0 ? `${fuel.change > 0 ? '+' : ''}${fuel.change.toFixed(2)}` : config.label}
                </Badge>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Prețuri orientative. Verificați la stația de alimentare.
        </p>
      </CardContent>
    </Card>
  );
};
