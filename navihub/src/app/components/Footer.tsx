"use client";

import Link from "next/link";
import Image from "next/image";
import { Twitter, Instagram, Youtube, Cpu, Sparkles, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1F1F1F] text-gray-300 pt-16 pb-8 mt-auto w-full">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
        {/* Brand Section */}
        <div className="flex flex-col gap-6">
          <Link href="/" className="inline-block">
            <div className="relative h-10 w-[120px] brightness-0 invert opacity-90 hover:opacity-100 transition">
              <Image src="/main_logo.png" alt="NaviHub Logo" fill className="object-contain" priority sizes="120px" />
            </div>
          </Link>
          <p className="!text-[15px] text-gray-400 leading-relaxed max-w-sm">
            Empowering the community to connect, learn, and grow together. Discover resources, local events, and real-time news tailored for you.
          </p>
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-xs text-gray-400">Check out our community</p>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com/nycgov"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="New York City on X (Twitter)"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#997e67] hover:text-white transition-all"
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://www.instagram.com/nycgov/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="New York City on Instagram"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#997e67] hover:text-white transition-all"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.youtube.com/nycgov"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="New York City on YouTube"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#997e67] hover:text-white transition-all"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white font-semibold text-base mb-1">Explore Hub</h4>
          <Link href="/" className="text-xs text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">Home</Link>
          <Link href="/pages/resources" className="text-xs text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">Community Resources</Link>
          <Link href="/pages/events" className="text-xs text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">Local Events</Link>
          <Link href="/pages/news" className="text-xs text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">Latest News</Link>
          <Link href="/pages/about" className="text-xs text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">About Us</Link>
        </div>

        {/* Get Involved */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white font-semibold text-base mb-1">Get Involved</h4>
          <Link href="/pages/resources" className="text-xs text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">Suggest a Resource</Link>
          <Link href="/pages/events" className="text-xs text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">Join an Event</Link>
          <Link href="/pages/about" className="text-xs text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">Volunteer with Us</Link>
          <Link href="/pages/about" className="text-xs text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">Partner Organizations</Link>
        </div>

        {/* Try NaviBot AI */}
        <div className="flex flex-col gap-3 w-full">
          <h4 className="text-white font-semibold text-base mb-1">Need Guidance?</h4>
          <p className="!text-[15px] text-gray-400 leading-relaxed mb-1">
            Not sure where to start? Let NaviBot, our AI community assistant, help you find exactly what you&apos;re looking for.
          </p>
          <div className="flex flex-col gap-2 mt-1">
            <button
              onClick={() => window.dispatchEvent(new Event('open-chatbot'))}
              aria-label="Ask NaviBot"
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="grid place-items-center h-9 w-9 rounded-2xl bg-white/10 text-[#F5F1E8]">
                  <Cpu size={16} />
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#CCBEB1]">Ask NaviBot</span>
                  <span className="text-sm font-semibold text-white">AI</span>
                </div>
              </div>
              <Sparkles size={14} className="text-gray-500 group-hover:text-[#997e67] transition-colors" />
            </button>

            <button
              onClick={() => window.dispatchEvent(new Event('open-newsletter-modal'))}
              aria-label="Subscribe to NaviHub weekly newsletter"
              className="w-full bg-[#997e67]/20 hover:bg-[#997e67]/35 border border-[#997e67]/40 rounded-xl py-2.5 px-4 text-xs text-white transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-[#CCBEB1] group-hover:text-white transition-colors" />
                <span>Subscribe to Weekly Newsletter</span>
              </div>
              <Sparkles size={14} className="text-[#CCBEB1] group-hover:text-white transition-colors" />
            </button>

            <Link
              href="/pages/newsletter"
              className="text-xs text-[#CCBEB1] hover:text-white transition-colors text-center pt-1"
            >
              View newsletter archive
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p className="!text-[8px] md:!text-[10px]">© {new Date().getFullYear()} TSA Webmaster. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/pages/references" className="hover:text-gray-300 transition-colors">References</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
