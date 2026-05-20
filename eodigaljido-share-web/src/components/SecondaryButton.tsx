import type { ButtonHTMLAttributes, ReactNode } from 'react';

type SecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function SecondaryButton({
  children,
  className = '',
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      type="button"
      className={`w-full rounded-xl border border-gray-300 bg-white py-3.5 text-sm font-medium text-ink-secondary active:opacity-90 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
