import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { Clock, MapPin, Star, Tag } from 'lucide-react';
import { fetchCoursePreview } from '../api/courses';
import { AppShell } from '../components/AppShell';
import { CourseRouteMap } from '../components/CourseRouteMap';
import { ShareLinkFallback } from '../components/ShareLinkFallback';
import { PrimaryButton } from '../components/PrimaryButton';
import { Skeleton } from '../components/Skeleton';
import { StoreButtons } from '../components/StoreButtons';
import { TagChip } from '../components/TagChip';
import { env } from '../config/env';
import type { CoursePreview } from '../types/course';
import { resolveCourseMapPoints } from '../utils/courseMapPoints';
import type { GeoPoint } from '../utils/geocode';
import { openInApp } from '../utils/openInApp';

type PageState =
  | { status: 'loading' }
  | { status: 'success'; course: CoursePreview }
  | { status: 'not_found' }
  | { status: 'error' };

function CourseSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-video w-full rounded-2xl" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

export function CourseSharePage() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const [state, setState] = useState<PageState>({ status: 'loading' });
  const [mapPoints, setMapPoints] = useState<GeoPoint[]>([]);
  const [mapResolved, setMapResolved] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [mapSdkFailed, setMapSdkFailed] = useState(false);

  const id = courseId.trim();
  const appPath = `courses/public/${courseId}` as const;
  const canonicalPath = `/courses/public/${encodeURIComponent(courseId)}`;

  const handleMapSdkError = useCallback(() => {
    setMapSdkFailed(true);
  }, []);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    void (async () => {
      try {
        const course = await fetchCoursePreview(id);
        if (cancelled) return;
        if (!course) {
          setState({ status: 'not_found' });
          return;
        }
        setState({ status: 'success', course });
      } catch {
        if (!cancelled) setState({ status: 'error' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (state.status !== 'success') return;

    const course = state.course;
    let cancelled = false;

    void resolveCourseMapPoints(course).then((points) => {
      if (cancelled) return;
      setMapPoints(points);
      setMapFailed(points.length === 0);
      setMapResolved(true);
      if (points.length === 0) setMapSdkFailed(false);
    });

    return () => {
      cancelled = true;
    };
  }, [state]);

  if (!id) {
    return (
      <ShareLinkFallback
        title="공유된 코스"
        description="미리보기를 불러오지 못했어요. 앱을 설치한 뒤 같은 링크를 다시 열어 주세요."
        appPath={appPath}
        appButtonLabel="앱에서 코스 보기"
        canonicalPath={canonicalPath}
      />
    );
  }

  if (state.status === 'not_found' || state.status === 'error') {
    return (
      <ShareLinkFallback
        title="공유된 코스"
        description="미리보기를 불러오지 못했어요. 앱을 설치한 뒤 같은 링크를 다시 열어 주세요."
        appPath={appPath}
        appButtonLabel="앱에서 코스 보기"
        canonicalPath={canonicalPath}
      />
    );
  }

  if (state.status === 'loading') {
    return (
      <AppShell hideFooter>
        <CourseSkeleton />
      </AppShell>
    );
  }

  const { course } = state;
  const mapLoading = !mapResolved;
  const canonicalUrl = `${env.shareSiteUrl.replace(/\/$/, '')}${canonicalPath}`;
  const ogDescription = [course.region, course.category, course.durationLabel]
    .filter(Boolean)
    .join(' · ');
  const visibleSteps = course.steps?.slice(0, 5) ?? [];
  const extraSteps = (course.steps?.length ?? 0) - visibleSteps.length;
  const showMap = mapPoints.length > 0 && !mapSdkFailed;
  const showThumbnail = Boolean(course.thumbnailUrl) && !showMap && !mapLoading;

  return (
    <AppShell hideFooter>
      <Helmet>
        <title>{course.title} | 어디갈지도</title>
        <meta property="og:title" content={`${course.title} | 어디갈지도`} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta
          property="og:image"
          content={course.thumbnailUrl || env.ogImageUrl}
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="space-y-4 pb-28">
        <div className="aspect-video overflow-hidden rounded-2xl border border-border-soft bg-surface-sheet shadow-sm">
          {showMap ? (
            <CourseRouteMap points={mapPoints} onError={handleMapSdkError} />
          ) : showThumbnail ? (
            <img
              src={course.thumbnailUrl!}
              alt={course.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : mapLoading ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-50 to-brand-100">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
                aria-hidden
              />
              <p className="text-xs text-ink-muted">지도 불러오는 중…</p>
            </div>
          ) : mapFailed || mapSdkFailed ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-50 to-brand-100 px-4 text-center">
              <MapPin className="h-10 w-10 text-brand-500" aria-hidden />
              <p className="text-xs text-ink-muted">
                {mapSdkFailed
                  ? '카카오맵을 불러오지 못했어요. 서버에서 npm run build 전 .env에 JavaScript 키가 있는지, 카카오 콘솔 Web 도메인 등록을 확인해 주세요.'
                  : '지도를 불러오지 못했어요. 앱에서 전체 경로를 확인해 주세요.'}
              </p>
            </div>
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center bg-gradient-to-br from-brand-100 to-brand-500/30">
              <MapPin className="h-12 w-12 text-brand-500" aria-hidden />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-ink-primary">{course.title}</h1>

        <div className="flex flex-wrap gap-3 text-sm text-ink-secondary">
          {course.region && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4 text-brand-500" aria-hidden />
              {course.region}
            </span>
          )}
          {course.category && (
            <span className="inline-flex items-center gap-1">
              <Tag className="h-4 w-4 text-brand-500" aria-hidden />
              {course.category}
            </span>
          )}
          {course.durationLabel && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4 text-brand-500" aria-hidden />
              {course.durationLabel}
            </span>
          )}
        </div>

        {(course.departure || course.arrival || visibleSteps.length > 0) && (
          <div className="rounded-2xl border border-border-soft bg-surface-card p-4 text-sm text-ink-secondary shadow-sm">
            {course.departure && <p>출발 {course.departure}</p>}
            {visibleSteps.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-ink-muted">
                {visibleSteps.map((step, i) => (
                  <li key={`${step.name}-${i}`}>경유 {i + 1}. {step.name}</li>
                ))}
                {extraSteps > 0 && <li>+ {extraSteps}곳 더</li>}
              </ul>
            )}
            {course.arrival && <p className={visibleSteps.length > 0 ? 'mt-1' : ''}>도착 {course.arrival}</p>}
          </div>
        )}

        {course.tags && course.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {course.tags.slice(0, 4).map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </div>
        )}

        {(course.saveCount != null || course.rating != null) && (
          <p className="flex items-center gap-1 text-sm text-ink-muted">
            <Star className="h-4 w-4 text-brand-500" aria-hidden />
            {course.saveCount != null && <span>저장 {course.saveCount}회</span>}
            {course.saveCount != null && course.rating != null && <span>·</span>}
            {course.rating != null && <span>별점 {course.rating}</span>}
          </p>
        )}

        {visibleSteps.some((s) => s.durationMinutes != null) && (
          <div className="rounded-2xl border border-border-soft bg-surface-sheet p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              체류 시간
            </p>
            <ol className="mt-3 space-y-2 text-sm text-ink-secondary">
              {visibleSteps.map((step, i) =>
                step.durationMinutes != null ? (
                  <li key={`${step.name}-${i}-dur`}>
                    {step.name} · {step.durationMinutes}분
                  </li>
                ) : null,
              )}
            </ol>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border-soft bg-white/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-md flex-col gap-2 md:max-w-lg">
          <PrimaryButton onClick={() => openInApp(appPath)}>앱에서 코스 보기</PrimaryButton>
          <StoreButtons />
        </div>
      </div>
    </AppShell>
  );
}
