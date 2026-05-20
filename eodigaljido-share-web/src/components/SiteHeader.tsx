import { Link } from 'react-router-dom';
import { AppLogo } from './AppLogo';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border-soft bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <AppLogo size="sm" />
          <span className="text-base font-bold text-ink-primary">어디갈지도</span>
        </Link>
      </div>
    </header>
  );
}
