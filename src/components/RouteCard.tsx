import { MapPin } from "lucide-react";
 import { useNavigate } from "react-router-dom";

interface RouteCardProps {
  from: string;
  to: string;
  distance: number;
  onClick?: () => void;
}

export const RouteCard = ({ from, to, distance, onClick }: RouteCardProps) => {
  return (
    <div 
      onClick={onClick}
       className="route-card flex items-center justify-between group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center text-primary">
          <MapPin className="w-4 h-4" />
        </div>
        <span className="font-medium text-foreground">
          {from} → {to}
        </span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
        <span className="text-sm font-semibold">{distance} km</span>
      </div>
    </div>
  );
};
