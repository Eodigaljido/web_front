import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const kakaoRestKey = env.VITE_KAKAO_REST_API_KEY || env.VITE_KAKAO_MAP_APP_KEY;

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        '/api': { target: 'http://3.36.85.213:8080', changeOrigin: true },
        '/kakao-api': {
          target: 'https://dapi.kakao.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/kakao-api/, ''),
          headers: kakaoRestKey ? { Authorization: `KakaoAK ${kakaoRestKey}` } : {},
        },
      },
    },
    preview: { port: 4174 },
  };
});
