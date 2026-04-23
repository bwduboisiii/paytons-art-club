'use client';

import Companion from './Companion';

interface Props {
  label?: string;
  size?: number;
}

/**
 * Full-page friendly loading indicator using the companion character.
 * Used anywhere a supabase call would otherwise leave the page blank.
 */
export default function LoadingSpinner({
  label = 'Loading...',
  size = 100,
}: Props) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 gap-4">
      <Companion character="bunny" mood="thinking" size={size} />
      <p className="text-ink-700 font-display font-bold">{label}</p>
    </div>
  );
}
