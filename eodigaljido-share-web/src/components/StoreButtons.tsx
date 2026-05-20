import { env } from '../config/env';
import { SecondaryButton } from './SecondaryButton';

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function StoreButtons() {
  const showAppStore = Boolean(env.appStoreUrl) && isIos();

  return (
    <div className="flex flex-col gap-2">
      <SecondaryButton onClick={() => window.open(env.playStoreUrl, '_blank', 'noopener')}>
        Google Play에서 받기
      </SecondaryButton>
      {showAppStore && (
        <SecondaryButton onClick={() => window.open(env.appStoreUrl, '_blank', 'noopener')}>
          App Store에서 받기
        </SecondaryButton>
      )}
    </div>
  );
}
