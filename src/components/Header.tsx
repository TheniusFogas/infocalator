import { MapPin, Building2, CloudSun, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { LanguageSelector } from "./LanguageSelector";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export const Header = () => {
  const location = useLocation();
  const { t } = useLanguage();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="header-gradient text-primary-foreground sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo />
          
          {/* Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link 
              to="/atractii" 
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium",
                isActive("/atractii") 
                  ? "bg-white/20" 
                  : "hover:bg-white/10"
              )}
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.attractions')}</span>
            </Link>
            
            <Link 
              to="/localitati" 
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium",
                isActive("/localitati") 
                  ? "bg-white/20" 
                  : "hover:bg-white/10"
              )}
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.localities')}</span>
            </Link>
            
            <Link 
              to="/cazari" 
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium",
                isActive("/cazari") 
                  ? "bg-white/20" 
                  : "hover:bg-white/10"
              )}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.accommodations')}</span>
            </Link>
            
            <Link 
              to="/vremea" 
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium",
                isActive("/vremea") 
                  ? "bg-white/20" 
                  : "hover:bg-white/10"
              )}
            >
              <CloudSun className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.weather')}</span>
            </Link>
            
            <LanguageSelector />
          </nav>
        </div>
      </div>
    </header>
  );
};
