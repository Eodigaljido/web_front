import { Helmet } from 'react-helmet-async';
import { Smartphone } from 'lucide-react';
import { AppShell } from './AppShell';
import { PrimaryButton } from './PrimaryButton';
import { StoreButtons } from './StoreButtons';
import { env } from '../config/env';
import { openInApp, type AppPath } from '../utils/openInApp';

type ShareLinkFallbackProps = {
  title: string;
  description: string;
  appPath: AppPath;
  appButtonLabel: string;
  pageTitle?: string;
  canonicalPath: string;
};

export function ShareLinkFallback({
  title,
  description,
  appPath,
  appButtonLabel,
  pageTitle,
  canonicalPath,
}: ShareLinkFallbackProps) {
  const canonicalUrl = `${env.shareSiteUrl.replace(/\/$/, '')}${canonicalPath}`;
  const helmetTitle = pageTitle ?? title;

  return (
    <AppShell hideFooter>
      <Helmet>
        <title>{helmetTitle} | 어디갈지도</title>
        <meta property="og:title" content={`${helmetTitle} | 어디갈지도`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={env.ogImageUrl} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="flex flex-col items-center gap-6 py-10 text-center pb-28">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
          <Smartphone className="h-8 w-8 text-brand-500" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-bold text-ink-primary">{title}</h1>
          <p className="mt-3 text-sm text-ink-secondary">{description}</p>
        </div>
        <p className="text-xs text-ink-muted">
          앱을 설치한 뒤 같은 링크를 다시 열어 주세요.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border-soft bg-white/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-md flex-col gap-2 md:max-w-lg">
          <PrimaryButton onClick={() => openInApp(appPath)}>{appButtonLabel}</PrimaryButton>
          <StoreButtons />
        </div>
      </div>
    </AppShell>
  );
}
