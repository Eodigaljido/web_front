import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Map } from 'lucide-react';
import { AppShell } from './AppShell';
import { PrimaryButton } from './PrimaryButton';

type NotFoundContentProps = {
  message?: string;
  showOg?: boolean;
};

export function NotFoundContent({
  message = '페이지를 찾을 수 없어요',
  showOg = true,
}: NotFoundContentProps) {
  return (
    <AppShell>
      {showOg && (
        <Helmet>
          <title>404 | 어디갈지도</title>
          <meta property="og:title" content="404 | 어디갈지도" />
        </Helmet>
      )}
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <Map className="h-16 w-16 text-ink-muted" aria-hidden />
        <p className="text-lg font-semibold text-ink-primary">{message}</p>
        <Link to="/" className="w-full max-w-xs">
          <PrimaryButton>홈으로</PrimaryButton>
        </Link>
      </div>
    </AppShell>
  );
}
