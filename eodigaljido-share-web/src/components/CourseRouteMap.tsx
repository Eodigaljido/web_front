import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import type { GeoPoint } from '../utils/geocode';

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

type CourseRouteMapProps = {
  points: GeoPoint[];
  className?: string;
};

export function CourseRouteMap({ points, className = '' }: CourseRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || points.length === 0) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(el, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const latLngs = points.map((p) => L.latLng(p.lat, p.lng));

    points.forEach((p, i) => {
      const isStart = i === 0;
      const isEnd = i === points.length - 1;
      const title = p.label ?? (isStart ? '출발' : isEnd ? '도착' : `경유 ${i + 1}`);
      L.marker([p.lat, p.lng]).addTo(map).bindPopup(title);
    });

    if (latLngs.length >= 2) {
      L.polyline(latLngs, {
        color: '#2563EB',
        weight: 4,
        opacity: 0.85,
      }).addTo(map);
    }

    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds.pad(0.15));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points]);

  if (points.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`z-0 h-full min-h-[220px] w-full ${className}`}
      aria-label="코스 경로 지도"
    />
  );
}
