import { env } from '../config/env';

let loadPromise: Promise<void> | null = null;

export function loadKakaoMaps(): Promise<void> {
  const appKey = env.kakaoMapAppKey;
  if (!appKey) {
    return Promise.reject(new Error('Kakao Map API key is not configured'));
  }

  if (typeof kakao !== 'undefined' && kakao.maps) {
    return new Promise((resolve) => {
      kakao.maps.load(resolve);
    });
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.onload = () => {
      if (typeof kakao === 'undefined' || !kakao.maps?.load) {
        loadPromise = null;
        reject(new Error('Kakao Maps SDK unavailable'));
        return;
      }
      kakao.maps.load(() => resolve());
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Kakao Maps SDK script'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
