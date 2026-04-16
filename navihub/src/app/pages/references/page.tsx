"use client"
import "../../styles/references.css"
import Link from "next/link"

export default function ReferencePage() {
  return (
    <>
      {/* HERO */}
      <section className="references-hero">
        <div className="references-hero-overlay" />
        <div className="references-hero-content">
          <h1>Attribution & References</h1>
          <p>Credits and acknowledgments for all resources used in this project.</p>
        </div>
      </section>

      {/* SITEMAP SECTION */}
      <section className="references-section bg-white">
        <div className="references-container">
          <h2 className="references-heading">
            <span className="primary">Site</span>{" "}
            <span className="secondary">Map</span>
          </h2>
          <div className="references-divider" />
          <p className="references-intro">
            For quick and easy access to all parts of the website, please use the following sitemap:
          </p>
          <ul className="references-list">
            <li>
              <strong>Home Page:</strong>{" "}
              <Link href="/" className="references-link">Home</Link>
            </li>
            <li>
              <strong>Resources:</strong>{" "}
              <Link href="/pages/resources" className="references-link">Resources</Link>
            </li>
            <li>
              <strong>Events:</strong>{" "}
              <Link href="/pages/events" className="references-link">Events</Link>
            </li>
            <li>
              <strong>NaviLink:</strong>{" "}
              <Link href="/pages/NaviLink" className="references-link">NaviLink</Link>
            </li>
            <li>
              <strong>About:</strong>{" "}
              <Link href="/pages/about" className="references-link">About Us</Link>
            </li>
            <li>
              <strong>Sign In:</strong>{" "}
              <Link href="/pages/signin" className="references-link">Sign In</Link>
            </li>
            <li>
              <strong>Sign Up:</strong>{" "}
              <Link href="/pages/signup" className="references-link">Sign Up</Link>
            </li>
          </ul>
        </div>
      </section>

      {/* FRAMEWORKS & LIBRARIES */}
      <section className="references-section bg-[#FFFFFA]">
        <div className="references-container">
          <h2 className="references-heading">
            <span className="primary">Frameworks &</span>{" "}
            <span className="secondary">Libraries</span>
          </h2>
          <div className="references-divider" />
          <p className="references-intro">
            All code for this website was our own creation. No templates or quick design websites (such as WordPress, Wix, or Shopify) were used.
          </p>

          <p className="references-intro" style={{ marginTop: '1rem' }}>
            Find the plan of work log and the copyright checklist <a href="https://drive.google.com/file/d/1NFx058WITAtxvRC7LKYffE6gvEXb4yWn/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="references-link">here</a>.
          </p>

          <div className="references-grid">
            {/* Core Framework */}
            <div className="references-card">
              <h3>Core Framework</h3>
              <ul className="references-list">
                <li>
                  <a href="https://nextjs.org/" target="_blank" rel="noopener noreferrer" className="references-link">
                    Next.js
                  </a>{" "}
                  - React framework for production (v16.1.6)
                </li>
                <li>
                  <a href="https://react.dev/" target="_blank" rel="noopener noreferrer" className="references-link">
                    React
                  </a>{" "}
                  - JavaScript library for building user interfaces (v19.2.3)
                </li>
                <li>
                  <a href="https://react.dev/" target="_blank" rel="noopener noreferrer" className="references-link">
                    React DOM
                  </a>{" "}
                  - React package for DOM rendering (v19.2.3)
                </li>
              </ul>
            </div>

            {/* Styling */}
            <div className="references-card">
              <h3>Styling</h3>
              <ul className="references-list">
                <li>
                  <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer" className="references-link">
                    Tailwind CSS
                  </a>{" "}
                  - Utility-first CSS framework (v4.1.18)
                </li>
                <li>
                  <a href="https://postcss.org/" target="_blank" rel="noopener noreferrer" className="references-link">
                    PostCSS
                  </a>{" "}
                  - CSS transformations tool (v8.5.6)
                </li>
              </ul>
            </div>

            {/* Animation */}
            <div className="references-card">
              <h3>Animation</h3>
              <ul className="references-list">
                <li>
                  <a href="https://www.framer.com/motion/" target="_blank" rel="noopener noreferrer" className="references-link">
                    Framer Motion
                  </a>{" "}
                  - Production-ready motion library for React (v12.29.0)
                </li>
                <li>
                  <a href="https://gsap.com/" target="_blank" rel="noopener noreferrer" className="references-link">
                    GSAP
                  </a>{" "}
                  - Professional-grade animation library (v3.14.2)
                </li>
              </ul>
            </div>

            {/* Backend & Database */}
            <div className="references-card">
              <h3>Backend & Database</h3>
              <ul className="references-list">
                <li>
                  <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="references-link">
                    Supabase
                  </a>{" "}
                  - Open source Firebase alternative for database and authentication (v2.89.0)
                </li>
                <li>
                  <a href="https://resend.com/" target="_blank" rel="noopener noreferrer" className="references-link">
                    Resend
                  </a>{" "}
                  - Email API for developers (v6.9.2)
                </li>
              </ul>
            </div>

            {/* AI & Chatbot Dependencies */}
            <div className="references-card">
              <h3>AI & Machine Learning</h3>
              <p className="text-sm !text-gray-600 mb-4 bg-gray-50 p-3 rounded-md border border-gray-100 italic">
                <strong>Disclaimer:</strong> Artificial Intelligence was strictly utilized to power the NaviBot community assistant chatbot. AI was <strong>not</strong> used to generate the code, content, or design of this website.
              </p>
              <ul className="references-list">
                <li>
                  <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="references-link">
                    Google Generative AI
                  </a>{" "}
                  - SDK for interacting with Gemini AI models (v0.24.1)
                </li>
                <li>
                  <a href="https://www.npmjs.com/package/dotenv" target="_blank" rel="noopener noreferrer" className="references-link">
                    Dotenv
                  </a>{" "}
                  - Zero-dependency module that loads environment variables (used for secure AI key management) (v17.3.1)
                </li>
              </ul>
            </div>

            {/* UI Components */}
            <div className="references-card">
              <h3>UI Components & Others</h3>
              <ul className="references-list">
                <li>
                  <a href="https://docs.mapbox.com/mapbox-gl-js/api/" target="_blank" rel="noopener noreferrer" className="references-link">
                    Mapbox GL JS
                  </a>{" "}
                  - Interactive, customizable vector maps (v3.18.1)
                </li>
                <li>
                  <a href="https://lucide.dev/" target="_blank" rel="noopener noreferrer" className="references-link">
                    Lucide React
                  </a>{" "}
                  - Beautiful & consistent icon toolkit (v0.562.0)
                </li>
                <li>
                  <a href="https://www.npmjs.com/package/react-intersection-observer" target="_blank" rel="noopener noreferrer" className="references-link">
                    React Intersection Observer
                  </a>{" "}
                  - React implementation of Intersection Observer API (v10.0.0)
                </li>
                <li>
                  <a href="https://sharp.pixelplumbing.com/" target="_blank" rel="noopener noreferrer" className="references-link">
                    Sharp
                  </a>{" "}
                  - High performance Node.js image processing
                </li>
              </ul>
            </div>

            {/* Development Tools */}
            <div className="references-card">
              <h3>Development Tools</h3>
              <ul className="references-list">
                <li>
                  <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer" className="references-link">
                    TypeScript
                  </a>{" "}
                  - Typed JavaScript at any scale (v5)
                </li>
                <li>
                  <a href="https://eslint.org/" target="_blank" rel="noopener noreferrer" className="references-link">
                    ESLint
                  </a>{" "}
                  - Code linting and quality tool (v9)
                </li>
              </ul>
            </div>

            {/* Hosting */}
            <div className="references-card">
              <h3>Hosting Services</h3>
              <ul className="references-list">
                <li>
                  <a href="https://vercel.com/" target="_blank" rel="noopener noreferrer" className="references-link">
                    Vercel
                  </a>{" "}
                  - Deployment platform for frontend frameworks
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* IMAGES SECTION - PLACEHOLDER */}
      <section className="references-section bg-white">
        <div className="references-container">
          <h2 className="references-heading">
            <span className="primary">Images &</span>{" "}
            <span className="secondary">Media</span>
          </h2>
          <div className="references-divider" />
          <p className="references-intro">
            All images and media are from free-to-use websites or are of our own design. This website has not been built for, and never will be used for, commercial purposes.
          </p>
          <div className="references-placeholder">
            <p className="mb-4">
               For the full list of image attributions and sources, please visit the link below:
            </p>
            <a 
              href="https://docs.google.com/document/d/1Ntv8zLt3jxJyMwhDjgEDjv20RzNaDfbZfp18XKQquKQ/copy"
              target="_blank" 
              rel="noopener noreferrer" 
              className="references-link text-lg font-semibold"
            >
              View Image Resources
            </a>
          </div>
        </div>
      </section>

      {/* COPYRIGHT NOTICE */}
      <section className="references-section bg-[#FFFFFA]">
        <div className="references-container">
          <h2 className="references-heading">
            <span className="primary">Copyright</span>{" "}
            <span className="secondary">Notice</span>
          </h2>
          <div className="references-divider" />
          <p className="references-intro">
            © 2026 NaviHub. All rights reserved. This project was created for the TSA Webmaster competition.
          </p>
          <p className="references-intro">
            All code for this website was our own original creation, built primarily on the Next.js and Tailwind CSS frameworks.
          </p>
        </div>
      </section>
    </>
  )
}
