type KakaoMapWithRelayout = kakao.maps.Map & { relayout?: () => void };

/** 타일·오버레이(마커·선) 좌표계 동기화 */
export function syncKakaoMapLayers(map: kakao.maps.Map): void {
  const m = map as KakaoMapWithRelayout;
  m.relayout?.();
  kakao.maps.event.trigger(map, 'resize');
}

export async function waitForMapContainer(el: HTMLElement, maxMs = 3000): Promise<void> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (el.offsetWidth > 0 && el.offsetHeight > 0) return;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}

/** 레이아웃 안정 후 relayout (aspect-video 등 크기 변동 대응) */
export function scheduleMapLayerSync(map: kakao.maps.Map): void {
  const run = () => syncKakaoMapLayers(map);
  requestAnimationFrame(() => requestAnimationFrame(run));
  window.setTimeout(run, 80);
  window.setTimeout(run, 320);
}

export function observeMapContainerResize(
  el: HTMLElement,
  map: kakao.maps.Map,
): () => void {
  if (typeof ResizeObserver === 'undefined') {
    return () => undefined;
  }
  const ro = new ResizeObserver(() => syncKakaoMapLayers(map));
  ro.observe(el);
  return () => ro.disconnect();
}

export function fitKakaoMapToPath(map: kakao.maps.Map, path: kakao.maps.LatLng[]): void {
  if (path.length === 0) return;

  if (path.length === 1) {
    map.setCenter(path[0]);
    map.setLevel(8);
    syncKakaoMapLayers(map);
    return;
  }

  const bounds = new kakao.maps.LatLngBounds();
  path.forEach((ll) => bounds.extend(ll));

  try {
    map.setBounds(bounds);
  } catch {
    map.setCenter(path[0]);
    map.setLevel(8);
  }

  syncKakaoMapLayers(map);
}
