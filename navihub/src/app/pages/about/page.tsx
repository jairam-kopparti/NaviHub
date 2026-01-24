"use client"

import "../../styles/aboutus.css"
import { Users, Search, Layers } from "lucide-react"
import { useEffect, useRef } from "react"
import gsap from "gsap"
import ScrollTrigger from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export default function AboutUs() {
  const heroImageRef = useRef<HTMLImageElement>(null)
  const missionItemsRef = useRef<HTMLParagraphElement[]>([])
  const whatWeDoRef = useRef<HTMLDivElement[]>([])
  const howStepsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    // ===== STICKY BACKGROUND (FIXED POSITION) =====
    if (heroImageRef.current) {
      gsap.set(heroImageRef.current, {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        zIndex: -1,
      })
    }
    // ===== WHAT WE DO ITEMS FADE IN ANIMATION =====
    whatWeDoRef.current.forEach((item, index) => {
      gsap.from(item, {
        scrollTrigger: {
          trigger: ".what-we-do-grid",
          start: "top 75%",
          end: "top 25%",
          toggleActions: "play none none reverse",
          markers: false,
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        delay: index * 0.15,
        ease: "power2.out",
      })
    })

    // ===== MISSION ITEMS SLIDE DOWN ANIMATION =====
    missionItemsRef.current.forEach((item, index) => {
      gsap.from(item, {
        scrollTrigger: {
          trigger: ".mission-items-container",
          start: "top 80%",
          end: "top 20%",
          toggleActions: "play none none reverse",
          markers: false,
        },
        opacity: 0,
        y: -50,
        duration: 0.8,
        delay: index * 0.2,
        ease: "power2.out",
      })
    })

    // ===== HOW IT WORKS CIRCULAR SCROLL ANIMATION =====
    howStepsRef.current.forEach((step, index) => {
      gsap.from(step, {
        scrollTrigger: {
          trigger: ".how-it-works-list",
          start: "top 70%",
          end: "top 30%",
          toggleActions: "play none none reverse",
          markers: false,
        },
        opacity: 0,
        rotation: -20,
        scale: 0.8,
        duration: 0.8,
        delay: index * 0.15,
        ease: "back.out",
      })
    })

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  return (
    <>
      {/* HERO */}
      <section className="hero-section relative h-screen border-b border-(--border) overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={heroImageRef}
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

      {/* OUR MISSION */}
      <section className="border-b border-(--border) bg-[#FFFFFA]">
        <div className="about-mission-wrapper mission-items-container">
          <h2 className="about-mission-heading">
            <span className="primary">Our</span>{" "}
            <span className="secondary">Mission</span>
          </h2>

          <div className="about-mission-divider" />

          <p
            className="about-mission-text"
            ref={(el) => {
              if (el) missionItemsRef.current[0] = el
            }}
          >
            The mission of the community resource hub is to bring people and resources together in one clear, trusted space where everyone can easily find support, opportunities, and information that matters to them. The hub is designed to break down barriers by organizing local nonprofits, services, programs, and events in a simple and welcoming way, so community members do not feel overwhelmed or excluded. At its core, the site exists to make help more visible, connections stronger, and access more equal for everyone.
          </p>
          <p
            className="about-mission-text"
            ref={(el) => {
              if (el) missionItemsRef.current[1] = el
            }}
          >
            By centralizing resources and categorizing them by need, the hub empowers individuals to take control of their own journeys toward stability and growth. Whether someone is looking for food assistance, housing support, job training, or mental health services, they can quickly find what they need without confusion or frustration. The platform also fosters a sense of community by highlighting local organizations and encouraging collaboration among service providers.
          </p>
        </div>
      </section>


      {/* WHAT WE DO */}
      <section className="border-b border-(--border) bg-(--bg) py-24 px-6">
        <div className="about-section">
          <h2 className="about-section-heading text-center mb-8">
            <span className="primary">What</span> <span className="secondary">We Do</span>
          </h2>

          <div className="about-mission-divider" />

          <div className="what-we-do-grid">
            <div
              className="what-we-do-item text-center"
              ref={(el) => {
                if (el) whatWeDoRef.current[0] = el
              }}
            >
              <Search className="w-10 h-10 text-(--accent) mx-auto" />
              <h4 className="mt-4">Centralize Resources</h4>
              <p className="about-section-text mt-2">
                We centralize resources by bringing local organizations, services, programs, and events into one reliable hub where community members can easily find what they need in one place.
              </p>
            </div>

            <div
              className="what-we-do-item text-center"
              ref={(el) => {
                if (el) whatWeDoRef.current[1] = el
              }}
            >
              <Layers className="w-10 h-10 text-(--accent) mx-auto" />
              <h4 className="mt-4">Organize by Need</h4>
              <p className="about-section-text mt-2">
                We organize by need by grouping resources into clear, purposeful categories that help people quickly identify relevant support without feeling overwhelmed.
              </p>
            </div>

            <div
              className="what-we-do-item text-center"
              ref={(el) => {
                if (el) whatWeDoRef.current[2] = el
              }}
            >
              <Users className="w-10 h-10 text-(--accent) mx-auto" />
              <h4 className="mt-4">Support Communities</h4>
              <p className="about-section-text mt-2">
                We support communities by connecting residents with trusted organizations, encouraging involvement, and strengthening access to support that helps communities grow and thrive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-(--border) bg-white py-24 px-6">
        <div className="about-section text-center">
          <h2 className="about-section-heading mb-6">
            <span className="primary">How It</span> <span className="tertiary">Works</span>
          </h2>
          <div className="about-mission-divider" />

          <div className="how-it-works-list mx-auto mt-8">
            <div
              className="how-step"
              ref={(el) => {
                if (el) howStepsRef.current[0] = el
              }}
            >
              <div className="how-step-number">1</div>
              <div className="how-step-content">
                <h4>Find What You Need</h4>
                <p className="about-section-text">Search or browse by category to discover local services and programs that match your needs.</p>
              </div>
            </div>

            <div
              className="how-step"
              ref={(el) => {
                if (el) howStepsRef.current[1] = el
              }}
            >
              <div className="how-step-number">2</div>
              <div className="how-step-content">
                <h4>Review Details</h4>
                <p className="about-section-text">Each listing includes clear, concise information so you can quickly see eligibility, contact info, and next steps.</p>
              </div>
            </div>

            <div
              className="how-step"
              ref={(el) => {
                if (el) howStepsRef.current[2] = el
              }}
            >
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
      <section className="border-b border-(--border) bg-(--bg) py-24 px-6">
        <h2 className="text-6xl font-bold text-center">
          Attributions
        </h2>
      </section>
    </>
  )
}