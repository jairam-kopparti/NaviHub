import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <main className="relative min-h-screen">
        {/* Background image */}
        <Image src="/hero.jpg" alt="Hero" fill className="object-cover opacity-80" priority />

        {/* subtle overlay for contrast */}
        <div className="absolute inset-0 bg-black/10" />

        {/* Content, vertically centered, aligned left */}
        <div className="relative z-10 flex items-center min-h-screen">
          <div className="max-w-3xl px-8 sm:px-12">
            <h1
              className="text-[var(--primary-text)]"
              style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(64px, 8vw, 120px)', lineHeight: 1.02, margin: 0 }}
            >
              <span className="block">Building Bridges,</span>
              <span className="block">Not Walls</span>
            </h1>

            <p className="mt-6 text-[var(--primary-text)]/90 text-[clamp(18px,2.2vw,28px)] max-w-2xl">
              A centralized hub for trusted community resources, programs, and organizations across New York City.
            </p>

            <Link
              href="/resources"
              className="inline-block mt-8 rounded-full px-6 py-3 border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-[rgba(31,31,31,0.08)]"
            >
              Browse Community Resources
            </Link>
          </div>
        </div>
      </main>

      {/* Section 1: Intro + Image + Stats */}
      <section className="py-16 bg-[var(--bg)]">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="mt-4 text-[var(--primary-text)]/90 max-w-xl">
              NaviHub is dedicated to helping residents easily find local support and services. We bring together trusted non-profits, community programs, and support organizations in one place, making it simpler for New Yorkers to get the help they need.
            </p>

            {/* Statistics */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="stat-item">
                <div className="stat-number">100+</div>
                <div className="stat-label">Community Resources</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Local Organizations</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">5</div>
                <div className="stat-label">Boroughs served</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">5000+</div>
                <div className="stat-label">Residents supported</div>
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="rounded-2xl overflow-hidden">
              <Image src="/hands.jpg" alt="Community hands" width={1200} height={800} className="object-cover w-full h-72 sm:h-96" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Spacer (placeholder) */}
      <section className="py-24 bg-[#FFFFFA]" aria-hidden="true">
        <div className="max-w-6xl mx-auto px-6">
          {/* intentionally left blank for spacing */}
        </div>
      </section>

      {/* Section 3: Quote */}
      <section className="py-20 bg-[var(--bg)]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <blockquote className="text-[clamp(20px,2.2vw,28px)] italic font-semibold text-[var(--primary-text)]/95">
            “Having access to reliable community resources in one place makes a real difference for families across the city.”
          </blockquote>
          <cite className="mt-4 block text-sm text-[var(--secondary-text)]">— Community Partner, New York City</cite>
        </div>
      </section>

    </>
  );
}
