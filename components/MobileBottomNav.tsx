'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: number;
}

interface Props {
  unseenFriends?: number;
}

/**
 * Thumb-reachable bottom nav for mobile.
 * Safe-area-aware for iPhones with notches.
 */
export default function MobileBottomNav({ unseenFriends = 0 }: Props) {
  const pathname = usePathname() || '';

  const items: NavItem[] = [
    { href: '/app', icon: '🏠', label: 'Home' },
    { href: '/app/game', icon: '🎮', label: 'Play' },
    { href: '/app/friends', icon: '👯', label: 'Friends' },
    { href: '/app/gallery', icon: '🖼️', label: 'Art' },
    {
      href: '/parent',
      icon: '🔒',
      label: 'Parent',
      badge: unseenFriends,
    },
  ];

  return (
    <nav
      className={clsx(
        'fixed bottom-0 left-0 right-0 z-30',
        'bg-cream-50/95 backdrop-blur-md',
        'border-t-2 border-cream-200',
        'pb-[env(safe-area-inset-bottom)]'
      )}
    >
      <div className="flex items-stretch justify-around">
        {items.map((item) => {
          const active =
            item.href === '/app'
              ? pathname === '/app'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex-1 flex flex-col items-center gap-0.5 py-2 relative',
                'transition-transform active:scale-95',
                active ? 'text-coral-500' : 'text-ink-700'
              )}
            >
              <span className="text-2xl leading-none relative">
                {item.icon}
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-2.5 h-2.5 rounded-full bg-coral-500 ring-2 ring-cream-50" />
                )}
              </span>
              <span
                className={clsx(
                  'text-[10px] font-bold',
                  active && 'text-coral-500'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
