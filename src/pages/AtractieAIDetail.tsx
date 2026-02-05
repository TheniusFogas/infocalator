import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
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
  Navigation,
  Share2,
  Loader2,
  CheckCircle,
  Info,
  Ticket,
  Lightbulb
} from "lucide-react";
 import { localInfoApi, AIAttractionDetail } from "@/lib/api/localInfo";
import { WeatherInline } from "@/components/WeatherInline";
import { NearbyAttractionsClickable } from "@/components/NearbyAttractionsClickable";
import { RealImage } from "@/components/RealImage";
import { EventsList } from "@/components/EventsList";
import { AccommodationsList } from "@/components/AccommodationsList";
import { attractionCategoryIcons, getCategoryIcon, getPlaceholderImage } from "@/lib/categoryIcons";

const AtractieAIDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const location = searchParams.get("location") || "România";
  const county = searchParams.get("county") || undefined;
  
   const [attraction, setAttraction] = useState<AIAttractionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [realImageUrl, setRealImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttraction = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(null);
      
       // Fetch detailed attraction info
       const response = await localInfoApi.getAttractionDetail(location, slug, county);
      
       if (response.success && response.data?.attraction) {
         setAttraction(response.data.attraction);
         // Increment view count
         localInfoApi.incrementAttractionViews(slug, location);
      } else {
         setError(response.error || "Atracția nu a fost găsită");
      }
      
      setLoading(false);
    };

    fetchAttraction();
  }, [slug, location, county]);

  const CategoryIcon = attraction ? getCategoryIcon(attraction.category, attractionCategoryIcons) : MapPin;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Se încarcă atracția...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !attraction) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Atracție negăsită</h1>
          <p className="text-muted-foreground mb-6">{error || "Ne pare rău, această atracție nu există."}</p>
          <Button asChild>
            <Link to={`/localitati`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Înapoi
            </Link>
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
            <Link 
              to={`/localitati`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Înapoi la localități
            </Link>
          </div>
        </section>

        {/* Image Gallery */}
        <section className="px-4 py-6">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Main Image */}
              <div className="md:col-span-8 relative aspect-[16/10] rounded-2xl overflow-hidden">
                <RealImage
                  name={attraction.title}
                  location={attraction.location}
                  type="attraction"
                  className="w-full h-full object-cover"
                  width={1200}
                  height={800}
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className="flex items-center gap-2 bg-background/90 text-foreground">
                    <CategoryIcon className="w-4 h-4" />
                    {attraction.category}
                  </Badge>
                </div>
              </div>
              
              {/* Thumbnail Grid */}
              <div className="md:col-span-4 grid grid-cols-3 md:grid-cols-2 gap-2">
                {[
                  attraction.title,
                  `${attraction.category} ${attraction.location}`,
                  `turism ${attraction.location}`,
                  `${attraction.location} Romania`,
                  county || attraction.location,
                  `peisaj ${attraction.category}`
                ].map((keyword, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <RealImage
                      name={keyword}
                      location={attraction.location}
                      type="attraction"
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                      width={400}
                      height={400}
                    />
                  </button>
                ))}
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
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{attraction.title}</h1>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{attraction.location}</span>
                    </div>
                    {attraction.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>Durată vizită: {attraction.duration}</span>
                      </div>
                    )}
                    {attraction.openingHours && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{attraction.openingHours}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary" />
                      Despre atracție
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-4">
                       <p className="text-foreground leading-relaxed">{attraction.description}</p>
                       {attraction.longDescription && (
                         <div className="prose prose-neutral max-w-none text-muted-foreground">
                           {attraction.longDescription.split('\n\n').map((paragraph, i) => (
                             <p key={i} className="leading-relaxed">{paragraph}</p>
                           ))}
                         </div>
                       )}
                     </div>
                  </CardContent>
                </Card>
 
                 {/* History */}
                 {attraction.history && (
                   <Card>
                     <CardHeader>
                       <CardTitle className="text-lg flex items-center gap-2">
                         <Info className="w-5 h-5 text-primary" />
                         Istorie
                       </CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="prose prose-neutral max-w-none text-foreground">
                         {attraction.history.split('\n\n').map((paragraph, i) => (
                           <p key={i} className="leading-relaxed mb-3">{paragraph}</p>
                         ))}
                       </div>
                     </CardContent>
                   </Card>
                 )}
 
                 {/* Interesting Facts */}
                 {attraction.facts && attraction.facts.length > 0 && (
                   <Card>
                     <CardHeader>
                       <CardTitle className="text-lg flex items-center gap-2">
                         <Lightbulb className="w-5 h-5 text-primary" />
                         Curiozități
                       </CardTitle>
                     </CardHeader>
                     <CardContent>
                       <ul className="space-y-2">
                         {attraction.facts.map((fact, i) => (
                           <li key={i} className="flex items-start gap-2 text-muted-foreground">
                             <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                             <span>{fact}</span>
                           </li>
                         ))}
                       </ul>
                     </CardContent>
                   </Card>
                 )}
 
                 {/* Facilities */}
                 {attraction.facilities && attraction.facilities.length > 0 && (
                   <Card>
                     <CardHeader>
                       <CardTitle className="text-lg">Facilități disponibile</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="flex flex-wrap gap-2">
                         {attraction.facilities.map((facility, i) => (
                           <Badge key={i} variant="secondary">{facility}</Badge>
                         ))}
                       </div>
                     </CardContent>
                   </Card>
                 )}

                {/* Tips */}
                {attraction.tips && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-primary" />
                        Sfaturi pentru vizitatori
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        {attraction.tips}
                      </div>
                       {attraction.bestTimeToVisit && (
                         <div className="flex items-start gap-2 text-muted-foreground mt-2">
                           <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                           <span><strong>Cel mai bun moment:</strong> {attraction.bestTimeToVisit}</span>
                         </div>
                       )}
                       {attraction.accessibility && (
                         <div className="flex items-start gap-2 text-muted-foreground mt-2">
                           <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                           <span><strong>Accesibilitate:</strong> {attraction.accessibility}</span>
                         </div>
                       )}
                    </CardContent>
                  </Card>
                )}
 
                 {/* Nearby Attractions */}
                 {attraction.nearbyAttractions && attraction.nearbyAttractions.length > 0 && (
                  <NearbyAttractionsClickable
                    attractions={attraction.nearbyAttractions}
                    currentLocation={attraction.location}
                    county={county}
                  />
                 )}

                {/* Related Content */}
                <div className="space-y-6 pt-4">
                  <EventsList location={attraction.city || location} county={county} />
                  <AccommodationsList location={attraction.city || location} county={county} />
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Entry Info Card */}
                <Card className="border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center mb-4">
                      {attraction.isPaid ? (
                        <>
                          <p className="text-sm text-muted-foreground">Preț intrare</p>
                          <p className="text-3xl font-bold text-primary">{attraction.entryFee}</p>
                        </>
                      ) : (
                         <Badge variant="secondary" className="text-lg py-1 bg-primary/10 text-primary">Intrare Gratuită</Badge>
                      )}
                    </div>
                    
                    <Button className="w-full gap-2" asChild>
                      <a 
                        href={`https://www.google.com/search?q=${encodeURIComponent(attraction.title + ' ' + attraction.location + ' bilete')}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Ticket className="w-4 h-4" />
                        Caută bilete
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Location */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Locație
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium text-foreground">{attraction.location}</p>
                    {attraction.city && (
                      <p className="text-sm text-muted-foreground">{attraction.city}</p>
                    )}
                     {attraction.viewCount !== undefined && attraction.viewCount > 0 && (
                       <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                         {attraction.viewCount.toLocaleString('ro-RO')} vizualizări
                       </p>
                     )}
                  </CardContent>
                </Card>

                {/* Weather */}
                {attraction.coordinates && (
                  <WeatherInline
                    latitude={attraction.coordinates.lat}
                    longitude={attraction.coordinates.lng}
                    cityName={attraction.city || attraction.location}
                    variant="sidebar"
                  />
                )}

                {/* Actions */}
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <Button variant="outline" className="w-full justify-start gap-3" asChild>
                      <a 
                        href={`https://www.google.com/maps/search/${encodeURIComponent(attraction.title + ' ' + attraction.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="w-4 h-4" />
                        Navigare
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start gap-3">
                      <Share2 className="w-4 h-4" />
                      Distribuie
                    </Button>
                  </CardContent>
                </Card>

                {/* Weather */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vremea în zonă</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Verifică vremea înainte de a pleca!
                    </p>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/vremea?city=${encodeURIComponent(attraction.city || location)}`}>
                        Vezi prognoza meteo
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AtractieAIDetailPage;
