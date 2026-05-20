import type { ReactNode } from 'react';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

type AppShellProps = {
  children: ReactNode;
  hideFooter?: boolean;
};

export function AppShell({ children, hideFooter = false }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6 pb-10 md:max-w-lg">
        {children}
      </main>
      {!hideFooter && <SiteFooter />}
    </div>
  );
}
