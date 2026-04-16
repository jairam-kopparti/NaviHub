"use client"
// @ts-expect-error - CSS side effect import
import "../../styles/aboutus.css"
import { Users, Search, Layers, Plus, Minus } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import gsap from "gsap"
import ScrollTrigger from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const FAQ_ITEMS = [
  {
    question: "What is NaviHub and who is it for?",
    answer: "NaviHub is a community resource hub designed for everyone—residents, families, newcomers, and anyone seeking local support. We centralize information about nonprofits, services, programs, and events to make help more accessible and less overwhelming for all community members."
  },
  {
    question: "How do I find resources that match my needs?",
    answer: "You can browse resources by category (such as food assistance, housing, employment, or health services) or use our search feature to find specific programs. Each listing includes detailed information about eligibility, contact details, and how to access the service."
  },
  {
    question: "Is NaviHub free to use?",
    answer: "Yes, NaviHub is completely free for all community members. Our mission is to break down barriers to access, so there are no fees or subscriptions required to search, browse, or connect with resources."
  },
  {
    question: "How can organizations get listed on NaviHub?",
    answer: "Organizations can submit their information through our 'Suggest a Resource' feature. We review submissions to ensure accuracy and relevance. If you represent a nonprofit, service provider, or community program, we encourage you to reach out and join our growing network."
  },
  {
    question: "How often is the resource information updated?",
    answer: "We work continuously to keep our listings accurate and up-to-date. Community members and organizations can flag outdated information, and our team regularly reviews and verifies resource details to maintain quality and reliability."
  },
  {
    question: "Can I save or bookmark resources for later?",
    answer: "Yes! If you create a free account, you can favorite resources to easily access them later. This feature helps you keep track of services you're interested in or want to share with friends and family."
  }
]

export default function AboutUs() {
  const heroImageRef = useRef<HTMLImageElement>(null)
  const missionItemsRef = useRef<HTMLParagraphElement[]>([])
  const whatWeDoRef = useRef<HTMLDivElement[]>([])
  const howStepsRef = useRef<HTMLDivElement[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  useEffect(() => {
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
      <section className="hero-section relative h-[50vh] sm:h-screen border-b border-(--border) overflow-hidden">
        <img
          ref={heroImageRef}
          src="/page-images/aboutus.jpg"
          alt="About NaviHub"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 flex items-center justify-center h-full text-center px-4 sm:px-6">
          <h1 className="text-white text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight">
            About NaviHub
          </h1>
        </div>
      </section>

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
      <section className="border-b border-(--border) bg-(--bg) py-12 sm:py-24 px-4 sm:px-6">
        <div className="about-section">
          <h2 className="about-section-heading text-center mb-6 sm:mb-8">
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
              <Search className="w-8 h-8 sm:w-10 sm:h-10 text-(--accent) mx-auto" />
              <h4 className="mt-3 sm:mt-4">Centralize Resources</h4>
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
              <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-(--accent) mx-auto" />
              <h4 className="mt-3 sm:mt-4">Organize by Need</h4>
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
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-(--accent) mx-auto" />
              <h4 className="mt-3 sm:mt-4">Support Communities</h4>
              <p className="about-section-text mt-2">
                We support communities by connecting residents with trusted organizations, encouraging involvement, and strengthening access to support that helps communities grow and thrive.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-(--border) bg-white py-12 sm:py-24 px-4 sm:px-6">
        <div className="about-section text-center">
          <h2 className="about-section-heading mb-4 sm:mb-6">
            <span className="primary">How It</span> <span className="tertiary">Works</span>
          </h2>
          <div className="about-mission-divider" />

          <div className="how-it-works-list mx-auto mt-6 sm:mt-8">
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

      {/* FAQ Section */}
      <section className="border-b border-(--border) bg-(--bg) py-12 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="text-center mb-10 sm:mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-[#997e67]/10 text-[#997e67] text-sm font-medium rounded-full mb-4">
              FAQ
            </span>
            <h2 className="about-section-heading mb-4">
              <span className="primary">Everything You</span>{" "}
              <span className="secondary">Need to Know</span>
            </h2>
            <div className="about-mission-divider" />
          </motion.div>

          <motion.div 
            className="space-y-3 sm:space-y-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            {FAQ_ITEMS.map((item, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                }}
                className="group"
              >
                <motion.button
                  onClick={() => toggleFaq(index)}
                  className={`relative z-10 w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left transition-all duration-300 cursor-pointer ${
                    openFaq === index 
                      ? "bg-[#997e67] text-white shadow-lg rounded-t-xl" 
                      : "bg-[#FFFFFA] hover:bg-[#997e67]/5 border border-[#eae0d5] hover:border-[#997e67]/30 rounded-xl"
                  }`}
                  whileHover={{ scale: openFaq === index ? 1 : 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span className={`text-base sm:text-lg font-semibold ${
                    openFaq === index ? "text-white" : "text-(--secondary-text)"
                  }`}>
                    {item.question}
                  </span>
                  <motion.div
                    className={`shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
                      openFaq === index 
                        ? "bg-white/20" 
                        : "bg-[#997e67]/10"
                    }`}
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {openFaq === index ? (
                      <Minus className={`w-4 h-4 sm:w-5 sm:h-5 ${openFaq === index ? "text-white" : "text-[#997e67]"}`} />
                    ) : (
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-[#997e67]" />
                    )}
                  </motion.div>
                </motion.button>
                
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div 
                        className="mx-6 sm:mx-8 px-4 sm:px-5 pt-5 pb-5 bg-[#f5f5f0] rounded-b-xl border-l-2 border-[#997e67]"
                      >
                        <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#4a4a4a" }}>
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  )
}
