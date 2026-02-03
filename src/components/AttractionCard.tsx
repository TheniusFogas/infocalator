import { MapPin, Calendar, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AttractionCardProps {
  title: string;
  description: string;
  image: string;
  category: string;
  location: string;
  views: number;
  date: string;
  onClick?: () => void;
}

export const AttractionCard = ({
  title,
  description,
  image,
  category,
  location,
  views,
  date,
  onClick
}: AttractionCardProps) => {
  return (
    <div onClick={onClick} className="attraction-card cursor-pointer">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground uppercase text-xs font-semibold">
          {category}
        </Badge>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {description}
        </p>
        
        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{views}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{date}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
