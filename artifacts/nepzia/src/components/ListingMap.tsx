import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCityCoords } from "@/hooks/useGeolocation";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 13); }, [center]);
  return null;
}

interface ListingMapProps {
  city: string;
  title: string;
}

export function ListingMap({ city, title }: ListingMapProps) {
  const coords = getCityCoords(city);
  if (!coords) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: 220 }}>
      <MapContainer center={coords} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <RecenterMap center={coords} />
        <Marker position={coords}>
          <Popup className="text-sm font-medium">{title} — {city}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
