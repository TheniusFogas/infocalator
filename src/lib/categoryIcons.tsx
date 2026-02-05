import {
  Castle,
  Church,
  Mountain,
  Waves,
  Trees,
  Landmark,
  Building2,
  Tent,
  Home,
  Hotel,
  UtensilsCrossed,
  Car,
  Wifi,
  Dumbbell,
  Bath,
  Bike,
  Coffee,
  Wine,
  Music,
  Camera,
  Map,
  Footprints,
  Compass,
  Sun,
  Snowflake,
  Fish,
  Bird,
  Palette,
  Theater,
  GraduationCap,
  Trophy,
  Users,
  PartyPopper,
  Calendar,
  Ticket,
  ShoppingBag,
  Utensils,
  MapPin,
  Navigation,
  Eye,
  Star,
  Heart,
  Clock,
  AlertTriangle,
  Construction,
  Ban,
  type LucideIcon,
} from "lucide-react";

// Category icons for attractions
export const attractionCategoryIcons: Record<string, LucideIcon> = {
  // Nature
  "Natură": Trees,
  "Munte": Mountain,
  "Traseu": Footprints,
  "Cascadă": Waves,
  "Lac": Waves,
  "Peșteră": Mountain,
  "Parc": Trees,
  "Rezervație": Bird,
  
  // Historic & Cultural
  "Castel": Castle,
  "Cetate": Castle,
  "Muzeu": Landmark,
  "Istoric": Landmark,
  "Monument": Landmark,
  "Galerie": Palette,
  
  // Religious
  "Religios": Church,
  "Biserică": Church,
  "Mănăstire": Church,
  "Catedrală": Church,
  
  // Recreation
  "Recreere": Sun,
  "Agrement": Sun,
  "Plajă": Sun,
  "Stațiune": Snowflake,
  "Drumeție": Compass,
  
  // Default
  "Alt": MapPin,
};

// Category icons for accommodations
export const accommodationTypeIcons: Record<string, LucideIcon> = {
  "Hotel": Hotel,
  "Pensiune": Home,
  "Cabană": Tent,
  "Apartament": Building2,
  "Camping": Tent,
  "Vila": Home,
  "Hostel": Building2,
  "Resort": Hotel,
};

// Amenity icons for accommodations
export const amenityIcons: Record<string, LucideIcon> = {
  "WiFi": Wifi,
  "WiFi gratuit": Wifi,
  "Parcare": Car,
  "Parcare gratuită": Car,
  "Restaurant": UtensilsCrossed,
  "Piscină": Waves,
  "Piscină interioară": Waves,
  "Spa": Bath,
  "Saună": Bath,
  "Fitness": Dumbbell,
  "Sală fitness": Dumbbell,
  "Biciclete": Bike,
  "Biciclete gratuite": Bike,
  "Mic dejun": Coffee,
  "Bar": Wine,
  "Room service": UtensilsCrossed,
  "AC": Sun,
  "TV": Eye,
  "Minibar": Wine,
};

// Category icons for events
export const eventCategoryIcons: Record<string, LucideIcon> = {
  "Festival": Music,
  "Concert": Music,
  "Târg": ShoppingBag,
  "Cultural": Theater,
  "Sport": Trophy,
  "Comunitar": Users,
  "Expoziție": Palette,
  "Gastro": Utensils,
  "Educație": GraduationCap,
  "Workshop": GraduationCap,
  "Petrecere": PartyPopper,
};

// Traffic status icons
export const trafficStatusIcons: Record<string, LucideIcon> = {
  "Închis": Ban,
  "Restricționat": AlertTriangle,
  "Lucrări": Construction,
  "construction": Construction,
  "warning": AlertTriangle,
  "closed": Ban,
};

// Price range colors
export const priceRangeColors: Record<string, string> = {
  "Buget": "bg-green-500/10 text-green-600 dark:text-green-400",
  "Mediu": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  "Premium": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

// Helper function to get icon with fallback
export const getCategoryIcon = (category: string, iconMap: Record<string, LucideIcon>): LucideIcon => {
  return iconMap[category] || MapPin;
};

// Generate Unsplash image URL from keywords
export const getUnsplashImage = (keywords: string, width = 800, height = 600): string => {
  const query = encodeURIComponent(keywords || 'romania travel');
  return `https://source.unsplash.com/${width}x${height}/?${query}`;
};

// Alternative image sources (more reliable)
export const getPlaceholderImage = (keywords: string, width = 800, height = 600): string => {
  // If keywords looks like a URL, return it directly
  if (keywords && keywords.startsWith('http')) {
    return keywords;
  }
  
  // Generate abstract gradient as fallback instead of random photos
  const seed = keywords
    .replace(/\s+/g, '-')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  // First try to find a real image via Wikimedia URL pattern
  // Otherwise use a colorful abstract gradient
  const hue = Math.abs(hashCodeForColor(seed)) % 360;
  const bgColor = hslToHexColor(hue, 60, 35);
  const fgColor = hslToHexColor((hue + 30) % 360, 70, 65);
  
  // Use dummyimage with abstract pattern
  return `https://dummyimage.com/${width}x${height}/${bgColor}/${fgColor}.png&text=`;
};

function hashCodeForColor(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

function hslToHexColor(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `${f(0)}${f(8)}${f(4)}`;
}
 
 // Get Wikimedia Commons thumbnail URL
 export const getWikimediaThumb = (imageName: string, width: number = 640): string => {
   if (!imageName) return '';
   if (imageName.startsWith('http')) return imageName;
   
   const cleanName = encodeURIComponent(imageName.replace(/ /g, '_'));
   return `https://commons.wikimedia.org/wiki/Special:FilePath/${cleanName}?width=${width}`;
 };
