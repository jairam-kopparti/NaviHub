'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Menu, ChevronDown, LogOut, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '../lib/useUser'
import { supabase } from '../lib/supabaseClient'
import { isAdminEmail } from '../lib/admin'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [open, setOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navReady, setNavReady] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useUser()
  const isAdmin = isAdminEmail(user?.email)

  const isSpecialPage = pathname.includes('/pages/signin') || pathname.includes('/pages/signup') || pathname.includes('/pages/resources') || pathname.includes('/pages/newsletter')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    const onResize = () => setIsMobile(window.innerWidth < 1024)
    
    // Initial check
    onScroll()
    onResize()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    // Trigger entrance animation
    const timer = setTimeout(() => setNavReady(true), 100)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      clearTimeout(timer)
    }
  }, [])

  const shouldScrolledState = scrolled || isSpecialPage || isMobile

  // Split links: 4 left, 3 right (+ sign in) for symmetry
  const leftLinks = [
    { name: 'Home', href: '/' },
    { name: 'Resources', href: '/pages/resources' },
    { name: 'Events', href: '/pages/events' },
    { name: 'News', href: '/pages/news' },
  ]

  const rightLinks = [
    { name: 'NaviLink', href: '/pages/NaviLink' },
    { name: 'About', href: '/pages/about' },
    { name: 'References', href: '/pages/references' },
  ]

  const allLinks = [...leftLinks, ...rightLinks]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setOpen(false)
    setMobileMenuOpen(false)
    router.push('/pages/signin')
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header
      className={`navbar fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        shouldScrolledState ? 'scrolled' : ''
      } ${navReady ? 'is-ready' : ''}`}
    >
      <div className="nav-inner mx-auto px-8 py-4 flex items-center justify-between">

        {/* Mobile Spacer (Left) */}
        <div className="lg:hidden flex-1" />

        {/* Left Links (Desktop) */}
        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-6 xl:gap-10 2xl:gap-16 flex-1 justify-end">
          {leftLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`nav-link-aupale whitespace-nowrap shrink-0 ${isActive(link.href) ? 'active' : ''}`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Centered Logo */}
        <Link href="/" className="nav-logo-center mx-4 xl:mx-10 2xl:mx-20 flex-shrink-0">
          <div
            className="flex items-center justify-center hover:scale-105 transition-transform duration-300 bg-[#FFDBBB]/45 backdrop-blur-xl border border-[#FFFFFA]/55 shadow-[0_8px_30px_rgba(255,219,187,0.28)]"
            style={{
              width: "112px",
              height: "83px",
              borderRadius: "14px",
            }}
          >
            <Image
              src="/main_logo.png"
              alt="NaviHub logo"
              width={96}
              height={70}
              style={{ width: "96px", height: "70px", objectFit: "contain", display: "block" }}
              priority
            />
          </div>
        </Link>

        {/* Right Links + Auth (Desktop) */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-10 2xl:gap-16 flex-1">
          <nav aria-label="Secondary navigation" className="flex items-center gap-6 xl:gap-10 2xl:gap-16">
            {rightLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`nav-link-aupale whitespace-nowrap shrink-0 ${isActive(link.href) ? 'active' : ''}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3 ml-auto shrink-0">
            {!loading && !user && (
              <Link
                href={`/pages/signin?redirect=${encodeURIComponent(pathname)}`}
                className="nav-cta-btn whitespace-nowrap shrink-0"
              >
                Sign In
              </Link>
            )}

            {!loading && user && (
              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
                  aria-label="User account menu"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  className="nav-user-btn"
                >
                  <div className="nav-avatar">
                    {(user.user_metadata?.full_name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  />
                </button>

                {open && (
                  <div className="nav-dropdown" role="menu">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-[10px] text-white/45 font-semibold uppercase tracking-wide">Account</p>
                      <p className="text-sm font-semibold text-white mt-0.5 truncate">
                        {user.user_metadata?.full_name || user.email}
                      </p>
                    </div>
                    <Link
                      href={isAdmin ? '/pages/admin' : '/pages/account'}
                      className="nav-dropdown-item"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                    >
                      <User size={15} />
                      {isAdmin ? 'Admin Panel' : 'Account Settings'}
                    </Link>
                    <button onClick={handleSignOut} className="nav-dropdown-item" role="menuitem">
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex-1 flex justify-end">
          <button
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="nav-menu-btn p-2 text-white/90"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      </div>

      {/* Mobile Menu Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-[85%] max-w-[360px] z-50
          bg-[#0a0a0a] shadow-2xl
          transform transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
          lg:hidden
          ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <div className="p-1.5 rounded-lg bg-white/10">
                <Image
                  src="/main_logo.png"
                  alt="NaviHub logo"
                  width={48}
                  height={36}
                  className="object-contain"
                />
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-white/50 hover:text-white transition-colors duration-200"
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>

          {/* Mobile Links */}
          <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto py-8 px-6">
            <div className="space-y-1">
              {allLinks.map((link, i) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    mobile-nav-link
                    ${isActive(link.href) ? 'active' : ''}
                  `}
                  style={{ transitionDelay: mobileMenuOpen ? `${i * 50}ms` : '0ms' }}
                >
                  <span>{link.name}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mobile-nav-arrow">
                    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              ))}
            </div>
          </nav>

          {/* Mobile Footer */}
          <div className="p-6 border-t border-white/[0.06]">
            {!loading && !user && (
              <div className="space-y-3">
                <Link
                  href={`/pages/signin?redirect=${encodeURIComponent(pathname)}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-cta-btn"
                >
                  Sign In
                </Link>
                <Link
                  href={`/pages/signup?redirect=${encodeURIComponent(pathname)}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-cta-btn-outline"
                >
                  Create Account
                </Link>
              </div>
            )}

            {!loading && user && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.04] rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center font-medium text-sm">
                    {(user.user_metadata?.full_name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white/80 text-sm font-medium truncate flex-1">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </div>
                
                <Link
                  href={isAdmin ? '/pages/admin' : '/pages/account'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="
                    w-full px-5 py-3 mt-2
                    flex items-center justify-center gap-2
                    text-white/80 hover:text-white
                    bg-white/5 hover:bg-white/10
                    border border-white/10 hover:border-white/20
                    rounded-lg text-sm font-medium
                    transition-all duration-200
                  "
                >
                  <User size={16} />
                  {isAdmin ? 'Admin Panel' : 'Account Settings'}
                </Link>

                <button
                  onClick={handleSignOut}
                  className="
                    w-full px-5 py-3
                    flex items-center justify-center gap-2
                    text-white/60 hover:text-white
                    border border-white/10 hover:border-white/20
                    rounded-lg text-sm font-medium
                    transition-all duration-200
                  "
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
