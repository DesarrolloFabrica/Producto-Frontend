import { useMemo, useState } from 'react';
import { UserRound } from 'lucide-react';
import { cn } from './tokens';
import { getGeneratedAvatarUrl } from '../../utils/generatedAvatar';

export type UserAvatarProps = {
  seed: string;
  alt?: string;
  title?: string;
  className?: string;
  /** Resolución de la imagen generada (px). */
  imageSize?: number;
  shape?: 'circle' | 'rounded';
};

export function UserAvatar({
  seed,
  alt = 'Avatar',
  title,
  className,
  imageSize = 64,
  shape = 'rounded',
}: UserAvatarProps) {
  const src = useMemo(() => getGeneratedAvatarUrl(seed, { size: imageSize }), [seed, imageSize]);
  const [failed, setFailed] = useState(false);

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';

  if (failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-slate-200 text-slate-500 ring-1 ring-slate-200/80',
          shapeClass,
          className,
        )}
        aria-hidden
      >
        <UserRound className="h-[55%] w-[55%] min-h-3 min-w-3" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      title={title}
      className={cn('object-cover ring-1 ring-slate-200/80', shapeClass, className)}
      onError={() => setFailed(true)}
      loading="lazy"
      decoding="async"
    />
  );
}
