import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { MapPin, Users } from 'lucide-react';
import { fetchCollaborativePreview } from '../api/courses';
import { AppShell } from '../components/AppShell';
import { PrimaryButton } from '../components/PrimaryButton';
import { ShareLinkFallback } from '../components/ShareLinkFallback';
import { Skeleton } from '../components/Skeleton';
import { StoreButtons } from '../components/StoreButtons';
import { env } from '../config/env';
import type { CoursePreview } from '../types/course';
import { openInApp } from '../utils/openInApp';

type PageState =
  | { status: 'loading' }
  | { status: 'success'; course: CoursePreview }
  | { status: 'invite_only' }
  | { status: 'error' };

const STEPS = [
  '앱을 설치하거나 이미 설치되어 있다면 열어 주세요.',
  '이 링크로 공동 루트 편집 화면에 참여할 수 있어요.',
  '로그인 후 초대를 수락하면 친구와 함께 루트를 수정할 수 있어요.',
] as const;

export function CollaborativeSharePage() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const [state, setState] = useState<PageState>({ status: 'loading' });

  const load = useCallback(async () => {
    const id = courseId.trim();
    if (!id) {
      setState({ status: 'invite_only' });
      return;
    }
    setState({ status: 'loading' });
    try {
      const course = await fetchCollaborativePreview(id);
      if (course) {
        setState({ status: 'success', course });
        return;
      }
      setState({ status: 'invite_only' });
    } catch {
      setState({ status: 'error' });
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const appPath = `routes/collaborative/${courseId}` as const;
  const canonicalPath = `/routes/collaborative/${encodeURIComponent(courseId)}`;

  if (state.status === 'error' || state.status === 'invite_only') {
    return (
      <ShareLinkFallback
        title="공동 루트 편집 초대"
        pageTitle="공동 루트 편집 초대"
        description="어디갈지도 앱에서 이 링크를 열면 공동 편집에 참여할 수 있어요."
        appPath={appPath}
        appButtonLabel="앱에서 공동 편집 참여"
        canonicalPath={canonicalPath}
      />
    );
  }

  if (state.status === 'loading') {
    return (
      <AppShell hideFooter>
        <div className="space-y-4 py-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-16 w-full" />
        </div>
      </AppShell>
    );
  }

  const { course } = state;
  const canonicalUrl = `${env.shareSiteUrl.replace(/\/$/, '')}${canonicalPath}`;
  const ogDescription = [course.departure, course.arrival].filter(Boolean).join(' → ');

  return (
    <AppShell hideFooter>
      <Helmet>
        <title>{course.title} · 공동 편집 | 어디갈지도</title>
        <meta property="og:title" content={`${course.title} · 공동 편집 | 어디갈지도`} />
        <meta
          property="og:description"
          content={ogDescription || '앱에서 공동 루트 편집에 참여해 보세요.'}
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={course.thumbnailUrl || env.ogImageUrl} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="space-y-6 pb-28">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white">
            <Users className="h-6 w-6" aria-hidden />
          </span>
          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
              공동 루트 초대
            </p>
            <h1 className="text-2xl font-bold text-ink-primary">{course.title}</h1>
          </div>
        </div>

        {(course.departure || course.arrival) && (
          <div className="rounded-2xl border border-border-soft bg-surface-card p-4 text-sm text-ink-secondary shadow-sm">
            {course.departure && (
              <p className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-brand-500" aria-hidden />
                출발 {course.departure}
              </p>
            )}
            {course.arrival && <p className="mt-1">도착 {course.arrival}</p>}
          </div>
        )}

        <ol className="space-y-3 text-left text-sm text-ink-secondary">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border-soft bg-white/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-md flex-col gap-2 md:max-w-lg">
          <PrimaryButton onClick={() => openInApp(appPath)}>
            앱에서 공동 편집 참여
          </PrimaryButton>
          <StoreButtons />
        </div>
      </div>
    </AppShell>
  );
}
