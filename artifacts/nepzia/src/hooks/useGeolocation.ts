import { useState, useEffect } from "react";

export interface GeolocationState {
  lat: number | null;
  lng: number | null;
  city: string | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

const CITY_COORDS: Record<string, [number, number]> = {
  "Kathmandu": [27.7172, 85.3240],
  "Lalitpur": [27.6588, 85.3247],
  "Bhaktapur": [27.6710, 85.4298],
  "Pokhara": [28.2096, 83.9856],
  "Chitwan": [27.5291, 84.3542],
  "Butwal": [27.7006, 83.4532],
  "Dharan": [26.8065, 87.2846],
  "Biratnagar": [26.4525, 87.2718],
  "Nepalgunj": [28.0500, 81.6167],
  "Janakpur": [26.7288, 85.9233],
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearestCity(lat: number, lng: number): string | null {
  let minDist = Infinity;
  let nearest: string | null = null;
  for (const [city, [clat, clng]] of Object.entries(CITY_COORDS)) {
    const d = haversine(lat, lng, clat, clng);
    if (d < minDist) { minDist = d; nearest = city; }
  }
  return minDist <= 200 ? nearest : null;
}

export function getCityCoords(city: string): [number, number] | null {
  return CITY_COORDS[city] ?? null;
}

export function useGeolocation(auto = false) {
  const [state, setState] = useState<GeolocationState>({
    lat: null, lng: null, city: null, loading: false, error: null, permissionDenied: false,
  });

  const request = () => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: "Geolocation not supported", loading: false }));
      return;
    }
    setState(s => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const city = nearestCity(latitude, longitude);
        setState({ lat: latitude, lng: longitude, city, loading: false, error: null, permissionDenied: false });
      },
      (err) => {
        setState(s => ({
          ...s,
          loading: false,
          error: err.message,
          permissionDenied: err.code === GeolocationPositionError.PERMISSION_DENIED,
        }));
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  };

  useEffect(() => { if (auto) request(); }, [auto]);

  return { ...state, request };
}
