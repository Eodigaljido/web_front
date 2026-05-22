function requireEnv(key: keyof ImportMetaEnv, value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed && !import.meta.env.DEV) {
    throw new Error(`Missing required env: ${key}`);
  }
  return trimmed;
}

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.trim() ?? '',
  shareSiteUrl: requireEnv('VITE_SHARE_SITE_URL', import.meta.env.VITE_SHARE_SITE_URL),
  appScheme: requireEnv('VITE_APP_SCHEME', import.meta.env.VITE_APP_SCHEME),
  playStoreUrl: requireEnv('VITE_PLAY_STORE_URL', import.meta.env.VITE_PLAY_STORE_URL),
  appStoreUrl: import.meta.env.VITE_APP_STORE_URL?.trim() ?? '',
  ogImageUrl: requireEnv('VITE_OG_IMAGE_URL', import.meta.env.VITE_OG_IMAGE_URL),
  kakaoMapAppKey: import.meta.env.VITE_KAKAO_MAP_APP_KEY?.trim() ?? '',
};
