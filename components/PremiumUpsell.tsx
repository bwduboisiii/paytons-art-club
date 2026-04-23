'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from './Button';
import Companion from './Companion';

interface Props {
  worldName: string;
  /** Optional: the world's icon/emoji */
  worldIcon?: string;
  /** If true, parent is currently on a trial */
  hasActiveTrial?: boolean;
}

/**
 * Upsell screen shown to kids when they try to enter a premium world
 * without an active subscription. Kid-friendly tone, no hard sell.
 * Actual subscription is started from parent dashboard (math-gated).
 */
export default function PremiumUpsell({
  worldName,
  worldIcon = '⭐',
  hasActiveTrial,
}: Props) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="card-cozy p-8 md:p-12 max-w-lg w-full text-center">
        <div className="flex justify-center gap-2 mb-4">
          <Companion character="unicorn" mood="idle" size={80} />
          <Companion character="dragon" mood="idle" size={80} />
        </div>
        <div className="text-6xl mb-3">{worldIcon}</div>
        <h1 className="heading-1 mb-2">
          {worldName} is a bonus world!
        </h1>
        <p className="text-ink-700 mb-6">
          {hasActiveTrial
            ? "You're on a free trial but your subscription isn't fully active yet. Ask a grown-up to check!"
            : "Ask a grown-up to unlock all the bonus worlds for you!"}
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/parent">
            <Button variant="primary" size="lg" className="w-full">
              Take me to a grown-up 🔒
            </Button>
          </Link>
          <Link href="/app">
            <Button variant="ghost" size="md" className="w-full">
              ← Back home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
