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
    { name: 'Resources', href: '/pages/resources' },
    { name: 'News', href: '/pages/news' },
    { name: 'About', href: '/pages/about' },
  ]

  return (
    <header
      className={`navbar fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'scrolled' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/main_logo.png"
            alt="NaviHub logo"
            width={72}
            height={52}
            className="object-contain"
            priority
          />
          <span className="sr-only">NaviHub</span>
        </Link>

        {/* Separator */}
        <span className="hidden md:block text-(--secondary-text) text-2xl select-none">
          |
        </span>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-10">
          {links.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href)

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`
                  nav-link
                  text-[22px]
                  font-semibold
                  tracking-wide
                  transition
                  ${
                    isActive
                      ? 'text-(--primary-text) active'
                      : 'text-(--secondary-text)'
                  }
                `}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4 ml-auto">
          <Link
            href="/pages/signin"
            className="
              px-5 py-2
              text-(--primary-text)
              border border-(--primary-text)
              rounded-md
              text-sm
              font-semibold
              hover:bg-(--primary-text)
              hover:text-white
              transition
            "
          >
            Sign In
          </Link>

          <Link
            href="/pages/signup"
            className="
              px-5 py-2
              bg-(--primary-text)
              text-white
              rounded-md
              text-sm
              font-semibold
              hover:opacity-90
              transition
            "
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="ml-auto md:hidden">
          <button
            aria-label="Open menu"
            className="nav-menu-btn p-2 text-(--primary-text)"
          >
            <Menu size={26} />
          </button>
        </div>

      </div>
    </header>
  )
}
