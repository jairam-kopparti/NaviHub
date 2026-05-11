"use client"
import Image from "next/image"
import "../../styles/aboutus.css"
import { Users, Search, Layers, Plus, Minus } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const FAQ_ITEMS = [
  {
    question: "What is NaviHub and who is it for?",
    answer: "NaviHub is a community resource hub designed for everyone—residents, families, newcomers, and anyone looking for trusted local support. We bring together programs, services, events, and organizations in one calm, easy-to-use destination."
  },
  {
    question: "How do I find resources that match my needs?",
    answer: "Browse by category, use our search tools, or filter by service type to find local programs that fit your situation. Each listing includes key details so you can evaluate options quickly."
  },
  {
    question: "Is NaviHub free to use?",
    answer: "Yes. NaviHub is completely free for everyone. Our goal is to make local resources easier to discover and access without any cost or barriers."
  },
  {
    question: "How can organizations get listed on NaviHub?",
    answer: "Organizations can suggest a resource through our directory submission process. We review each listing for accuracy and relevance to ensure community members can trust the information."
  },
  {
    question: "How often is resource information updated?",
    answer: "We update listings regularly and welcome feedback from users and partners. Our team works to keep information fresh and reliable so the community can trust the latest details."
  },
  {
    question: "Can I save or bookmark resources for later?",
    answer: "Yes. Logged-in users can save favorites and return to listings easily. This makes it simple to keep track of services and opportunities that matter most."
  }
]

const VALUE_CARDS = [
  {
    icon: Search,
    title: "Clear discovery",
    description: "Bring focus to local services with a simple, searchable directory built for busy community members.",
    tone: "search"
  },
  {
    icon: Layers,
    title: "Organized support",
    description: "Group resources by need and category so visitors can find relevant help without friction.",
    tone: "organize"
  },
  {
    icon: Users,
    title: "Community first",
    description: "Support is centered on people—neighbors, organizations, and partners working together for stronger outcomes.",
    tone: "community"
  }
]

export default function AboutUs() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => setOpenFaq(openFaq === index ? null : index)

  return (
    <main className="about-page-root">
      <section className="hero-panel">
        <div className="hero-image-layer">
          <Image
            src="/page-images/aboutus.jpg"
            alt="Community navigating resources"
            fill
            sizes="100vw"
            priority
            className="hero-image"
          />
          <div className="hero-overlay" />
        </div>

        <div className="hero-copy">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-title"
          >
            Discover trusted local services with a calm, easy-to-use directory.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="hero-copytext"
          >
            NaviHub brings programs, events, and support information together in one simple place so community members can act quickly.
          </motion.p>
        </div>
      </section>

      <section className="about-section about-values-section">
        <div className="section-head">
          <span className="section-pill">Why NaviHub</span>
          <h2>Designed for local clarity and useful connection.</h2>
          <p>We bring services, programs, and community support together with a clean experience that puts people first.</p>
        </div>

        <div className="value-grid">
          {VALUE_CARDS.map((item, index) => (
            <motion.article
              key={item.title}
              className="value-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: index * 0.12 }}
            >
              <div className={`value-icon ${item.tone}`}>
                <item.icon className="icon-svg" />
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="about-section about-faq-section">
        <div className="section-head">
          <span className="section-pill">FAQ</span>
          <h2>Questions from community members.</h2>
          <p>All the essential details about NaviHub, how it works, and how organizations can participate.</p>
        </div>

        <div className="faq-stack">
          {FAQ_ITEMS.map((item, index) => (
            <motion.div
              key={item.question}
              className="faq-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <button
                type="button"
                className={`faq-toggle ${openFaq === index ? "open" : ""}`}
                onClick={() => toggleFaq(index)}
              >
                <span>{item.question}</span>
                <span className="faq-symbol">{openFaq === index ? "−" : "+"}</span>
              </button>
              <AnimatePresence>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="faq-answer-wrapper"
                  >
                    <p>{item.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  )
}
