import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons
const startIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

 // Route colors for main and alternatives
 const ROUTE_COLORS = {
   primary: 'hsl(217 91% 60%)', // Primary blue
   alt1: 'hsl(142 76% 36%)', // Green
   alt2: 'hsl(280 65% 50%)', // Purple
   alt3: 'hsl(25 95% 53%)', // Orange
 };
 
 interface AlternativeRoute {
   coordinates: [number, number][];
   name: string;
   distance: number;
   duration: number;
 }
 
interface RouteMapProps {
  startCoords?: [number, number];
  endCoords?: [number, number];
  startName?: string;
  endName?: string;
  routeCoordinates?: [number, number][];
   alternativeRoutes?: AlternativeRoute[];
   selectedAlternativeIndex?: number;
   onSelectAlternative?: (index: number) => void;
   pois?: { lat: number; lon: number; name: string; type: string }[];
}

export const RouteMap = ({ 
  startCoords, 
  endCoords, 
  startName = "Plecare", 
  endName = "Destinație",
   routeCoordinates = [],
   alternativeRoutes = [],
   selectedAlternativeIndex = -1,
   onSelectAlternative,
   pois = []
}: RouteMapProps) => {
  const romaniaCenter: [number, number] = [45.9432, 24.9668];
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
   const altRouteLinesRef = useRef<L.Polyline[]>([]);
   const poiMarkersRef = useRef<L.Marker[]>([]);

  const boundsPadding = useMemo<[number, number]>(() => [50, 50], []);

  // Initialize map once
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(romaniaCenter, 7);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      startMarkerRef.current = null;
      endMarkerRef.current = null;
      routeLineRef.current = null;
       altRouteLinesRef.current = [];
       poiMarkersRef.current = [];
    };
  }, [romaniaCenter]);

  // Update markers + route line when props change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing layers
    if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
    }
    if (endMarkerRef.current) {
      endMarkerRef.current.remove();
      endMarkerRef.current = null;
    }
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }
     altRouteLinesRef.current.forEach(line => line.remove());
     altRouteLinesRef.current = [];
     poiMarkersRef.current.forEach(marker => marker.remove());
     poiMarkersRef.current = [];

    const fitCoords: [number, number][] = [];

    if (startCoords) {
      startMarkerRef.current = L.marker(startCoords, { icon: startIcon })
        .addTo(map)
        .bindPopup(startName);
      fitCoords.push(startCoords);
    }

    if (endCoords) {
      endMarkerRef.current = L.marker(endCoords, { icon: endIcon })
        .addTo(map)
        .bindPopup(endName);
      fitCoords.push(endCoords);
    }

     // Draw alternative routes first (behind main route)
     const altColors = [ROUTE_COLORS.alt1, ROUTE_COLORS.alt2, ROUTE_COLORS.alt3];
     alternativeRoutes.forEach((altRoute, idx) => {
       if (altRoute.coordinates.length > 0) {
         const isSelected = idx === selectedAlternativeIndex;
         const line = L.polyline(altRoute.coordinates, {
           color: altColors[idx % altColors.length],
           weight: isSelected ? 6 : 4,
           opacity: isSelected ? 0.9 : 0.5,
           dashArray: isSelected ? undefined : '10, 10',
         }).addTo(map);
         
         // Add click handler for alternative selection
         if (onSelectAlternative) {
           line.on('click', () => onSelectAlternative(idx));
           line.bindTooltip(
             `${altRoute.name}: ${altRoute.distance} km, ${Math.floor(altRoute.duration / 60)}h ${altRoute.duration % 60}min`,
             { sticky: true }
           );
         }
         
         altRouteLinesRef.current.push(line);
       }
     });
 
     // Draw main route on top
    if (routeCoordinates.length > 0) {
      routeLineRef.current = L.polyline(routeCoordinates, {
        color: ROUTE_COLORS.primary,
        weight: 6,
        opacity: 0.8,
      }).addTo(map);

      const bounds = L.latLngBounds(routeCoordinates.map((c) => [c[0], c[1]]));
       
       // Include alternative routes in bounds
       alternativeRoutes.forEach(alt => {
         alt.coordinates.forEach(c => bounds.extend([c[0], c[1]]));
       });
       
      map.fitBounds(bounds, { padding: boundsPadding });
     } else if (fitCoords.length >= 2) {
       const bounds = L.latLngBounds(fitCoords.map((c) => [c[0], c[1]]));
       map.fitBounds(bounds, { padding: boundsPadding });
     } else {
       // Default view
       map.setView(romaniaCenter, 7);
    }

     // Add POI markers
     pois.forEach(poi => {
       const poiIcon = L.divIcon({
         className: 'poi-marker',
         html: `<div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${
           poi.type === 'hospital' ? 'bg-red-500 text-white' :
           poi.type === 'police' ? 'bg-blue-700 text-white' :
           poi.type === 'fuel' ? 'bg-amber-500 text-white' : 'bg-gray-500 text-white'
         }">${
           poi.type === 'hospital' ? '🏥' :
           poi.type === 'police' ? '👮' :
           poi.type === 'fuel' ? '⛽' : '📍'
         }</div>`,
         iconSize: [24, 24],
         iconAnchor: [12, 12]
       });
       
       const marker = L.marker([poi.lat, poi.lon], { icon: poiIcon })
         .addTo(map)
         .bindPopup(poi.name);
       poiMarkersRef.current.push(marker);
     });
   }, [startCoords, endCoords, startName, endName, routeCoordinates, alternativeRoutes, selectedAlternativeIndex, onSelectAlternative, pois, romaniaCenter, boundsPadding]);
  
  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <div ref={mapDivRef} className="w-full h-full min-h-[300px]" style={{ height: "100%", minHeight: "300px" }} />
    </div>
  );
};
