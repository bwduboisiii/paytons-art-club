'use client';

import { useState, Suspense, useEffect } from 'react';
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
  const [checkingSession, setCheckingSession] = useState(true);
  // v19: parent/child signup choice. If 'kid' is picked, show a friendly
  // redirect message asking to get a grown-up's help.
  const [signupRole, setSignupRole] = useState<'unknown' | 'parent' | 'kid'>('unknown');

  // v19: "Remember me" — if the user already has a session, take them straight
  // to the app instead of showing the empty login form. Supabase persists
  // sessions by default in localStorage, so this works automatically across
  // page reloads, browser restarts, etc.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const next = params.get('next') || '/app';
        router.replace(next);
      } else {
        setCheckingSession(false);
      }
    });
  }, [router, params]);

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

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Companion character="bunny" mood="thinking" size={80} />
          <p className="mt-4 text-ink-500">Checking…</p>
        </div>
      </main>
    );
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

          {/* v19: parent/kid gate before showing signup form */}
          {mode === 'signup' && signupRole === 'unknown' && (
            <div className="space-y-4">
              <p className="text-center font-bold text-ink-900 mb-2">
                Quick question first — who's signing up?
              </p>
              <button
                type="button"
                onClick={() => setSignupRole('parent')}
                className="w-full p-4 rounded-2xl border-4 border-coral-300 bg-coral-300/20 hover:bg-coral-300/40 text-left transition-colors"
              >
                <div className="font-display font-bold text-lg text-ink-900">👩 I'm a grown-up</div>
                <div className="text-sm text-ink-700">I'll set up an account and add my kid(s).</div>
              </button>
              <button
                type="button"
                onClick={() => setSignupRole('kid')}
                className="w-full p-4 rounded-2xl border-4 border-sparkle-300 bg-sparkle-300/20 hover:bg-sparkle-300/40 text-left transition-colors"
              >
                <div className="font-display font-bold text-lg text-ink-900">🧒 I'm a kid</div>
                <div className="text-sm text-ink-700">I want to draw!</div>
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-sm text-ink-500 hover:text-ink-900 mt-4"
              >
                Already have an account? Sign in →
              </button>
            </div>
          )}

          {/* v19: friendly redirect for kids */}
          {mode === 'signup' && signupRole === 'kid' && (
            <div className="text-center space-y-4">
              <div className="text-6xl mb-2">🐰💕</div>
              <p className="font-display font-bold text-lg text-ink-900">
                Yay! Welcome to Payton's Art Club!
              </p>
              <p className="text-ink-700">
                A grown-up needs to set up your account first. Show this screen to a parent or guardian and ask them to help you sign up — it only takes a minute!
              </p>
              <p className="text-sm text-ink-500">
                (For grown-ups: tap "I'm a grown-up" below to continue.)
              </p>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setSignupRole('unknown')}
              >
                ← Go back
              </Button>
            </div>
          )}

          {/* Original signup/login form — only shown to parents or for login */}
          {(mode === 'login' || (mode === 'signup' && signupRole === 'parent')) && (
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
          )}

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
