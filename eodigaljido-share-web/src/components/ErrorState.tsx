import { AlertCircle } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <AlertCircle className="h-12 w-12 text-ink-muted" aria-hidden />
      <p className="text-sm text-ink-secondary">{message}</p>
      {onRetry && (
        <PrimaryButton onClick={onRetry} className="max-w-xs">
          다시 시도
        </PrimaryButton>
      )}
    </div>
  );
}
