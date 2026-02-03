import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudSun, Loader2 } from "lucide-react";

interface ForecastDay {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  icon: string;
  description: string;
}

interface WeatherForecastProps {
  latitude: number;
  longitude: number;
  cityName: string;
}

const weatherDescriptions: Record<number, string> = {
  0: "Senin",
  1: "Predominant senin",
  2: "Parțial înnorat",
  3: "Înnorat",
  45: "Ceață",
  48: "Ceață cu chiciură",
  51: "Burniță ușoară",
  53: "Burniță moderată",
  55: "Burniță densă",
  61: "Ploaie ușoară",
  63: "Ploaie moderată",
  65: "Ploaie abundentă",
  71: "Ninsoare ușoară",
  73: "Ninsoare moderată",
  75: "Ninsoare abundentă",
  80: "Averse ușoare",
  81: "Averse moderate",
  82: "Averse puternice",
  95: "Furtună",
  96: "Furtună cu grindină",
  99: "Furtună severă"
};

const getWeatherIcon = (code: number): string => {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌧️";
  if (code <= 65) return "🌧️";
  if (code <= 75) return "❄️";
  if (code <= 82) return "🌧️";
  return "⛈️";
};

const dayNames = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

export const WeatherForecast = ({ latitude, longitude, cityName }: WeatherForecastProps) => {
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=7`
        );
        
        if (response.ok) {
          const data = await response.json();
          const days: ForecastDay[] = data.daily.time.map((date: string, index: number) => {
            const dateObj = new Date(date);
            const weatherCode = data.daily.weather_code[index];
            
            return {
              date: date,
              dayName: index === 0 ? 'Astăzi' : dayNames[dateObj.getDay()],
              tempMax: Math.round(data.daily.temperature_2m_max[index]),
              tempMin: Math.round(data.daily.temperature_2m_min[index]),
              weatherCode,
              icon: getWeatherIcon(weatherCode),
              description: weatherDescriptions[weatherCode] || 'Necunoscut'
            };
          });
          
          setForecast(days);
        }
      } catch (error) {
        console.error('Error fetching forecast:', error);
      }
      
      setLoading(false);
    };

    fetchForecast();
  }, [latitude, longitude]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-primary" />
            Prognoză 7 zile
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CloudSun className="w-5 h-5 text-primary" />
          Prognoză 7 zile pentru {cityName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {forecast.map((day, index) => (
            <div 
              key={day.date} 
              className={`text-center p-3 rounded-lg transition-colors ${
                index === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              <p className="text-xs font-medium text-foreground mb-1">{day.dayName}</p>
              <span className="text-2xl">{day.icon}</span>
              <div className="mt-1">
                <p className="text-sm font-bold text-foreground">{day.tempMax}°</p>
                <p className="text-xs text-muted-foreground">{day.tempMin}°</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{day.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
