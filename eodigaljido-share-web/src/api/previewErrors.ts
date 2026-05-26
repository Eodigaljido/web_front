import axios from 'axios';

/** preview API: 비로그인 허용 실패(401/403/404) — 랜딩 폴백 */
export function isPreviewUnavailable(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 401 || status === 403 || status === 404;
}
