'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'sparkle' | 'meadow' | 'berry';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-coral-500 hover:bg-coral-400 text-white shadow-chunkyCoral active:shadow-none active:translate-y-[6px]',
  secondary: 'bg-cream-100 hover:bg-cream-200 text-ink-900 shadow-chunky active:shadow-none active:translate-y-[6px]',
  ghost: 'bg-transparent hover:bg-cream-100 text-ink-700',
  sparkle: 'bg-sparkle-400 hover:bg-sparkle-300 text-ink-900 shadow-chunky active:shadow-none active:translate-y-[6px]',
  meadow: 'bg-meadow-400 hover:bg-meadow-300 text-ink-900 shadow-chunky active:shadow-none active:translate-y-[6px]',
  berry: 'bg-berry-400 hover:bg-berry-300 text-white shadow-chunky active:shadow-none active:translate-y-[6px]',
};

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-base rounded-2xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
  xl: 'px-10 py-5 text-2xl rounded-squircle',
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', className, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={clsx(
        'font-display font-bold tracking-wide transition-all duration-100',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

export default Button;
