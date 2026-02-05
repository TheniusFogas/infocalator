 import { useState, useEffect } from 'react';
 import { 
   Sun, 
   Cloud, 
   CloudRain, 
   CloudSnow, 
   CloudLightning, 
   CloudDrizzle,
   Wind,
   Droplets,
   Thermometer,
   Loader2
 } from 'lucide-react';
 
 interface WeatherData {
   temperature: number;
   feelsLike: number;
   weatherCode: number;
   humidity: number;
   windSpeed: number;
   description: string;
   icon: string;
 }
 
 interface WeatherInlineProps {
   latitude: number;
   longitude: number;
   cityName?: string;
   /** For events - show weather for a specific date range */
   eventDate?: string;
   eventEndDate?: string;
   variant?: 'compact' | 'full' | 'sidebar';
 }
 
 const getWeatherIcon = (code: number) => {
   if (code === 0) return <Sun className="w-5 h-5 text-yellow-500" />;
   if (code <= 3) return <Cloud className="w-5 h-5 text-gray-400" />;
   if (code <= 49) return <Cloud className="w-5 h-5 text-gray-500" />;
   if (code <= 59) return <CloudDrizzle className="w-5 h-5 text-blue-400" />;
   if (code <= 69) return <CloudRain className="w-5 h-5 text-blue-500" />;
   if (code <= 79) return <CloudSnow className="w-5 h-5 text-blue-200" />;
   if (code <= 99) return <CloudLightning className="w-5 h-5 text-yellow-600" />;
   return <Cloud className="w-5 h-5 text-gray-400" />;
 };
 
 const getWeatherDescription = (code: number): string => {
   const descriptions: Record<number, string> = {
     0: 'Senin',
     1: 'Predominant senin',
     2: 'Parțial înnorat',
     3: 'Înnorat',
     45: 'Ceață',
     48: 'Ceață cu chiciură',
     51: 'Burniță ușoară',
     53: 'Burniță moderată',
     55: 'Burniță densă',
     61: 'Ploaie ușoară',
     63: 'Ploaie moderată',
     65: 'Ploaie abundentă',
     71: 'Ninsoare ușoară',
     73: 'Ninsoare moderată',
     75: 'Ninsoare abundentă',
     80: 'Averse ușoare',
     81: 'Averse moderate',
     82: 'Averse violente',
     95: 'Furtună',
     96: 'Furtună cu grindină',
   };
   return descriptions[code] || 'Variabil';
 };
 
 const getWeatherEmoji = (code: number): string => {
   if (code === 0) return '☀️';
   if (code <= 3) return '⛅';
   if (code <= 48) return '🌫️';
   if (code <= 59) return '🌦️';
   if (code <= 69) return '🌧️';
   if (code <= 79) return '❄️';
   if (code <= 99) return '⛈️';
   return '🌤️';
 };
 
 export const WeatherInline = ({ 
   latitude, 
   longitude, 
   cityName,
   eventDate,
   eventEndDate,
   variant = 'compact'
 }: WeatherInlineProps) => {
   const [weather, setWeather] = useState<WeatherData | null>(null);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const fetchWeather = async () => {
       if (!latitude || !longitude) {
         setLoading(false);
         return;
       }
 
       try {
         const response = await fetch(
           `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Europe/Bucharest`
         );
         
         if (response.ok) {
           const data = await response.json();
           const current = data.current;
           
           setWeather({
             temperature: Math.round(current.temperature_2m),
             feelsLike: Math.round(current.apparent_temperature),
             weatherCode: current.weather_code,
             humidity: current.relative_humidity_2m,
             windSpeed: Math.round(current.wind_speed_10m),
             description: getWeatherDescription(current.weather_code),
             icon: getWeatherEmoji(current.weather_code)
           });
         }
       } catch (error) {
         console.error('Error fetching weather:', error);
       } finally {
         setLoading(false);
       }
     };
 
     fetchWeather();
   }, [latitude, longitude]);
 
   if (loading) {
     return (
       <div className="flex items-center gap-2 text-muted-foreground">
         <Loader2 className="w-4 h-4 animate-spin" />
         <span className="text-sm">Se încarcă vremea...</span>
       </div>
     );
   }
 
   if (!weather) return null;
 
   if (variant === 'compact') {
     return (
       <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 border border-border">
         <span className="text-2xl">{weather.icon}</span>
         <div className="flex-1 min-w-0">
           <div className="flex items-baseline gap-2">
             <span className="text-lg font-bold text-foreground">{weather.temperature}°C</span>
             <span className="text-sm text-muted-foreground">{weather.description}</span>
           </div>
           {cityName && (
             <span className="text-xs text-muted-foreground">Vremea în {cityName}</span>
           )}
         </div>
         <div className="text-right text-xs text-muted-foreground space-y-0.5">
           <div className="flex items-center gap-1 justify-end">
             <Droplets className="w-3 h-3" /> {weather.humidity}%
           </div>
           <div className="flex items-center gap-1 justify-end">
             <Wind className="w-3 h-3" /> {weather.windSpeed} km/h
           </div>
         </div>
       </div>
     );
   }
 
   if (variant === 'sidebar') {
     return (
       <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
         <div className="flex items-center gap-3 mb-3">
           <span className="text-3xl">{weather.icon}</span>
           <div>
             <p className="text-2xl font-bold text-foreground">{weather.temperature}°C</p>
             <p className="text-sm text-muted-foreground">{weather.description}</p>
           </div>
         </div>
         
         <div className="grid grid-cols-2 gap-2 text-sm">
           <div className="flex items-center gap-2 text-muted-foreground">
             <Thermometer className="w-4 h-4 text-primary" />
             <span>Simțit {weather.feelsLike}°C</span>
           </div>
           <div className="flex items-center gap-2 text-muted-foreground">
             <Droplets className="w-4 h-4 text-blue-500" />
             <span>Umiditate {weather.humidity}%</span>
           </div>
           <div className="flex items-center gap-2 text-muted-foreground col-span-2">
             <Wind className="w-4 h-4 text-gray-500" />
             <span>Vânt {weather.windSpeed} km/h</span>
           </div>
         </div>
         
         {cityName && (
           <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-primary/10">
             {eventDate ? `Prognoză pentru ${eventDate}` : `Vremea actuală în ${cityName}`}
           </p>
         )}
       </div>
     );
   }
 
   // Full variant
   return (
     <div className="p-4 rounded-xl bg-card border border-border">
       <div className="flex items-start justify-between mb-4">
         <div className="flex items-center gap-3">
           <span className="text-4xl">{weather.icon}</span>
           <div>
             <p className="text-3xl font-bold text-foreground">{weather.temperature}°C</p>
             <p className="text-muted-foreground">{weather.description}</p>
           </div>
         </div>
         {getWeatherIcon(weather.weatherCode)}
       </div>
       
       <div className="grid grid-cols-3 gap-4">
         <div className="text-center p-2 rounded-lg bg-muted/50">
           <Thermometer className="w-5 h-5 mx-auto mb-1 text-primary" />
           <p className="text-xs text-muted-foreground">Simțit</p>
           <p className="font-semibold text-foreground">{weather.feelsLike}°C</p>
         </div>
         <div className="text-center p-2 rounded-lg bg-muted/50">
           <Droplets className="w-5 h-5 mx-auto mb-1 text-blue-500" />
           <p className="text-xs text-muted-foreground">Umiditate</p>
           <p className="font-semibold text-foreground">{weather.humidity}%</p>
         </div>
         <div className="text-center p-2 rounded-lg bg-muted/50">
           <Wind className="w-5 h-5 mx-auto mb-1 text-gray-500" />
           <p className="text-xs text-muted-foreground">Vânt</p>
           <p className="font-semibold text-foreground">{weather.windSpeed} km/h</p>
         </div>
       </div>
       
       {cityName && (
         <p className="text-sm text-muted-foreground mt-4 text-center">
           {eventDate ? `Prognoză pentru ${eventDate}` : `Vremea actuală în ${cityName}`}
         </p>
       )}
     </div>
   );
 };