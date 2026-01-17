"use client"

import "../../styles/aboutus-styles.css"
import { Users, Search, Layers } from "lucide-react"

export default function AboutUs() {
  return (
    <>
      {/* HERO */}
      <section className="relative h-screen border-b border-(--border) overflow-hidden">
        <img
          src="/aboutus.jpg"
          alt="About NaviHub"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 flex items-center justify-center h-full text-center px-6">
          <h1 className="text-white text-5xl md:text-7xl font-bold tracking-tight">
            About NaviHub
          </h1>
        </div>
      </section>

      {/* OUR MISSION — NAVIEATS-INSPIRED */}
      <section className="border-b border-[var(--border)] bg-[#FFFFFA]">
        <div className="about-mission-wrapper">
          <h2 className="about-mission-heading">
            <span className="primary">Our</span>{" "}
            <span className="secondary">Mission</span>
          </h2>

          <div className="about-mission-divider" />

          <p className="about-mission-text">
            NaviHub exists to simplify access to community resources.
            We believe finding help should never feel overwhelming or
            confusing. By organizing essential services into one clear,
            accessible platform, NaviHub empowers individuals and
            communities to connect with the support they need — faster,
            easier, and with confidence.
          </p>
        </div>
      </section>


      {/* WHAT WE DO */}
      <section className="border-b border-[var(--border)] bg-[var(--muted)] py-24 px-6">
        <div className="about-section">
          <h2 className="about-section-heading text-center mb-8">
            <span className="primary">What</span> <span className="secondary">We Do</span>
          </h2>

          <div className="about-mission-divider" />

          <div className="what-we-do-grid">
            <div className="what-we-do-item text-center">
              <Search className="w-10 h-10 text-[var(--accent)] mx-auto" />
              <h4 className="mt-4">Centralize Resources</h4>
              <p className="about-section-text mt-2">
                We gather nonprofits, services, programs, and support systems into one searchable platform.
              </p>
            </div>

            <div className="what-we-do-item text-center">
              <Layers className="w-10 h-10 text-[var(--accent)] mx-auto" />
              <h4 className="mt-4">Organize by Need</h4>
              <p className="about-section-text mt-2">
                Resources are categorized clearly so users can find help without confusion or wasted time.
              </p>
            </div>

            <div className="what-we-do-item text-center">
              <Users className="w-10 h-10 text-[var(--accent)] mx-auto" />
              <h4 className="mt-4">Support Communities</h4>
              <p className="about-section-text mt-2">
                NaviHub is designed to strengthen communities by connecting people to the help they deserve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-[var(--border)] bg-white py-24 px-6">
        <div className="about-section text-center">
          <h2 className="about-section-heading mb-6">
            <span className="primary">How It</span> <span className="tertiary">Works</span>
          </h2>
          <div className="about-mission-divider" />

          <div className="how-it-works-list mx-auto mt-8">
            <div className="how-step">
              <div className="how-step-number">1</div>
              <div className="how-step-content">
                <h4>Find What You Need</h4>
                <p className="about-section-text">Search or browse by category to discover local services and programs that match your needs.</p>
              </div>
            </div>

            <div className="how-step">
              <div className="how-step-number">2</div>
              <div className="how-step-content">
                <h4>Review Details</h4>
                <p className="about-section-text">Each listing includes clear, concise information so you can quickly see eligibility, contact info, and next steps.</p>
              </div>
            </div>

            <div className="how-step">
              <div className="how-step-number">3</div>
              <div className="how-step-content">
                <h4>Connect & Get Help</h4>
                <p className="about-section-text">Reach out directly to the organization or program and take action with confidence.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 PLACEHOLDER */}
      <section className="border-b border-[var(--border)] bg-[var(--muted)] py-24 px-6">
        <h2 className="text-6xl font-bold text-center">
          Attributions
        </h2>
      </section>
    </>
  )
}