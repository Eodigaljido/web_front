/** 지도 컨테이너가 레이아웃된 뒤 카카오맵 초기화 (0×0 크기 방지) */
export async function waitForMapContainer(el: HTMLElement, maxMs = 3000): Promise<void> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (el.offsetWidth > 0 && el.offsetHeight > 0) return;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}

export function fitKakaoMapToPath(map: kakao.maps.Map, path: kakao.maps.LatLng[]): void {
  if (path.length === 0) return;

  if (path.length === 1) {
    map.setCenter(path[0]);
    map.setLevel(8);
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

  kakao.maps.event.trigger(map, 'resize');
}
