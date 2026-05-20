import { Helmet } from 'react-helmet-async';
import { MapPin, MessageCircle, Route } from 'lucide-react';
import { AppLogo } from '../components/AppLogo';
import { AppShell } from '../components/AppShell';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { env } from '../config/env';

const features = [
  { icon: Route, label: '공유 루트 탐색' },
  { icon: MapPin, label: '루트 제작·저장' },
  { icon: MessageCircle, label: '친구와 채팅' },
] as const;

export function HomePage() {
  return (
    <AppShell>
      <Helmet>
        <title>어디갈지도</title>
        <meta name="description" content="루트를 공유하고 친구와 함께 여행을 계획하세요." />
        <meta property="og:title" content="어디갈지도" />
        <meta
          property="og:description"
          content="루트를 공유하고 친구와 함께 여행을 계획하세요."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={env.ogImageUrl} />
      </Helmet>

      <section className="flex flex-col items-center gap-4 text-center">
        <AppLogo size="lg" />
        <h1 className="text-2xl font-bold text-ink-primary">어디갈지도</h1>
        <p className="text-sm text-ink-secondary">함께 만드는 루트, 함께 걷는 여행</p>
      </section>

      <section className="mt-8 grid gap-3">
        {features.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-border-soft bg-surface-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <Icon className="h-5 w-5 shrink-0 text-brand-500" aria-hidden />
            <span className="text-sm font-medium text-ink-primary">{label}</span>
          </div>
        ))}
      </section>

      <section className="mt-8 flex flex-col gap-3">
        <PrimaryButton onClick={() => window.open(env.playStoreUrl, '_blank', 'noopener')}>
          앱 다운로드
        </PrimaryButton>
        <SecondaryButton disabled>앱이 이미 있나요?</SecondaryButton>
        <p className="text-center text-xs text-ink-muted">
          공유 링크를 다시 열면 앱으로 이동할 수 있어요.
        </p>
      </section>
    </AppShell>
  );
}
