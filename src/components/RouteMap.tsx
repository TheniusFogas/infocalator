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

interface RouteMapProps {
  startCoords?: [number, number];
  endCoords?: [number, number];
  startName?: string;
  endName?: string;
  routeCoordinates?: [number, number][];
}

export const RouteMap = ({ 
  startCoords, 
  endCoords, 
  startName = "Plecare", 
  endName = "Destinație",
  routeCoordinates = []
}: RouteMapProps) => {
  const romaniaCenter: [number, number] = [45.9432, 24.9668];
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

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

    if (routeCoordinates.length > 0) {
      routeLineRef.current = L.polyline(routeCoordinates, {
        color: "hsl(217 91% 60%)",
        weight: 5,
        opacity: 0.8,
      }).addTo(map);

      const bounds = L.latLngBounds(routeCoordinates.map((c) => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: boundsPadding });
      return;
    }

    if (fitCoords.length >= 2) {
      const bounds = L.latLngBounds(fitCoords.map((c) => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: boundsPadding });
      return;
    }

    // Default view
    map.setView(romaniaCenter, 7);
  }, [startCoords, endCoords, startName, endName, routeCoordinates, romaniaCenter, boundsPadding]);
  
  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <div ref={mapDivRef} className="w-full h-full min-h-[300px]" style={{ height: "100%", minHeight: "300px" }} />
    </div>
  );
};
