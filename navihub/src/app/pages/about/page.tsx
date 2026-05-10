
"use client"
import { useState, useEffect, useRef } from "react";
import Image from "next/image"
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import {
  MapPin,
  ArrowRight,
  Compass,
  Users,
  Target,
  Heart,
  Zap,
  Shield
} from "lucide-react";
export default function App() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const smoothX = useSpring(mousePosition.x, { stiffness: 100, damping: 20 });
  const smoothY = useSpring(mousePosition.y, { stiffness: 100, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen">
      <motion.div
        className="fixed w-96 h-96 rounded-full pointer-events-none z-0 opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(204, 190, 177, 0.3) 0%, transparent 70%)",
          filter: "blur(60px)",
          x: useTransform(smoothX, [0, typeof window !== 'undefined' ? window.innerWidth : 1920], [-50, 50]),
          y: useTransform(smoothY, [0, typeof window !== 'undefined' ? window.innerHeight : 1080], [-50, 50]),
          left: "-200px",
          top: "-200px",
        }}
      />
      <section
        ref={heroRef}
        className="relative pt-67 pb-67 px-8 overflow-hidden"
        style={{ backgroundColor: "#1A1A1A" }}
      >
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          style={{
            background: "radial-gradient(ellipse at 50% 30%, rgba(204, 190, 177, 0.08) 0%, transparent 60%)",
          }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="max-w-4xl mx-auto relative z-10"
        >
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="mb-8"
            style={{
              fontSize: "clamp(40px, 6vw, 72px)",
              lineHeight: "1.15",
              fontWeight: "500",
              color: "#FAFAF9",
              letterSpacing: "-2px",
            }}
          >
            We're building bridges
            <br />
            to community support
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-lg max-w-2xl"
            style={{
              color: "#B3A394",
              lineHeight: "1.8",
              letterSpacing: "0.2px",
            }}
          >
            NaviHub started with a simple observation: finding community support
            shouldn't be this hard. We're creating a central hub where New Yorkers
            can discover local organizations, programs, and services—all verified,
            organized, and accessible in one place.
          </motion.p>
        </motion.div>
      </section>
      <motion.div
        className="mx-auto"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, delay: 0.8 }}
        style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, #CCBEB1 50%, transparent 100%)",
          maxWidth: "900px",
        }}
      />
      <section
        className="py-32 px-8"
        style={{ backgroundColor: "#FAF8F5" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="inline-block mb-6 px-4 py-1.5 rounded-full"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                style={{
                  backgroundColor: "rgba(204, 190, 177, 0.15)",
                  border: "1px solid rgba(204, 190, 177, 0.3)",
                }}
              >
                <span
                  className="text-xs uppercase"
                  style={{
                    color: "#997E67",
                    letterSpacing: "2px",
                    fontWeight: "600",
                  }}
                >
                  Chapter 01
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="mb-6"
                style={{
                  fontSize: "clamp(32px, 4vw, 44px)",
                  lineHeight: "1.25",
                  fontWeight: "500",
                  color: "#1A1A1A",
                  letterSpacing: "-1.5px"
                }}
              >
                The problem we saw
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="mb-6"
                style={{
                  fontSize: "17px",
                  lineHeight: "1.75",
                  color: "#664930",
                }}
              >
                Every day, thousands of New Yorkers search for help—food assistance,
                housing support, job training, and mental health services. But the
                information is scattered across outdated websites, disconnected
                databases, and word-of-mouth networks.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.7 }}
                style={{
                  fontSize: "17px",
                  lineHeight: "1.75",
                  color: "#664930",
                }}
              >
                We realized that finding support shouldn't require hours of research
                and dozens of phone calls. Communities deserve better.
              </motion.p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <motion.div
                className="aspect-[4/3] rounded-2xl relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: "linear-gradient(135deg, rgba(204, 190, 177, 0.2) 0%, rgba(153, 126, 103, 0.15) 100%)",
                  border: "1px solid rgba(204, 190, 177, 0.3)",
                }}
              >
                <Image src="/page-images/community-service.png"
                alt="Community service"
                width={765.6}
                height={574.2}
                ></Image>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
      <motion.div
        className="mx-auto"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
        style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, #CCBEB1 50%, transparent 100%)",
          maxWidth: "900px",
        }}
      />
      <section
        className="py-32 px-8"
        style={{ backgroundColor: "#FFFEF9" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative order-2 lg:order-1"
            >
              <motion.div
                className="aspect-[4/3] rounded-2xl relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: "linear-gradient(135deg, rgba(204, 190, 177, 0.15) 0%, rgba(153, 126, 103, 0.1) 100%)",
                  border: "1px solid rgba(204, 190, 177, 0.25)",
                }}
              >
                <Image src="/page-images/nyc-marathon.jpg"
                alt="Community service"
                width={765.6}
                height={574.2}
                ></Image>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2"
            >
              <motion.div
                className="inline-block mb-6 px-4 py-1.5 rounded-full"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                style={{
                  backgroundColor: "rgba(204, 190, 177, 0.15)",
                  border: "1px solid rgba(204, 190, 177, 0.3)",
                }}
              >
                <span
                  className="text-xs uppercase"
                  style={{
                    color: "#997E67",
                    letterSpacing: "2px",
                    fontWeight: "600",
                  }}
                >
                  Chapter 02
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="mb-6"
                style={{
                  fontSize: "clamp(32px, 4vw, 44px)",
                  lineHeight: "1.25",
                  fontWeight: "500",
                  color: "#1A1A1A",
                  letterSpacing: "-1.5px",
                }}
              >
                What we're building
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="mb-6"
                style={{
                  fontSize: "17px",
                  lineHeight: "1.75",
                  color: "#664930",
                }}
              >
                NaviHub is a central platform that brings together verified community
                resources from across New York City. We work directly with
                organizations to ensure every listing is accurate, up-to-date, and
                easy to understand.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.7 }}
                style={{
                  fontSize: "17px",
                  lineHeight: "1.75",
                  color: "#664930",
                }}
              >
                Our platform organizes resources by need—food, housing, employment,
                health—so people can quickly find relevant support without feeling
                overwhelmed.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>
      <motion.div
        className="mx-auto"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
        style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, #CCBEB1 50%, transparent 100%)",
          maxWidth: "900px",
        }}
      />
      <section
        className="py-32 px-8"
        style={{ backgroundColor: "#FAF8F5" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="inline-block mb-6 px-4 py-1.5 rounded-full"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                style={{
                  backgroundColor: "rgba(204, 190, 177, 0.15)",
                  border: "1px solid rgba(204, 190, 177, 0.3)",
                }}
              >
                <span
                  className="text-xs uppercase"
                  style={{
                    color: "#997E67",
                    letterSpacing: "2px",
                    fontWeight: "600",
                  }}
                >
                  Chapter 03
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="mb-6"
                style={{
                  fontSize: "clamp(32px, 4vw, 44px)",
                  lineHeight: "1.25",
                  fontWeight: "500",
                  color: "#1A1A1A",
                  letterSpacing: "-1.5px",
                }}
              >
                Our impact so far
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="mb-6"
                style={{
                  fontSize: "17px",
                  lineHeight: "1.75",
                  color: "#664930",
                }}
              >
                Since launching, we've connected community members all over New York 
                with the resources they need, continuing to make a lasting impact across the city.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.7 }}
                style={{
                  fontSize: "17px",
                  lineHeight: "1.75",
                  color: "#664930",
                }}
              >
                But we're just getting started. Our vision is to become the trusted
                hub for community support across New York—and eventually, beyond.
              </motion.p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <motion.div
                className="aspect-[4/3] rounded-2xl relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: "linear-gradient(135deg, rgba(204, 190, 177, 0.2) 0%, rgba(153, 126, 103, 0.15) 100%)",
                  border: "1px solid rgba(204, 190, 177, 0.3)",
                }}
              >
                <Image src="/page-images/community-impact.jpg"
                alt="Community service"
                width={765.6}
                height={574.2}
                ></Image>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
      <motion.div
        className="mx-auto"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
        style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, #CCBEB1 50%, transparent 100%)",
          maxWidth: "900px",
        }}
      />
      <section
        className="py-32 px-8"
        id="mission"
        style={{ backgroundColor: "#FFFEF9" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-6"
              style={{
                fontSize: "clamp(32px, 4vw, 44px)",
                lineHeight: "1.25",
                fontWeight: "500",
                color: "#1A1A1A",
                letterSpacing: "-1.5px",
              }}
            >
              Our guiding principles
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="max-w-2xl"
              style={{
                fontSize: "17px",
                lineHeight: "1.75",
                color: "#664930",
              }}
            >
              These core values shape every decision we make and guide our work
              serving the community.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              {
                icon: Heart,
                title: "Empathy",
                description:
                  "We design with compassion, understanding that seeking help takes courage.",
              },
              {
                icon: Shield,
                title: "Trust",
                description:
                  "Every resource is verified to ensure people can rely on what they find.",
              },
              {
                icon: Zap,
                title: "Simplicity",
                description:
                  "Finding support should be quick and straightforward, never overwhelming.",
              },
              {
                icon: Users,
                title: "Community",
                description:
                  "We're built for and by the community, prioritizing their needs above all.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
              >
                <motion.div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{
                    backgroundColor: "rgba(204, 190, 177, 0.15)",
                  }}
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <item.icon className="w-6 h-6" style={{ color: "#997E67" }} />
                </motion.div>
                <h3
                  className="mb-3"
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1A1A1A",
                    letterSpacing: "-0.3px",
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    fontSize: "15px",
                    lineHeight: "1.6",
                    color: "#664930",
                  }}
                >
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <motion.div
        className="mx-auto"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
        style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, #CCBEB1 50%, transparent 100%)",
          maxWidth: "900px",
        }}
      />
      <section
        className="py-32 px-8"
        style={{ backgroundColor: "#FAF8F5" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            className="mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              lineHeight: "1.25",
              fontWeight: "500",
              color: "#1A1A1A",
              letterSpacing: "-1.5px",
            }}
          >
            Join us in building a more connected community
          </motion.h2>

          <motion.p
            className="mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.7 }}
            style={{
              fontSize: "17px",
              lineHeight: "1.75",
              color: "#664930",
            }}
          >
            Whether you're seeking support or offering services, NaviHub is here to
            help you connect with what matters.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 rounded-lg font-semibold"
              style={{
                backgroundColor: "#1A1A1A",
                color: "#FAFAF9",
              }}
            >
              <a href="/pages/resources">
                Explore Resources
              </a>
            </motion.button>
          </motion.div>
        </div>
      </section>
      <motion.div
        className="mx-auto"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
        style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, #CCBEB1 50%, transparent 100%)",
          maxWidth: "900px",
        }}
      />
    </div>
  );
}
