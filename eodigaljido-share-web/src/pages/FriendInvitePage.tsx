import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { buildFallbackInvite, fetchFriendInvitePreview } from '../api/friends';
import { AppShell } from '../components/AppShell';
import { ErrorState } from '../components/ErrorState';
import { NotFoundContent } from '../components/NotFoundContent';
import { PrimaryButton } from '../components/PrimaryButton';
import { Skeleton } from '../components/Skeleton';
import { StoreButtons } from '../components/StoreButtons';
import { env } from '../config/env';
import type { FriendInvitePreview } from '../types/friend';
import { openInApp } from '../utils/openInApp';

const CODE_PATTERN = /^[A-Za-z0-9]{4,16}$/;

type PageState =
  | { status: 'loading' }
  | { status: 'success'; invite: FriendInvitePreview }
  | { status: 'not_found' }
  | { status: 'error' };

function getInitials(name: string): string {
  return name.trim().slice(0, 1) || '?';
}

export function FriendInvitePage() {
  const { friendCode = '' } = useParams<{ friendCode: string }>();
  const [state, setState] = useState<PageState>({ status: 'loading' });

  const load = useCallback(async () => {
    const code = friendCode.trim();
    if (!code || !CODE_PATTERN.test(code)) {
      setState({ status: 'not_found' });
      return;
    }
    setState({ status: 'loading' });
    try {
      const preview = await fetchFriendInvitePreview(code);
      setState({
        status: 'success',
        invite: preview ?? buildFallbackInvite(code),
      });
    } catch {
      setState({ status: 'error' });
    }
  }, [friendCode]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === 'not_found') {
    return <NotFoundContent message="유효하지 않은 초대 링크예요" showOg={false} />;
  }

  if (state.status === 'loading') {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-4 py-8">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-16 w-full" />
        </div>
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

  const { invite } = state;
  const code = invite.friendCode.toUpperCase();
  const appPath = `friends/add/${friendCode}` as const;
  const canonicalUrl = `${env.shareSiteUrl.replace(/\/$/, '')}/friends/add/${encodeURIComponent(friendCode)}`;

  const steps = [
    '앱을 설치하거나 이미 설치되어 있다면 열어 주세요.',
    '이 링크로 들어오면 친구 추가를 확인할 수 있어요.',
    '채팅과 루트 공유를 시작해 보세요.',
  ];

  return (
    <AppShell>
      <Helmet>
        <title>{invite.nickname}님의 친구 초대 | 어디갈지도</title>
        <meta
          property="og:title"
          content={`${invite.nickname}님의 친구 초대 | 어디갈지도`}
        />
        <meta property="og:description" content="링크를 열어 친구로 추가해 주세요." />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={env.ogImageUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="flex flex-col items-center gap-6 text-center">
        {invite.profileImageUrl ? (
          <img
            src={invite.profileImageUrl}
            alt={invite.nickname}
            className="h-20 w-20 rounded-full border-2 border-brand-100 object-cover"
            loading="lazy"
          />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-2xl font-bold text-white">
            {getInitials(invite.nickname)}
          </span>
        )}

        <div>
          <h1 className="text-2xl font-bold text-ink-primary">
            {invite.nickname}님이 친구 초대를 보냈어요
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">
            어디갈지도 앱에서 친구로 추가하고 루트와 채팅을 함께 이용해 보세요.
          </p>
        </div>

        <div className="w-full rounded-2xl bg-brand-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            친구 코드
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-[0.35em] text-brand-500">
            {code}
          </p>
        </div>

        <ol className="w-full space-y-3 text-left text-sm text-ink-secondary">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <div className="w-full space-y-2">
          <PrimaryButton onClick={() => openInApp(appPath)}>앱에서 친구 추가</PrimaryButton>
          <StoreButtons />
        </div>
      </div>
    </AppShell>
  );
}
