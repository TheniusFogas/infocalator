import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mountain, 
  Castle, 
  Church, 
  Trees, 
  Waves, 
  Building2,
  MapPin,
  ArrowRight
} from "lucide-react";

interface TourismCategory {
  title: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  color: string;
  link: string;
}

const categories: TourismCategory[] = [
  {
    title: "Munți și Drumeții",
    description: "Trasee montane în Carpați",
    icon: <Mountain className="w-6 h-6" />,
    count: 150,
    color: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
    link: "/atractii?category=munte"
  },
  {
    title: "Castele și Cetăți",
    description: "Fortărețe medievale",
    icon: <Castle className="w-6 h-6" />,
    count: 75,
    color: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20",
    link: "/atractii?category=castel"
  },
  {
    title: "Mănăstiri și Biserici",
    description: "Patrimoniu religios UNESCO",
    icon: <Church className="w-6 h-6" />,
    count: 200,
    color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20",
    link: "/atractii?category=religios"
  },
  {
    title: "Parcuri Naturale",
    description: "Rezervații și arii protejate",
    icon: <Trees className="w-6 h-6" />,
    count: 45,
    color: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
    link: "/atractii?category=parc"
  },
  {
    title: "Litoral și Deltă",
    description: "Plaje și zone umede",
    icon: <Waves className="w-6 h-6" />,
    count: 30,
    color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
    link: "/atractii?category=apa"
  },
  {
    title: "Orașe și Cultură",
    description: "Centre istorice și muzee",
    icon: <Building2 className="w-6 h-6" />,
    count: 100,
    color: "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20",
    link: "/localitati"
  },
];

export const TourismCategoriesWidget = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Descoperă România
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={category.link}
              className={`p-4 rounded-xl text-center transition-all ${category.color} border border-transparent hover:border-current/20 group`}
            >
              <div className="flex justify-center mb-2">
                {category.icon}
              </div>
              <p className="font-medium text-foreground text-sm mb-1">{category.title}</p>
              <p className="text-xs text-muted-foreground mb-2">{category.description}</p>
              <Badge variant="secondary" className="text-xs">
                {category.count}+ locații
              </Badge>
              <div className="flex items-center justify-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
