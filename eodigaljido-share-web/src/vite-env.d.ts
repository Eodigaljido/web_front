/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SHARE_SITE_URL: string;
  readonly VITE_APP_SCHEME: string;
  readonly VITE_PLAY_STORE_URL: string;
  readonly VITE_APP_STORE_URL: string;
  readonly VITE_OG_IMAGE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
