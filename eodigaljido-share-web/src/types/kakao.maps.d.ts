/** Kakao Maps JS SDK (최소 타입) */
declare namespace kakao.maps.event {
  function trigger(target: kakao.maps.Map, type: string): void;
}

declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class LatLngBounds {
    extend(latlng: LatLng): void;
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setBounds(bounds: LatLngBounds): void;
    setCenter(latlng: LatLng): void;
    setLevel(level: number): void;
  }

  interface MarkerOptions {
    map?: Map;
    position: LatLng;
    title?: string;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
  }

  interface PolylineOptions {
    map?: Map;
    path: LatLng[];
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: string;
  }

  class Polyline {
    constructor(options: PolylineOptions);
    setMap(map: Map | null): void;
  }

  function load(callback: () => void): void;
}

declare const kakao: {
  maps: typeof kakao.maps;
};
