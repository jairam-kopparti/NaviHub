'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { name: 'Home', href: '/' },
    { name: 'Resources', href: '/resources' },
    { name: 'Form', href: '/form' },
    { name: 'About', href: '/about' },
  ]

  return (
    <header
      className={`navbar fixed top-0 left-0 w-full z-50 ${
        scrolled ? 'scrolled' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-6">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/main_logo.png"
            alt="Main logo"
            width={80}
            height={58}
            className="object-contain"
          />
          <span className="sr-only">NaviHub</span>
        </Link>

        {/* Separator */}
        <span className="hidden md:block text-white/50 text-2xl select-none">
          |
        </span>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-10">
          {links.map((link) => {
            const isActive = pathname === link.href

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`
                  nav-link
                  text-white
                  text-[22px]
                  font-semibold
                  tracking-wide
                  ${isActive ? 'active' : ''}
                `}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>

        {/* Mobile menu */}
        <div className="ml-auto md:hidden">
          <button
            aria-label="Open menu"
            className="nav-menu-btn p-2 text-white"
          >
            <Menu size={26} />
          </button>
        </div>
      </div>
    </header>
  )
}
