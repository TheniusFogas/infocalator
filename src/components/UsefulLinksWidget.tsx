import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Car, 
  Fuel, 
  Shield, 
  Phone, 
  ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UsefulLink {
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  category: string;
}

const usefulLinks: UsefulLink[] = [
  {
    title: "Verificare RCA",
    description: "Verifică valabilitatea asigurării RCA",
    url: "https://asfromania.ro/verificare-rca",
    icon: <Shield className="w-5 h-5" />,
    category: "Documente"
  },
  {
    title: "Plată Rovinieta",
    description: "Plătește și verifică rovinieta online",
    url: "https://roviniete.ro",
    icon: <FileText className="w-5 h-5" />,
    category: "Taxe"
  },
  {
    title: "Prețuri Carburanți",
    description: "Prețuri actualizate benzină și motorină",
     url: "/preturi-carburanti",
    icon: <Fuel className="w-5 h-5" />,
    category: "Util"
  },
  {
    title: "RAR - Verificare ITP",
    description: "Verifică istoricul ITP al vehiculului",
    url: "https://www.rarom.ro",
    icon: <Car className="w-5 h-5" />,
    category: "Documente"
  },
  {
    title: "CNAIR - Stare Trafic",
    description: "Informații oficiale despre trafic",
     url: "https://www.cnair.ro",
    icon: <Car className="w-5 h-5" />,
    category: "Trafic"
  },
  {
    title: "Urgențe - 112",
    description: "Număr unic de urgență în România",
    url: "tel:112",
    icon: <Phone className="w-5 h-5" />,
    category: "Urgențe"
  }
];

export const UsefulLinksWidget = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Resurse Utile pentru Șoferi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {usefulLinks.map((link, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2 text-left hover:bg-muted"
              asChild
            >
               <a 
                 href={link.url} 
                 target={link.url.startsWith('/') || link.url.startsWith('tel:') ? undefined : "_blank"} 
                 rel={link.url.startsWith('/') || link.url.startsWith('tel:') ? undefined : "noopener noreferrer"}
               >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-primary">
                    {link.icon}
                    <span className="font-medium text-foreground">{link.title}</span>
                  </div>
                   {!link.url.startsWith('/') && !link.url.startsWith('tel:') && (
                     <ExternalLink className="w-3 h-3 text-muted-foreground" />
                   )}
                </div>
                <p className="text-sm text-muted-foreground">{link.description}</p>
                <Badge variant="secondary" className="mt-1">{link.category}</Badge>
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
