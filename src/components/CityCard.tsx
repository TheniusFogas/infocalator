import { Building2, Users, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CityCardProps {
  name: string;
  county: string;
  population: number;
  type?: "major" | "regular";
  onClick?: () => void;
}

export const CityCard = ({ name, county, population, type = "regular", onClick }: CityCardProps) => {
  const formatPopulation = (pop: number) => {
    if (pop >= 1000000) {
      return `${(pop / 1000000).toFixed(1)}M`;
    } else if (pop >= 1000) {
      return `${Math.round(pop / 1000)}k`;
    }
    return pop.toString();
  };

  if (type === "major") {
    return (
      <div onClick={onClick} className="city-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{name}</h3>
            <p className="text-xs text-muted-foreground">{county}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{formatPopulation(population)} locuitori</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClick} className="city-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{name}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex items-center justify-between mt-2">
        <Badge variant="secondary" className="text-xs">Oraș</Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          <span>{formatPopulation(population)}</span>
        </div>
      </div>
    </div>
  );
};
