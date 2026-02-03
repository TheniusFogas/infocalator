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
import { localInfoApi, AIAttraction } from "@/lib/api/localInfo";
import { WeatherForecast } from "@/components/WeatherForecast";
import { EventsList } from "@/components/EventsList";
import { AccommodationsList } from "@/components/AccommodationsList";
import { attractionCategoryIcons, getCategoryIcon, getPlaceholderImage } from "@/lib/categoryIcons";

const AtractieAIDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const location = searchParams.get("location") || "România";
  const county = searchParams.get("county") || undefined;
  
  const [attraction, setAttraction] = useState<AIAttraction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchAttraction = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(null);
      
      // Fetch attractions and find the one matching the slug
      const response = await localInfoApi.searchAttractions(location, county);
      
      if (response.success && response.data?.attractions) {
        const found = response.data.attractions.find(a => {
          const attractionSlug = a.slug || a.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          return attractionSlug === slug;
        });
        
        if (found) {
          setAttraction(found);
        } else {
          setError("Atracția nu a fost găsită");
        }
      } else {
        setError(response.error || "Nu s-a putut încărca atracția");
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

  // Generate multiple images for the gallery
  const images = [
    { url: getPlaceholderImage(attraction.imageKeywords || attraction.title, 1200, 800), alt: attraction.title },
    { url: getPlaceholderImage(`${attraction.category} ${attraction.location}`, 1200, 800), alt: `${attraction.category} în ${attraction.location}` },
    { url: getPlaceholderImage(`turism ${attraction.location} romania`, 1200, 800), alt: `Turism ${attraction.location}` },
    { url: getPlaceholderImage(`landscape ${attraction.category}`, 1200, 800), alt: `Peisaj ${attraction.category}` },
    { url: getPlaceholderImage(`${attraction.title} view`, 1200, 800), alt: `Vedere ${attraction.title}` },
    { url: getPlaceholderImage(`romania nature ${attraction.category}`, 1200, 800), alt: `Natură România` },
  ];

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
                <img 
                  src={images[selectedImage]?.url} 
                  alt={images[selectedImage]?.alt}
                  className="w-full h-full object-cover"
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
                {images.slice(0, 6).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img 
                      src={img.url.replace('1200/800', '400/400')} 
                      alt={img.alt}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
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
                    <p className="text-foreground leading-relaxed">{attraction.description}</p>
                  </CardContent>
                </Card>

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
                    </CardContent>
                  </Card>
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
                        <Badge className="bg-green-500/10 text-green-600 text-lg py-1">Intrare Gratuită</Badge>
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
                  </CardContent>
                </Card>

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
