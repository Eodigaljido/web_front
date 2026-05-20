import { env } from '../config/env';

export function SiteFooter() {
  return (
    <footer className="border-t border-border-soft bg-white px-4 py-6">
      <div className="mx-auto flex max-w-lg flex-col gap-2 text-center text-xs text-ink-muted">
        <div className="flex justify-center gap-4">
          <a
            href={env.playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:underline"
          >
            Google Play
          </a>
          {env.appStoreUrl && (
            <a
              href={env.appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline"
            >
              App Store
            </a>
          )}
        </div>
        <p>© Eodigaljido</p>
      </div>
    </footer>
  );
}
