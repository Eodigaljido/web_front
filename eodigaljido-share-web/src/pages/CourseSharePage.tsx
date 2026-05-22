import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { Clock, MapPin, Star, Tag } from 'lucide-react';
import { fetchCoursePreview } from '../api/courses';
import { AppShell } from '../components/AppShell';
import { CourseRouteMap } from '../components/CourseRouteMap';
import { ErrorState } from '../components/ErrorState';
import { NotFoundContent } from '../components/NotFoundContent';
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
  const [mapLoading, setMapLoading] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [mapSdkFailed, setMapSdkFailed] = useState(false);

  const load = useCallback(async () => {
    if (!courseId) {
      setState({ status: 'not_found' });
      return;
    }
    setState({ status: 'loading' });
    setMapPoints([]);
    setMapFailed(false);
    try {
      const course = await fetchCoursePreview(courseId);
      if (!course) {
        setState({ status: 'not_found' });
        return;
      }
      setState({ status: 'success', course });
    } catch {
      setState({ status: 'error' });
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (state.status !== 'success') return;

    let cancelled = false;
    setMapLoading(true);
    setMapFailed(false);
    setMapSdkFailed(false);

    void resolveCourseMapPoints(state.course).then((points) => {
      if (!cancelled) {
        setMapPoints(points);
        setMapFailed(points.length === 0);
        setMapLoading(false);
        if (points.length === 0) setMapSdkFailed(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [state]);

  if (state.status === 'not_found') {
    return <NotFoundContent message="공유된 코스를 찾을 수 없어요" showOg={false} />;
  }

  if (state.status === 'loading') {
    return (
      <AppShell hideFooter>
        <CourseSkeleton />
      </AppShell>
    );
  }

  if (state.status === 'error') {
    return (
      <AppShell>
        <ErrorState message="잠시 후 다시 시도해 주세요" onRetry={() => void load()} />
      </AppShell>
    );
  }

  const { course } = state;
  const canonicalUrl = `${env.shareSiteUrl.replace(/\/$/, '')}/courses/public/${encodeURIComponent(courseId)}`;
  const ogDescription = [course.region, course.category, course.durationLabel]
    .filter(Boolean)
    .join(' · ');
  const appPath = `courses/public/${courseId}` as const;
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
            <CourseRouteMap
              points={mapPoints}
              onError={() => setMapSdkFailed(true)}
            />
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
                  ? '카카오맵을 불러오지 못했어요. JavaScript 키·도메인 등록을 확인해 주세요.'
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

        {(course.departure || course.arrival) && (
          <div className="rounded-2xl border border-border-soft bg-surface-card p-4 text-sm text-ink-secondary shadow-sm">
            {course.departure && <span>출발 {course.departure}</span>}
            {course.departure && course.arrival && <span className="mx-2 text-ink-muted">→</span>}
            {course.arrival && <span>도착 {course.arrival}</span>}
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

        {visibleSteps.length > 0 && (
          <div className="rounded-2xl border border-border-soft bg-surface-sheet p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              경로 미리보기
            </p>
            <ol className="mt-3 space-y-2 text-sm text-ink-secondary">
              {visibleSteps.map((step, i) => (
                <li key={`${step.name}-${i}`}>
                  {i + 1}. {step.name}
                  {step.durationMinutes != null && ` · ${step.durationMinutes}분`}
                </li>
              ))}
            </ol>
            {extraSteps > 0 && (
              <p className="mt-2 text-xs text-ink-muted">+ {extraSteps}곳 더</p>
            )}
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
