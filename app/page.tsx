import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/Button';
import Companion from '@/components/Companion';
import Sparkles from '@/components/Sparkles';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      <Sparkles count={20} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Payton's Art Club"
            width={56}
            height={56}
            className="rounded-2xl"
            priority
          />
          <span className="font-display font-bold text-xl text-ink-900 hidden sm:inline">
            Payton's Art Club
          </span>
        </div>
        <Link href="/login">
          <Button variant="ghost" size="sm">Parent Login</Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-5xl grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            {/* Logo as visual headline on small screens */}
            <div className="md:hidden mb-6 flex justify-center">
              <Image
                src="/logo.png"
                alt="Payton's Art Club"
                width={200}
                height={200}
                priority
              />
            </div>
            <h1 className="heading-1 mb-6">
              A cozy drawing club
              <br />
              <span className="text-coral-500">just for kids.</span>
            </h1>
            <p className="text-lg md:text-xl text-ink-700 mb-8 leading-relaxed">
              Short, guided art lessons with a friendly companion.
              Kids learn to draw step-by-step, then remix their creations
              with stickers and colors. No grades. No pressure. Just fun.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/login?mode=signup">
                <Button variant="primary" size="xl">Start Drawing ✨</Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="xl">I Have an Account</Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-ink-500">
              Free to play • Designed for ages 5–10 • Works on iPad
            </p>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-sparkle-300 rounded-blob opacity-40 animate-float" />
            {/* Logo on desktop hero */}
            <div className="relative hidden md:block">
              <Image
                src="/logo.png"
                alt="Payton's Art Club"
                width={400}
                height={400}
                priority
              />
            </div>
            {/* Companion characters on smaller screens */}
            <div className="relative flex gap-4 items-end md:hidden">
              <div className="mt-8"><Companion character="bunny" mood="happy" size={100} /></div>
              <Companion character="kitty" mood="cheering" size={120} />
              <div className="mt-12"><Companion character="fox" mood="happy" size={90} /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-12 bg-cream-100/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { icon: '🖍️', title: 'Guided Lessons', desc: 'Short step-by-step drawings. Perfect for little hands.' },
            { icon: '✨', title: 'Remix & Play', desc: 'Add stickers, colors, and wild ideas to every artwork.' },
            { icon: '🏡', title: 'Cozy & Safe', desc: 'No ads, no chat, no strangers. Parent-managed.' },
          ].map(f => (
            <div key={f.title} className="card-cozy p-6 text-center">
              <div className="text-5xl mb-3">{f.icon}</div>
              <h3 className="heading-3 mb-2">{f.title}</h3>
              <p className="text-ink-700">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 text-center py-6 text-sm text-ink-500">
        Made with 💛 for little artists everywhere
      </footer>
    </main>
  );
}
