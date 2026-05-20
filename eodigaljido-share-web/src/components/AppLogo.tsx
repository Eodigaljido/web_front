import { assets } from '../config/assets';

type AppLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClass = {
  sm: 'h-9 w-9',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
} as const;

export function AppLogo({ size = 'sm', className = '' }: AppLogoProps) {
  return (
    <img
      src={assets.logo}
      alt="어디갈지도"
      className={`object-contain ${sizeClass[size]} ${className}`}
    />
  );
}
