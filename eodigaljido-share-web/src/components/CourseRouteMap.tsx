import { useEffect, useRef } from 'react';
import { loadKakaoMaps } from '../utils/loadKakaoMaps';
import { fetchDrivingRoutePath } from '../utils/kakaoDirections';
import type { GeoPoint } from '../utils/geocode';

type CourseRouteMapProps = {
  points: GeoPoint[];
  className?: string;
  onReady?: () => void;
  onError?: () => void;
};

export function CourseRouteMap({ points, className = '', onReady, onError }: CourseRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<Array<kakao.maps.Marker | kakao.maps.Polyline>>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || points.length === 0) return;

    let cancelled = false;

    void (async () => {
      try {
        await loadKakaoMaps();
        if (cancelled) return;

        const roadPath = await fetchDrivingRoutePath(points);
        if (cancelled) return;

        overlaysRef.current.forEach((o) => o.setMap(null));
        overlaysRef.current = [];
        mapRef.current = null;

        const stopLatLngs = points.map((p) => new kakao.maps.LatLng(p.lat, p.lng));
        const linePath =
          roadPath?.map((p) => new kakao.maps.LatLng(p.lat, p.lng)) ?? stopLatLngs;

        const map = new kakao.maps.Map(el, {
          center: stopLatLngs[0],
          level: 8,
        });
        mapRef.current = map;

        points.forEach((p, i) => {
          const isStart = i === 0;
          const isEnd = i === points.length - 1;
          const title = p.label ?? (isStart ? '출발' : isEnd ? '도착' : `경유 ${i + 1}`);
          const marker = new kakao.maps.Marker({
            map,
            position: stopLatLngs[i],
            title,
          });
          overlaysRef.current.push(marker);
        });

        if (linePath.length >= 2) {
          const line = new kakao.maps.Polyline({
            map,
            path: linePath,
            strokeWeight: 5,
            strokeColor: '#2563EB',
            strokeOpacity: 0.9,
            strokeStyle: 'solid',
          });
          overlaysRef.current.push(line);
        }

        const bounds = new kakao.maps.LatLngBounds();
        linePath.forEach((ll) => bounds.extend(ll));
        map.setBounds(bounds);
        onReady?.();
      } catch {
        if (!cancelled) onError?.();
      }
    })();

    return () => {
      cancelled = true;
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current = [];
      mapRef.current = null;
    };
  }, [points, onReady, onError]);

  if (points.length === 0) {
    return null;
  }

  return (
    <div className={`course-kakao-map relative h-full min-h-[220px] w-full ${className}`}>
      <div ref={containerRef} className="h-full w-full" aria-label="코스 경로 지도" />
    </div>
  );
}
