import { env } from '../config/env';

export type AppPath = `courses/public/${string}` | `friends/add/${string}`;

export function buildAppDeepLink(path: AppPath): string {
  return `${env.appScheme}://${path}`;
}

export function buildUniversalLink(path: AppPath): string {
  const base = env.shareSiteUrl.replace(/\/$/, '');
  return `${base}/${path}`;
}

function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

function buildAndroidIntent(path: AppPath): string {
  const universal = buildUniversalLink(path);
  const pkg = 'com.eodigaljido.app';
  return (
    `intent://${path}#Intent;scheme=${env.appScheme};package=${pkg};` +
    `S.browser_fallback_url=${encodeURIComponent(universal)};end`
  );
}

export function openInApp(path: AppPath): void {
  const universal = buildUniversalLink(path);

  if (isAndroid()) {
    window.location.href = buildAndroidIntent(path);
  } else {
    window.location.href = buildAppDeepLink(path);
  }

  setTimeout(() => {
    if (document.visibilityState === 'visible') {
      window.location.href = universal;
    }
  }, 1500);
}

export function getStoreUrl(): string {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIos && env.appStoreUrl) return env.appStoreUrl;
  return env.playStoreUrl;
}
