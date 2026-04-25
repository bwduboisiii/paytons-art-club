'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import { createClient } from '@/lib/supabase/client';

const MIN_PASSWORD_LENGTH = 8;

function humanizeAuthError(raw: string): string {
  const msg = raw.toLowerCase();
  if (msg.includes('invalid login credentials'))
    return "That email or password doesn't match. Please try again.";
  if (msg.includes('user already registered') || msg.includes('already exists'))
    return 'An account with this email already exists. Try signing in instead.';
  if (msg.includes('weak password') || msg.includes('password'))
    return 'That password is too short or too common. Try a longer one.';
  if (msg.includes('email') && msg.includes('invalid'))
    return 'That email address looks incorrect.';
  if (msg.includes('rate') || msg.includes('too many'))
    return 'Too many attempts. Please wait a minute and try again.';
  return raw;
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialMode = params.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split('@')[0],
            },
          },
        });
        if (error) throw error;
        router.push('/onboarding');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        const next = params.get('next') || '/app';
        router.push(next);
      }
    } catch (e: any) {
      setError(humanizeAuthError(e.message || 'Something went wrong'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex flex-col items-center justify-center mb-8"
        >
          <Image
            src="/logo.png"
            alt="Payton's Art Club"
            width={120}
            height={120}
            priority
          />
        </Link>

        <div className="card-cozy p-8">
          <div className="flex justify-center mb-4">
            <Companion character="bunny" mood="idle" size={80} />
          </div>
          <h1 className="heading-2 text-center mb-2">
            {mode === 'signup' ? 'Hi there, parent! 👋' : 'Welcome back!'}
          </h1>
          <p className="text-center text-ink-700 mb-6">
            {mode === 'signup'
              ? 'We just need a parent account to get started.'
              : 'Sign in to keep creating.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-bold text-ink-700 mb-1">
                  Your name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-4 border-cream-200 bg-cream-50 focus:border-coral-400 outline-none text-ink-900"
                  placeholder="Grown-up's name"
                  maxLength={50}
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-ink-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-4 border-cream-200 bg-cream-50 focus:border-coral-400 outline-none text-ink-900"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-ink-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={mode === 'signup' ? MIN_PASSWORD_LENGTH : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-4 border-cream-200 bg-cream-50 focus:border-coral-400 outline-none text-ink-900"
                placeholder={
                  mode === 'signup'
                    ? `At least ${MIN_PASSWORD_LENGTH} characters`
                    : 'Your password'
                }
                autoComplete={
                  mode === 'signup' ? 'new-password' : 'current-password'
                }
              />
            </div>

            {error && (
              <div className="bg-coral-300/30 border-2 border-coral-400 rounded-2xl p-3 text-sm text-coral-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading
                ? 'Loading...'
                : mode === 'signup'
                ? 'Create Account'
                : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-ink-700">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="font-bold text-coral-500 hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New here?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="font-bold text-coral-500 hover:underline"
                >
                  Create account
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
