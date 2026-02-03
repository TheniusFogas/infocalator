import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
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

// Component to fit bounds when route changes
const FitBounds = ({ coords }: { coords: [number, number][] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (coords.length >= 2) {
      const bounds = L.latLngBounds(coords.map(c => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map]);
  
  return null;
};

export const RouteMap = ({ 
  startCoords, 
  endCoords, 
  startName = "Plecare", 
  endName = "Destinație",
  routeCoordinates = []
}: RouteMapProps) => {
  const romaniaCenter: [number, number] = [45.9432, 24.9668];
  const hasRoute = startCoords && endCoords;
  
  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <MapContainer
        center={romaniaCenter}
        zoom={7}
        className="w-full h-full min-h-[300px]"
        style={{ height: "100%", minHeight: "300px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {startCoords && (
          <Marker position={startCoords} icon={startIcon}>
            <Popup>{startName}</Popup>
          </Marker>
        )}
        
        {endCoords && (
          <Marker position={endCoords} icon={endIcon}>
            <Popup>{endName}</Popup>
          </Marker>
        )}
        
        {routeCoordinates.length > 0 && (
          <>
            <Polyline 
              positions={routeCoordinates} 
              color="#3b82f6" 
              weight={5}
              opacity={0.8}
            />
            <FitBounds coords={routeCoordinates} />
          </>
        )}
        
        {hasRoute && routeCoordinates.length === 0 && (
          <FitBounds coords={[startCoords, endCoords]} />
        )}
      </MapContainer>
    </div>
  );
};
