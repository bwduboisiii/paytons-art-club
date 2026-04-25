'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import { createClient } from '@/lib/supabase/client';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirmed: () => void;
  title?: string;
  subtitle?: string;
}

/**
 * v19: Password confirmation modal. Used to gate billing actions
 * (subscribe / cancel / open billing portal) so a kid can't accidentally
 * (or intentionally) trigger purchases or cancellations from a logged-in
 * parent's session.
 *
 * Verifies the password by calling supabase.auth.signInWithPassword against
 * the current user's email — succeeds = correct password.
 */
export default function PasswordConfirm({
  open,
  onClose,
  onConfirmed,
  title = 'Enter your password',
  subtitle = "Just double-checking it's you.",
}: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Not signed in');
      // Re-verify by calling sign in with current email + entered password.
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (authError) throw new Error("That password doesn't look right.");
      // Success — close modal and call onConfirmed
      setPassword('');
      onClose();
      onConfirmed();
    } catch (e: any) {
      setError(e?.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  }

  function handleCancel() {
    setPassword('');
    setError(null);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center px-6"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 18 }}
            className="card-cozy p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🔒</div>
              <h2 className="heading-3 mb-1">{title}</h2>
              <p className="text-ink-700 text-sm">{subtitle}</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-3">
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-4 border-cream-200 bg-cream-50 focus:border-coral-400 outline-none text-ink-900"
                placeholder="Your password"
                autoComplete="current-password"
              />

              {error && (
                <p className="text-coral-600 text-sm font-bold text-center">
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleCancel}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={verifying || password.length === 0}
                >
                  {verifying ? 'Checking…' : 'Confirm'}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
