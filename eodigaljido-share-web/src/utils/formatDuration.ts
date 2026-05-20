export function formatDuration(minutes?: number): string | undefined {
  if (minutes == null || minutes <= 0) return undefined;
  if (minutes < 60) return `약 ${minutes}분`;
  const hours = Math.round(minutes / 60);
  return `약 ${hours}시간`;
}
