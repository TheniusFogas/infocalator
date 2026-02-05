 import { useState, useEffect } from "react";
 import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
 import { Header } from "@/components/Header";
 import { Footer } from "@/components/Footer";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { 
   ArrowLeft, 
   MapPin, 
   Clock, 
   ExternalLink,
   Star,
   Navigation,
   Share2,
   Loader2,
   Phone,
   Globe,
   UtensilsCrossed,
   DollarSign,
   Info
 } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { WeatherInline } from "@/components/WeatherInline";
 import { RealImage } from "@/components/RealImage";
 import { RecommendedAttractions } from "@/components/RecommendedAttractions";
 import { SidebarEventsList } from "@/components/SidebarEventsList";
 
 interface RestaurantDetail {
   name: string;
   slug: string;
   type: string;
   description: string;
   priceRange: string;
   rating: number | null;
   cuisine: string[];
   location: string;
   openingHours: string | null;
   phone?: string;
   website?: string;
   coordinates?: { lat: number; lng: number };
   imageKeywords?: string;
 }
 
 const RestaurantDetailPage = () => {
   const { oras, slug } = useParams<{ oras?: string; slug: string }>();
   const [searchParams] = useSearchParams();
   const navigate = useNavigate();
   
   // Support both /oras/restaurante/:slug and /restaurante/:slug
   const location = oras || searchParams.get("location") || "România";
   const county = searchParams.get("county") || undefined;
   
   const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     const fetchRestaurant = async () => {
       if (!slug) return;
       
       setLoading(true);
       setError(null);
       
       const { data, error: fetchError } = await supabase.functions.invoke('search-local-info', {
         body: { query: location, type: 'restaurant-detail', location, county, slug }
       });
       
       if (fetchError) {
         console.error('Error fetching restaurant:', fetchError);
         setError("Nu s-a putut încărca restaurantul");
       } else if (data?.success && data.data?.restaurant) {
         setRestaurant(data.data.restaurant);
       } else {
         setError(data?.error || "Restaurantul nu a fost găsit");
       }
       
       setLoading(false);
     };
 
     fetchRestaurant();
   }, [slug, location, county]);
 
   if (loading) {
     return (
       <div className="min-h-screen flex flex-col bg-background">
         <Header />
         <main className="flex-1 container mx-auto px-4 py-8">
           <div className="flex items-center justify-center py-20">
             <Loader2 className="w-8 h-8 animate-spin text-primary" />
             <span className="ml-3 text-muted-foreground">Se încarcă restaurantul...</span>
           </div>
         </main>
         <Footer />
       </div>
     );
   }
 
   if (error || !restaurant) {
     return (
       <div className="min-h-screen flex flex-col bg-background">
         <Header />
         <main className="flex-1 container mx-auto px-4 py-8 text-center">
           <h1 className="text-2xl font-bold text-foreground mb-4">Restaurant negăsit</h1>
           <p className="text-muted-foreground mb-6">{error || "Ne pare rău, acest restaurant nu există."}</p>
           <Button onClick={() => navigate(-1)}>
             <ArrowLeft className="w-4 h-4 mr-2" />
             Înapoi
           </Button>
         </main>
         <Footer />
       </div>
     );
   }
 
   return (
     <div className="min-h-screen flex flex-col bg-background">
       <Header />
       
       <main className="flex-1">
         {/* Breadcrumb */}
         <section className="px-4 py-4 border-b border-border">
           <div className="container mx-auto">
             <button 
               onClick={() => navigate(-1)}
               className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
             >
               <ArrowLeft className="w-4 h-4" />
               Înapoi
             </button>
           </div>
         </section>
 
         {/* Hero Image */}
         <section className="px-4 py-6">
           <div className="container mx-auto">
             <div className="relative aspect-[21/9] md:aspect-[3/1] rounded-2xl overflow-hidden">
               <RealImage
                 name={restaurant.name}
                 location={location}
                 type="accommodation"
                 className="w-full h-full object-cover"
                 width={1600}
                 height={600}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
               <div className="absolute bottom-4 left-4 flex gap-2">
                 <Badge className="flex items-center gap-2 bg-background/90 text-foreground">
                   <UtensilsCrossed className="w-4 h-4" />
                   {restaurant.type}
                 </Badge>
                 {restaurant.rating && (
                   <Badge className="flex items-center gap-1 bg-amber-500 text-white">
                     <Star className="w-3 h-3 fill-current" />
                     {restaurant.rating}
                   </Badge>
                 )}
               </div>
             </div>
           </div>
         </section>
 
         {/* Content */}
         <section className="px-4 py-6">
           <div className="container mx-auto">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Main Content */}
               <div className="lg:col-span-2 space-y-6">
                 <div>
                   <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{restaurant.name}</h1>
                   <div className="flex items-center gap-2 text-muted-foreground">
                     <MapPin className="w-4 h-4 text-primary" />
                     <span>{location}</span>
                   </div>
                 </div>
 
                 {/* Cuisine Tags */}
                 {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                   <div className="flex flex-wrap gap-2">
                     {restaurant.cuisine.map((c, i) => (
                       <Badge key={i} variant="secondary">{c}</Badge>
                     ))}
                   </div>
                 )}
 
                 {/* Description */}
                 <Card>
                   <CardHeader>
                     <CardTitle className="text-lg flex items-center gap-2">
                       <Info className="w-5 h-5 text-primary" />
                       Despre restaurant
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <p className="text-foreground leading-relaxed">{restaurant.description}</p>
                   </CardContent>
                 </Card>
 
                 {/* Opening Hours */}
                 {restaurant.openingHours && (
                   <Card>
                     <CardHeader>
                       <CardTitle className="text-lg flex items-center gap-2">
                         <Clock className="w-5 h-5 text-primary" />
                         Program
                       </CardTitle>
                     </CardHeader>
                     <CardContent>
                       <p className="text-foreground">{restaurant.openingHours}</p>
                     </CardContent>
                   </Card>
                 )}
 
                 {/* Weather Widget */}
                 {restaurant.coordinates && (
                   <WeatherInline
                     latitude={restaurant.coordinates.lat}
                     longitude={restaurant.coordinates.lng}
                     cityName={location}
                     variant="compact"
                   />
                 )}
               </div>
 
               {/* Sidebar */}
               <div className="space-y-4">
                 {/* Events */}
                 <SidebarEventsList location={location} county={county} />
 
                 {/* Price & Actions */}
                 <Card className="border-primary/20">
                   <CardContent className="pt-6">
                     <div className="text-center mb-4">
                       <Badge variant="outline" className="text-lg px-4 py-2">
                         <DollarSign className="w-4 h-4 mr-1" />
                         {restaurant.priceRange}
                       </Badge>
                     </div>
                     
                     {restaurant.coordinates && (
                       <Button variant="default" className="w-full mb-2" asChild>
                         <a 
                           href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.coordinates.lat},${restaurant.coordinates.lng}`}
                           target="_blank"
                           rel="noopener noreferrer"
                         >
                           <Navigation className="w-4 h-4 mr-2" />
                           Navighează
                           <ExternalLink className="w-3 h-3 ml-auto" />
                         </a>
                       </Button>
                     )}
                     
                     {restaurant.phone && (
                       <Button variant="outline" className="w-full mb-2" asChild>
                         <a href={`tel:${restaurant.phone}`}>
                           <Phone className="w-4 h-4 mr-2" />
                           {restaurant.phone}
                         </a>
                       </Button>
                     )}
                     
                     {restaurant.website && (
                       <Button variant="outline" className="w-full mb-2" asChild>
                         <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
                           <Globe className="w-4 h-4 mr-2" />
                           Website
                           <ExternalLink className="w-3 h-3 ml-auto" />
                         </a>
                       </Button>
                     )}
                     
                     <Button variant="ghost" className="w-full">
                       <Share2 className="w-4 h-4 mr-2" />
                       Distribuie
                     </Button>
                   </CardContent>
                 </Card>
 
                 {/* Nearby Attractions */}
                 <RecommendedAttractions location={location} limit={4} />
               </div>
             </div>
           </div>
         </section>
       </main>
 
       <Footer />
     </div>
   );
 };
 
 export default RestaurantDetailPage;