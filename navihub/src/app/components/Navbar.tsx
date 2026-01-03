import Image from 'next/image'
import Link from 'next/link'
import { Menu } from 'lucide-react'

export default function Navbar() {
  return (
    <header className="absolute top-0 left-0 w-full backdrop-blur-md z-50" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center gap-6">
        {/* Logo + Site name */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/main_logo.png"
            alt="Main logo"
            width={64}
            height={64}
            className="object-contain"
          />
          <span className="sr-only">NaviHub</span>
        </Link>

        {/* Left-aligned navigation links (hidden on very small screens) */}
        <nav className="hidden sm:flex items-center gap-4">
          <Link href="/" className="px-5 py-2 rounded-md text-[var(--surface)] hover:text-[var(--accent)] font-thin text-[22px]">Home</Link>
          <Link href="/resources" className="px-5 py-2 rounded-md text-[var(--surface)] hover:text-[var(--accent)] font-thin text-[22px]">Resources</Link>
          <Link href="/form" className="px-5 py-2 rounded-md text-[var(--surface)] hover:text-[var(--accent)] font-thin text-[22px]">Form</Link>
          <Link href="/about" className="px-5 py-2 rounded-md text-[var(--surface)] hover:text-[var(--accent)] font-thin text-[22px]">About</Link>
        </nav>

        {/* Optional right-side area: small mobile menu button */}
        <div className="ml-auto flex items-center">
          <button className="sm:hidden p-2 rounded-md text-[var(--surface)] hover:bg-white/10" aria-label="Open menu">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  )
}
