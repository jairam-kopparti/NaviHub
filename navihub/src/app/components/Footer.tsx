import Link from "next/link";
import { Github, Twitter, Instagram, Bot, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1F1F1F] text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
        {/* Brand Section */}
        <div className="flex flex-col gap-6">
          <Link href="/" className="inline-block">
            <img src="/main_logo.png" alt="NaviHub Logo" className="h-10 brightness-0 invert opacity-90 hover:opacity-100 transition" />
          </Link>
          <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
            Empowering the community to connect, learn, and grow together. Discover resources, local events, and real-time news tailored for you.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#997e67] hover:text-white transition-all">
              <Twitter size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#997e67] hover:text-white transition-all">
              <Instagram size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#997e67] hover:text-white transition-all">
              <Github size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-semibold text-lg mb-2">Explore Hub</h4>
          <Link href="/" className="text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">Home</Link>
          <Link href="/pages/resources" className="text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">Community Resources</Link>
          <Link href="/pages/events" className="text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">Local Events</Link>
          <Link href="/pages/news" className="text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">Latest News</Link>
          <Link href="/pages/about" className="text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">About Us</Link>
        </div>

        {/* Get Involved */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-semibold text-lg mb-2">Get Involved</h4>
          <Link href="/pages/resources" className="text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">Submit a Resource</Link>
          <Link href="/pages/events" className="text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">Host an Event</Link>
          <Link href="/pages/about" className="text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">Volunteer with Us</Link>
          <Link href="/pages/about" className="text-gray-400 hover:text-[#CCBEB1] transition-colors w-fit">Partner Organizations</Link>
        </div>

        {/* Try NaviLink AI */}
        <div className="flex flex-col gap-4 w-full">
          <h4 className="text-white font-semibold text-lg mb-2">Need Guidance?</h4>
          <p className="text-sm text-gray-400 leading-relaxed mb-2">
            Not sure where to start? Let NaviLink, our AI community assistant, help you find exactly what youre looking for.
          </p>
          <div className="flex flex-col gap-3 mt-1">
            <Link 
              href="/pages/NaviLink" 
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-sm text-white transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-[#997e67] group-hover:text-white transition-colors" />
                <span>Chat with NaviLink</span>
              </div>
              <Sparkles size={16} className="text-gray-500 group-hover:text-[#997e67] transition-colors" />
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} TSA Webmaster. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/pages/references" className="hover:text-gray-300 transition-colors">References</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

