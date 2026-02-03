import { Navigation, MapPin, Building2, Globe } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const Header = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="header-gradient text-primary-foreground sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Distanțe Rutiere România</h1>
              <p className="text-xs opacity-80">Calculator Trafic & Planificator Rute</p>
            </div>
          </Link>
          
          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <Link 
              to="/atractii" 
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium",
                isActive("/atractii") 
                  ? "bg-white/20" 
                  : "hover:bg-white/10"
              )}
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Atracții</span>
            </Link>
            
            <Link 
              to="/localitati" 
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium",
                isActive("/localitati") 
                  ? "bg-white/20" 
                  : "hover:bg-white/10"
              )}
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Localități</span>
            </Link>
            
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm font-medium ml-2">
              <Globe className="w-4 h-4" />
              <span>RO</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
