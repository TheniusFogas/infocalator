import { Building2, Users, ArrowRight, MapPin, Landmark, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CityCardProps {
  name: string;
  county: string;
  population: number;
  type?: "major" | "regular";
  cityType?: string;
  onClick?: () => void;
}

const cityTypeIcons: Record<string, typeof Building2> = {
  'Municipiu': Landmark,
  'Oraș': Building2,
  'Comună': Home,
  'Sat': MapPin,
};

export const CityCard = ({ name, county, population, type = "regular", cityType = "Oraș", onClick }: CityCardProps) => {
  const formatPopulation = (pop: number) => {
    if (pop >= 1000000) {
      return `${(pop / 1000000).toFixed(1)}M`;
    } else if (pop >= 1000) {
      return `${Math.round(pop / 1000)}k`;
    }
    return pop.toString();
  };

  const CityTypeIcon = cityTypeIcons[cityType] || Building2;

  if (type === "major") {
    return (
      <div onClick={onClick} className="city-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
            <CityTypeIcon className="w-5 h-5 text-secondary-foreground" />
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
          <CityTypeIcon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{name}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex items-center justify-between mt-2">
        <Badge variant="secondary" className="text-xs flex items-center gap-1">
          <CityTypeIcon className="w-3 h-3" />
          {cityType}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          <span>{formatPopulation(population)}</span>
        </div>
      </div>
    </div>
  );
};
