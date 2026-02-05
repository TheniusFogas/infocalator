 import { Link } from 'react-router-dom';
 import { MapPin, ChevronRight, ExternalLink } from 'lucide-react';
 import { Badge } from '@/components/ui/badge';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { attractionCategoryIcons, getCategoryIcon } from '@/lib/categoryIcons';
 
 interface NearbyAttraction {
   name: string;
   category?: string;
   distance?: string;
   slug?: string;
   description?: string;
 }
 
 interface NearbyAttractionsClickableProps {
   attractions: NearbyAttraction[];
   currentLocation: string;
   county?: string;
   title?: string;
 }
 
 // Generate a URL-safe slug from attraction name
 function generateSlug(name: string): string {
   return name
     .toLowerCase()
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
     .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
     .replace(/\s+/g, '-') // Replace spaces with hyphens
     .replace(/-+/g, '-') // Replace multiple hyphens with single
     .trim();
 }
 
 export const NearbyAttractionsClickable = ({
   attractions,
   currentLocation,
   county,
   title = "Atracții în apropiere"
 }: NearbyAttractionsClickableProps) => {
   if (!attractions || attractions.length === 0) return null;
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="text-lg flex items-center gap-2">
           <MapPin className="w-5 h-5 text-primary" />
           {title}
         </CardTitle>
       </CardHeader>
       <CardContent>
         <div className="space-y-2">
           {attractions.map((attraction, index) => {
             const slug = attraction.slug || generateSlug(attraction.name);
             const CategoryIcon = attraction.category 
               ? getCategoryIcon(attraction.category, attractionCategoryIcons)
               : MapPin;
             
             // Build the link - this will auto-create the page when visited
             const attractionUrl = `/atractii-ai/${slug}?location=${encodeURIComponent(currentLocation)}${county ? `&county=${encodeURIComponent(county)}` : ''}`;
 
             return (
               <Link
                 key={index}
                 to={attractionUrl}
                 className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
               >
                 <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                   <CategoryIcon className="w-4 h-4 text-primary" />
                 </div>
                 
                 <div className="flex-1 min-w-0">
                   <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                     {attraction.name}
                   </p>
                   {attraction.description && (
                     <p className="text-xs text-muted-foreground truncate">
                       {attraction.description}
                     </p>
                   )}
                 </div>
                 
                 <div className="flex items-center gap-2 shrink-0">
                   {attraction.distance && (
                     <Badge variant="outline" className="text-xs">
                       {attraction.distance}
                     </Badge>
                   )}
                   <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                 </div>
               </Link>
             );
           })}
         </div>
         
         <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border flex items-center gap-1">
           <ExternalLink className="w-3 h-3" />
           Click pe o atracție pentru a vedea detaliile complete
         </p>
       </CardContent>
     </Card>
   );
 };