import { Navigation, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Navigation className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Distanțe Rutiere România</h3>
                <p className="text-sm opacity-70">Calculator Trafic & Planificator Rute</p>
              </div>
            </div>
            <p className="text-sm opacity-70 max-w-md">
              Planifică-ți călătoriile în România cu cele mai precise distanțe rutiere, 
              informații despre trafic și atracții turistice de neratat.
            </p>
          </div>
          
          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Navigare</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li>
                <Link to="/" className="hover:opacity-100 transition-opacity">Acasă</Link>
              </li>
              <li>
                <Link to="/atractii" className="hover:opacity-100 transition-opacity">Atracții Turistice</Link>
              </li>
              <li>
                <Link to="/localitati" className="hover:opacity-100 transition-opacity">Localități</Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>contact@rotripplanner.ro</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+40 123 456 789</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>București, România</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm opacity-50">
          <p>© 2026 Distanțe Rutiere România. Toate drepturile rezervate.</p>
        </div>
      </div>
    </footer>
  );
};
