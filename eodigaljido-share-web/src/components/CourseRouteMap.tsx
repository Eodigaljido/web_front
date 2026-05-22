import { useEffect, useRef } from 'react';
import { loadKakaoMaps } from '../utils/loadKakaoMaps';
import { fetchDrivingRoutePath } from '../utils/kakaoDirections';
import { fitKakaoMapToPath, waitForMapContainer } from '../utils/kakaoMapView';
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
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el || points.length === 0) return;

    let cancelled = false;

    void (async () => {
      try {
        await loadKakaoMaps();
        if (cancelled) return;

        await waitForMapContainer(el);
        if (cancelled) return;

        let roadPath: GeoPoint[] | null = null;
        try {
          roadPath = await fetchDrivingRoutePath(points);
        } catch {
          roadPath = null;
        }
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

        fitKakaoMapToPath(map, linePath);
        if (cancelled) return;

        onReadyRef.current?.();
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[CourseRouteMap]', err);
        }
        if (!cancelled) onErrorRef.current?.();
      }
    })();

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
