'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary. Catches any render/render-phase crash in a child
 * component and shows a friendly "something went wrong" card instead of
 * Next.js' default stark "Application error" white screen.
 *
 * Must be a class component — React error boundaries can't be functional.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // In a real production app, you'd send this to Sentry / LogRocket.
    // For now we log it so parents can see the stack in the devtools.
    // eslint-disable-next-line no-console
    console.error('Caught by ErrorBoundary:', error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/app';
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <main className="min-h-screen flex items-center justify-center px-6 py-12">
          <div className="card-cozy p-8 md:p-12 max-w-md text-center">
            <div className="text-6xl mb-4">🙈</div>
            <h1 className="heading-2 mb-3">Oops, something got tangled!</h1>
            <p className="text-ink-700 mb-6">
              Don't worry, your drawings are safe. Let's go back to the Art Club.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 rounded-2xl bg-cream-100 hover:bg-cream-200 text-ink-900 font-display font-bold shadow-chunky active:shadow-none active:translate-y-1 transition-all"
              >
                Try Again
              </button>
              <button
                onClick={this.handleHome}
                className="px-6 py-3 rounded-2xl bg-coral-500 hover:bg-coral-400 text-white font-display font-bold shadow-chunkyCoral active:shadow-none active:translate-y-1 transition-all"
              >
                Back to Art Club
              </button>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
