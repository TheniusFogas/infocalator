import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Ticket, 
  ExternalLink,
  Users,
  Star,
  Navigation,
  Share2,
  Loader2,
  CheckCircle,
  Info
} from "lucide-react";
import { localInfoApi, EventDetail } from "@/lib/api/localInfo";
import { WeatherForecast } from "@/components/WeatherForecast";
import { WeatherInline } from "@/components/WeatherInline";
import { RealImage } from "@/components/RealImage";
import { eventCategoryIcons, getCategoryIcon, getPlaceholderImage } from "@/lib/categoryIcons";

const EvenimentDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const location = searchParams.get("location") || "România";
  const county = searchParams.get("county") || undefined;
  
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(null);
      
      const response = await localInfoApi.getEventDetail(location, slug, county);
      
      if (response.success && response.data?.event) {
        setEvent(response.data.event);
      } else {
        setError(response.error || "Nu s-a putut încărca evenimentul");
      }
      
      setLoading(false);
    };

    fetchEvent();
  }, [slug, location, county]);

  const CategoryIcon = event ? getCategoryIcon(event.category, eventCategoryIcons) : Calendar;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Se încarcă evenimentul...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Eveniment negăsit</h1>
          <p className="text-muted-foreground mb-6">{error || "Ne pare rău, acest eveniment nu există."}</p>
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

  const images = event.images?.length 
    ? event.images.map(img => ({ 
        url: getPlaceholderImage(img.url, 1200, 800), 
        alt: img.alt 
      }))
    : [{ url: getPlaceholderImage(event.imageKeywords || event.title, 1200, 800), alt: event.title }];

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
                <RealImage
                  name={event.title}
                  location={event.location}
                  type="event"
                  className="w-full h-full object-cover"
                  width={1200}
                  height={800}
                />
                <div className="absolute top-4 left-4">
                  <Badge className="flex items-center gap-2 bg-background/90 text-foreground">
                    <CategoryIcon className="w-4 h-4" />
                    {event.category}
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
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{event.title}</h1>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{event.date}{event.endDate ? ` - ${event.endDate}` : ''}</span>
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{event.time}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{event.venue || event.location}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary" />
                      Despre eveniment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed mb-4">{event.description}</p>
                    {event.longDescription && (
                      <div className="text-muted-foreground whitespace-pre-line">{event.longDescription}</div>
                    )}
                  </CardContent>
                </Card>

                {/* Highlights */}
                {event.highlights && event.highlights.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="w-5 h-5 text-primary" />
                        Ce vei găsi
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {event.highlights.map((highlight, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                            <span className="text-foreground">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Schedule */}
                {event.schedule && event.schedule.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Program
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {event.schedule.map((day, index) => (
                          <div key={index}>
                            <h4 className="font-semibold text-foreground mb-2">{day.day}</h4>
                            <ul className="space-y-1">
                              {day.activities.map((activity, actIndex) => (
                                <li key={actIndex} className="text-muted-foreground flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-primary" />
                                  {activity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Weather Forecast for Event Date */}
                {event.coordinates && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-primary" />
                          Prognoza meteo pentru {event.date}{event.endDate ? ` - ${event.endDate}` : ''}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <WeatherInline
                          latitude={event.coordinates.lat}
                          longitude={event.coordinates.lng}
                          cityName={event.city || event.location}
                          eventDate={event.date}
                          eventEndDate={event.endDate}
                          variant="full"
                        />
                      </CardContent>
                    </Card>
                    
                    {/* 7-day forecast for reference */}
                    <WeatherForecast 
                      latitude={event.coordinates.lat} 
                      longitude={event.coordinates.lng}
                      cityName={event.city}
                    />
                  </>
                )}

                {/* Facilities */}
                {event.facilities && event.facilities.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Facilități disponibile</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {event.facilities.map((facility, index) => (
                          <Badge key={index} variant="secondary">{facility}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tips */}
                {event.tips && event.tips.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Sfaturi utile</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {event.tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2 text-muted-foreground">
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Ticket Card */}
                <Card className="border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center mb-4">
                      {event.isPaid ? (
                        <>
                          <p className="text-sm text-muted-foreground">Preț bilet</p>
                          <p className="text-3xl font-bold text-primary">{event.ticketPrice}</p>
                          {event.ticketPriceRange && (
                            <p className="text-sm text-muted-foreground">
                              de la {event.ticketPriceRange.min} {event.ticketPriceRange.currency}
                            </p>
                          )}
                        </>
                      ) : (
                        <Badge className="bg-green-500/10 text-green-600 text-lg py-1">Intrare Gratuită</Badge>
                      )}
                    </div>
                    
                    {event.ticketUrl && (
                      <Button className="w-full gap-2" asChild>
                        <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                          <Ticket className="w-4 h-4" />
                          Cumpără bilete
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Date & Location */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Când și Unde</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{event.date}</p>
                        {event.endDate && <p className="text-sm text-muted-foreground">până la {event.endDate}</p>}
                        {event.time && <p className="text-sm text-muted-foreground">{event.time}</p>}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{event.venue || event.location}</p>
                        <p className="text-sm text-muted-foreground">{event.city}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    {event.coordinates && (
                      <Button variant="outline" className="w-full justify-start gap-3" asChild>
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${event.coordinates.lat},${event.coordinates.lng}`}
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

                {/* Organizer */}
                {event.organizer && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Organizator
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium text-foreground">{event.organizer}</p>
                      {event.organizerContact && (
                        <p className="text-sm text-muted-foreground">{event.organizerContact}</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default EvenimentDetailPage;
