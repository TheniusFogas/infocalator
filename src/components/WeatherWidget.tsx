import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudDrizzle,
  Wind,
  Thermometer,
  Droplets,
  Loader2
} from 'lucide-react';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  description: string;
}

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
  cityName?: string;
  compact?: boolean;
}

const getWeatherIcon = (code: number, className: string = 'w-8 h-8') => {
  if (code === 0) return <Sun className={`${className} text-yellow-500`} />;
  if (code <= 3) return <Cloud className={`${className} text-gray-400`} />;
  if (code <= 49) return <Cloud className={`${className} text-gray-500`} />;
  if (code <= 59) return <CloudDrizzle className={`${className} text-blue-400`} />;
  if (code <= 69) return <CloudRain className={`${className} text-blue-500`} />;
  if (code <= 79) return <CloudSnow className={`${className} text-blue-200`} />;
  if (code <= 99) return <CloudLightning className={`${className} text-yellow-600`} />;
  return <Cloud className={`${className} text-gray-400`} />;
};

const getWeatherDescription = (code: number): string => {
  if (code === 0) return 'Senin';
  if (code <= 3) return 'Parțial înnorat';
  if (code <= 49) return 'Ceață';
  if (code <= 59) return 'Burniță';
  if (code <= 69) return 'Ploaie';
  if (code <= 79) return 'Ninsoare';
  if (code <= 99) return 'Furtună';
  return 'Variabil';
};

export const WeatherWidget = ({ latitude, longitude, cityName, compact = false }: WeatherWidgetProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Europe/Bucharest`
        );
        const data = await response.json();
        
        if (data.current) {
          setWeather({
            temperature: Math.round(data.current.temperature_2m),
            weatherCode: data.current.weather_code,
            humidity: data.current.relative_humidity_2m,
            windSpeed: Math.round(data.current.wind_speed_10m),
            description: getWeatherDescription(data.current.weather_code),
          });
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
      } finally {
        setLoading(false);
      }
    };

    if (latitude && longitude) {
      fetchWeather();
    }
  }, [latitude, longitude]);

  if (loading) {
    return (
      <Card className={compact ? 'bg-card/50' : ''}>
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  if (compact) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getWeatherIcon(weather.weatherCode, 'w-10 h-10')}
              <div>
                <p className="text-2xl font-bold text-foreground">{weather.temperature}°C</p>
                <p className="text-sm text-muted-foreground">{weather.description}</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                <Droplets className="w-3 h-3" />
                {weather.humidity}%
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                <Wind className="w-3 h-3" />
                {weather.windSpeed} km/h
              </p>
            </div>
          </div>
          {cityName && (
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
              Vremea în {cityName}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {getWeatherIcon(weather.weatherCode, 'w-5 h-5')}
          Vremea {cityName ? `în ${cityName}` : 'acum'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getWeatherIcon(weather.weatherCode, 'w-16 h-16')}
            <div>
              <p className="text-4xl font-bold text-foreground">{weather.temperature}°C</p>
              <p className="text-muted-foreground">{weather.description}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span>Umiditate: {weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wind className="w-4 h-4 text-gray-500" />
              <span>Vânt: {weather.windSpeed} km/h</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
