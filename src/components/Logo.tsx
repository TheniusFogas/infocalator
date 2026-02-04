import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo = ({ className = '', showText = true }: LogoProps) => {
  return (
    <Link to="/" className={`flex items-center gap-3 hover:opacity-90 transition-opacity ${className}`}>
      {/* Material Design 3 Pin Logo */}
      <div className="relative w-10 h-10">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Pin shadow */}
          <ellipse cx="24" cy="44" rx="8" ry="3" fill="currentColor" fillOpacity="0.2" />
          
          {/* Pin body - gradient background */}
          <path 
            d="M24 2C15.163 2 8 9.163 8 18c0 11.25 16 26 16 26s16-14.75 16-26c0-8.837-7.163-16-16-16z" 
            fill="url(#pinGradient)"
          />
          
          {/* Pin inner circle - white */}
          <circle cx="24" cy="18" r="8" fill="white" />
          
          {/* Road symbol inside */}
          <path 
            d="M20 14v8l2-1v-6l-2-1zm6 0l-2 1v6l2 1v-8z" 
            fill="url(#pinGradient)"
          />
          <rect x="23" y="15" width="2" height="2" rx="0.5" fill="url(#pinGradient)" />
          <rect x="23" y="19" width="2" height="2" rx="0.5" fill="url(#pinGradient)" />
          
          <defs>
            <linearGradient id="pinGradient" x1="8" y1="2" x2="40" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="hsl(217, 91%, 60%)" />
              <stop offset="1" stopColor="hsl(217, 91%, 45%)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {showText && (
        <div>
          <h1 className="font-bold text-lg leading-tight text-primary-foreground">DrumBun România</h1>
          <p className="text-xs opacity-80 text-primary-foreground">Ghid Călătorii & Turism</p>
        </div>
      )}
    </Link>
  );
};
