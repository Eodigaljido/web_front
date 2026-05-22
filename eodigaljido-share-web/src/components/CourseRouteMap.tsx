import { useEffect, useRef } from 'react';
import { loadKakaoMaps } from '../utils/loadKakaoMaps';
import type { GeoPoint } from '../utils/geocode';

type CourseRouteMapProps = {
  points: GeoPoint[];
  className?: string;
};

export function CourseRouteMap({ points, className = '' }: CourseRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<Array<kakao.maps.Marker | kakao.maps.Polyline>>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || points.length === 0) return;

    let cancelled = false;

    void loadKakaoMaps()
      .then(() => {
        if (cancelled) return;

        overlaysRef.current.forEach((o) => o.setMap(null));
        overlaysRef.current = [];

        if (mapRef.current) {
          mapRef.current = null;
        }

        const path = points.map((p) => new kakao.maps.LatLng(p.lat, p.lng));
        const map = new kakao.maps.Map(el, {
          center: path[0],
          level: 8,
        });
        mapRef.current = map;

        points.forEach((p, i) => {
          const isStart = i === 0;
          const isEnd = i === points.length - 1;
          const title = p.label ?? (isStart ? '출발' : isEnd ? '도착' : `경유 ${i + 1}`);
          const marker = new kakao.maps.Marker({
            map,
            position: path[i],
            title,
          });
          overlaysRef.current.push(marker);
        });

        if (path.length >= 2) {
          const line = new kakao.maps.Polyline({
            map,
            path,
            strokeWeight: 5,
            strokeColor: '#2563EB',
            strokeOpacity: 0.9,
            strokeStyle: 'solid',
          });
          overlaysRef.current.push(line);
        }

        const bounds = new kakao.maps.LatLngBounds();
        path.forEach((ll) => bounds.extend(ll));
        map.setBounds(bounds);
      })
      .catch(() => {
        /* 상위에서 mapFailed 처리 */
      });

    return () => {
      cancelled = true;
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current = [];
      mapRef.current = null;
    };
  }, [points]);

  if (points.length === 0) {
    return null;
  }

  return (
    <div className={`course-kakao-map relative h-full min-h-[220px] w-full ${className}`}>
      <div ref={containerRef} className="h-full w-full" aria-label="코스 경로 지도" />
    </div>
  );
}
