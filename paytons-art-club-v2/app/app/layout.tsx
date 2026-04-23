import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // If the user has no kids yet, send them to onboarding
  const { data: kids } = await supabase
    .from('kids')
    .select('id')
    .eq('parent_id', user.id)
    .limit(1);

  if (!kids || kids.length === 0) {
    redirect('/onboarding');
  }

  return <>{children}</>;
}
