 import { useState, useEffect } from "react";
 import { Link } from "react-router-dom";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { UtensilsCrossed, MapPin, Loader2, Star, Clock, ChevronRight, Crown } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { RealImage } from "./RealImage";
 
 interface Restaurant {
   name: string;
   slug: string;
   type: string;
   description: string;
   priceRange: string;
  rating?: number | null;
   cuisine: string[];
   location: string;
   openingHours?: string;
   isFeatured?: boolean;
   featuredUntil?: string;
   imageKeywords?: string;
 }
 
 interface RestaurantsListProps {
   location: string;
   county?: string;
 }
 
 export const RestaurantsList = ({ location, county }: RestaurantsListProps) => {
   const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     const fetchRestaurants = async () => {
       setLoading(true);
       setError(null);
       
       try {
        // Fetch from edge function (OSM data)
        const { data, error: fetchError } = await supabase.functions.invoke('search-local-info', {
          body: { query: location, type: 'restaurants', location, county }
        });
        
        if (fetchError) {
          console.error('Error fetching restaurants:', fetchError);
          setRestaurants([]);
        } else if (data?.success && data.data?.restaurants) {
          setRestaurants(data.data.restaurants);
        } else {
          setRestaurants([]);
        }
       } catch (err) {
         setError("Nu s-au putut încărca restaurantele");
       }
       
       setLoading(false);
     };
 
     fetchRestaurants();
   }, [location, county]);
 
   if (loading) {
     return (
       <Card>
         <CardHeader>
           <CardTitle className="text-lg flex items-center gap-2">
             <UtensilsCrossed className="w-5 h-5 text-primary" />
             Restaurante în {location}
           </CardTitle>
         </CardHeader>
         <CardContent className="flex items-center justify-center py-8">
           <Loader2 className="w-6 h-6 animate-spin text-primary" />
           <span className="ml-2 text-muted-foreground">Se caută restaurante...</span>
         </CardContent>
       </Card>
     );
   }
 
   if (error || restaurants.length === 0) {
     return null;
   }
 
   // Sort: featured first, then by rating
   const sortedRestaurants = [...restaurants].sort((a, b) => {
     if (a.isFeatured && !b.isFeatured) return -1;
     if (!a.isFeatured && b.isFeatured) return 1;
     return b.rating - a.rating;
   });
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="text-lg flex items-center gap-2">
           <UtensilsCrossed className="w-5 h-5 text-primary" />
           Restaurante în {location}
         </CardTitle>
       </CardHeader>
       <CardContent>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {sortedRestaurants.map((restaurant, index) => (
             <Link
               key={index}
               to={`/restaurante/${restaurant.slug}?location=${encodeURIComponent(location)}${county ? `&county=${encodeURIComponent(county)}` : ''}`}
               className="group block"
             >
               <div className={`flex gap-4 p-4 rounded-xl border transition-all ${
                 restaurant.isFeatured 
                   ? 'border-primary/50 bg-primary/5 hover:border-primary' 
                   : 'border-border hover:border-primary/50 hover:bg-muted/50'
               }`}>
                 {/* Image */}
                 <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 relative">
                   <RealImage
                     name={restaurant.name}
                     location={location}
                     type="accommodation"
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                     width={200}
                     height={200}
                   />
                   {restaurant.isFeatured && (
                     <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded p-1">
                       <Crown className="w-3 h-3" />
                     </div>
                   )}
                 </div>
                 
                 {/* Content */}
                 <div className="flex-1 min-w-0">
                   <div className="flex items-start justify-between gap-2 mb-1">
                     <Badge variant="secondary" className="text-xs">
                       {restaurant.type}
                     </Badge>
                     <div className="flex items-center gap-1 text-amber-500">
                      {restaurant.rating && (
                        <>
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-xs font-medium">{restaurant.rating}</span>
                        </>
                      )}
                     </div>
                   </div>
                   
                   <h4 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                     {restaurant.name}
                   </h4>
                   
                   <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{restaurant.description}</p>
                   
                   <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                     <span className="flex items-center gap-1">
                       <MapPin className="w-3 h-3" />
                       {restaurant.location}
                     </span>
                     <Badge variant="outline" className="text-xs">
                       {restaurant.priceRange}
                     </Badge>
                   </div>
                   
                   <div className="flex flex-wrap gap-1 mt-2">
                     {restaurant.cuisine.slice(0, 2).map((c, i) => (
                       <Badge key={i} variant="outline" className="text-xs bg-muted/50">
                         {c}
                       </Badge>
                     ))}
                   </div>
                 </div>
                 
                 <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 self-center" />
               </div>
             </Link>
           ))}
         </div>
       </CardContent>
     </Card>
   );
 };