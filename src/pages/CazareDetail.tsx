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
  Star,
  Navigation,
  Share2,
  Loader2,
  CheckCircle,
  Phone,
  Mail,
  Globe,
  Users,
  Wifi,
  Car,
  UtensilsCrossed,
  Waves,
  Bath,
  Info,
  CreditCard,
  Ban,
  Baby,
  Dog,
  Cigarette
} from "lucide-react";
import { localInfoApi, AccommodationDetail } from "@/lib/api/localInfo";
import { WeatherWidget } from "@/components/WeatherWidget";
import { AffiliateBookingLinks } from "@/components/AffiliateBookingLinks";
import { RecommendedAccommodations } from "@/components/RecommendedAccommodations";
import { RecommendedAttractions } from "@/components/RecommendedAttractions";
import { AdZone } from "@/components/AdZone";
import { accommodationTypeIcons, amenityIcons, getCategoryIcon, getPlaceholderImage, priceRangeColors } from "@/lib/categoryIcons";

const CazareDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const location = searchParams.get("location") || "România";
  const county = searchParams.get("county") || undefined;
  
  const [accommodation, setAccommodation] = useState<AccommodationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchAccommodation = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(null);
      
      const response = await localInfoApi.getAccommodationDetail(location, slug, county);
      
      if (response.success && response.data?.accommodation) {
        setAccommodation(response.data.accommodation);
      } else {
        setError(response.error || "Nu s-a putut încărca cazarea");
      }
      
      setLoading(false);
    };

    fetchAccommodation();
  }, [slug, location, county]);

  const TypeIcon = accommodation ? getCategoryIcon(accommodation.type, accommodationTypeIcons) : MapPin;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Se încarcă cazarea...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !accommodation) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Cazare negăsită</h1>
          <p className="text-muted-foreground mb-6">{error || "Ne pare rău, această cazare nu există."}</p>
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

  const images = accommodation.images?.length 
    ? accommodation.images.map(img => ({ 
        url: getPlaceholderImage(img.url, 1200, 800), 
        alt: img.alt 
      }))
    : [{ url: getPlaceholderImage(accommodation.imageKeywords || accommodation.name, 1200, 800), alt: accommodation.name }];

  const renderStars = (count: number) => {
    return Array.from({ length: count }, (_, i) => (
      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
    ));
  };

  const policyIcons: Record<string, React.ReactNode> = {
    cancellation: <CreditCard className="w-4 h-4" />,
    children: <Baby className="w-4 h-4" />,
    pets: <Dog className="w-4 h-4" />,
    smoking: <Cigarette className="w-4 h-4" />,
  };

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

        {/* Image Gallery - Material Design 3 Style */}
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
                    <TypeIcon className="w-4 h-4" />
                    {accommodation.type}
                  </Badge>
                  {accommodation.stars && (
                    <Badge className="flex items-center gap-1 bg-background/90 text-foreground">
                      {renderStars(accommodation.stars)}
                    </Badge>
                  )}
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
                  <div className="flex items-center gap-3 mb-2">
                    {accommodation.rating && (
                      <Badge className="bg-green-500 text-white">
                        <Star className="w-3 h-3 mr-1 fill-white" />
                        {accommodation.rating}
                      </Badge>
                    )}
                    {accommodation.reviewCount && (
                      <span className="text-sm text-muted-foreground">
                        {accommodation.reviewCount} recenzii
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{accommodation.name}</h1>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{accommodation.address}, {accommodation.city}</span>
                  </div>
                </div>

                {/* Amenities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Facilități populare</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {accommodation.amenities?.map((amenity, index) => {
                        const Icon = amenityIcons[amenity] || CheckCircle;
                        return (
                          <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                            <Icon className="w-4 h-4 text-primary" />
                            <span className="text-sm text-foreground">{amenity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary" />
                      Despre cazare
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed mb-4">{accommodation.description}</p>
                    {accommodation.longDescription && (
                      <div className="text-muted-foreground whitespace-pre-line">{accommodation.longDescription}</div>
                    )}
                  </CardContent>
                </Card>

                {/* Room Types */}
                {accommodation.roomTypes && accommodation.roomTypes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tipuri de camere</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {accommodation.roomTypes.map((room, index) => (
                          <div key={index} className="p-4 rounded-lg border border-border">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-foreground">{room.name}</h4>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {room.capacity} persoane
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">{room.price} RON</p>
                                <p className="text-xs text-muted-foreground">pe noapte</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {room.features.map((feature, fIndex) => (
                                <Badge key={fIndex} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Policies */}
                {accommodation.policies && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reguli și politici</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(accommodation.policies).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              {policyIcons[key]}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground capitalize">{key}</p>
                              <p className="text-sm text-foreground">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews */}
                {accommodation.reviews && accommodation.reviews.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recenzii recente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {accommodation.reviews.map((review, index) => (
                          <div key={index} className="p-4 rounded-lg bg-muted">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-foreground">{review.author}</p>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: review.rating }, (_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">{review.text}</p>
                            <p className="text-xs text-muted-foreground">{review.date}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Weather Widget */}
                {accommodation.coordinates && (
                  <WeatherWidget 
                    latitude={accommodation.coordinates.lat} 
                    longitude={accommodation.coordinates.lng}
                    cityName={accommodation.city || location}
                    compact
                  />
                )}

                {/* Ad Zone */}
                <AdZone zoneKey="in_content" />
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Price Card */}
                <Card className="border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center mb-4">
                      <p className="text-sm text-muted-foreground">Preț de la</p>
                      <p className="text-3xl font-bold text-primary">
                        {accommodation.pricePerNight?.min || '---'} {accommodation.pricePerNight?.currency || 'RON'}
                      </p>
                      <p className="text-sm text-muted-foreground">pe noapte</p>
                      {accommodation.priceRange && (
                        <Badge className={`mt-2 ${priceRangeColors[accommodation.priceRange]}`}>
                          {accommodation.priceRange}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Affiliate Booking Links */}
                    <AffiliateBookingLinks 
                      accommodationName={accommodation.name} 
                      location={accommodation.city || location}
                      showAll
                    />
                  </CardContent>
                </Card>

                {/* Check-in/out */}
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Check-in</span>
                      </div>
                      <span className="font-medium text-foreground">{accommodation.checkIn || '14:00'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Check-out</span>
                      </div>
                      <span className="font-medium text-foreground">{accommodation.checkOut || '11:00'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact */}
                {accommodation.contact && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {accommodation.contact.phone && (
                        <a 
                          href={`tel:${accommodation.contact.phone}`}
                          className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          {accommodation.contact.phone}
                        </a>
                      )}
                      {accommodation.contact.email && (
                        <a 
                          href={`mailto:${accommodation.contact.email}`}
                          className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          {accommodation.contact.email}
                        </a>
                      )}
                      {accommodation.contact.website && (
                        <a 
                          href={accommodation.contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          Website oficial
                        </a>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    {accommodation.coordinates && (
                      <Button variant="outline" className="w-full justify-start gap-3" asChild>
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${accommodation.coordinates.lat},${accommodation.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation className="w-4 h-4" />
                          Navigare
                          <ExternalLink className="w-3 h-3 ml-auto" />
                        </a>
                      </Button>
                    )}
                    
                    <Button variant="outline" className="w-full justify-start gap-3">
                      <Share2 className="w-4 h-4" />
                      Distribuie
                    </Button>
                  </CardContent>
                </Card>

                {/* Nearby Attractions */}
                {accommodation.nearbyAttractions && accommodation.nearbyAttractions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">În apropiere</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {accommodation.nearbyAttractions.map((attraction, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-foreground">{attraction.name}</span>
                            <Badge variant="outline">{attraction.distance}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommended Accommodations */}
                <RecommendedAccommodations 
                  currentSlug={slug} 
                  location={location}
                  limit={4}
                />

                {/* Recommended Attractions */}
                <RecommendedAttractions 
                  location={location}
                  limit={4}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CazareDetailPage;
