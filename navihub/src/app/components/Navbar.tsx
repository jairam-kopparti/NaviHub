'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Menu, ChevronDown, LogOut, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '../lib/useUser'
import { supabase } from '../lib/supabaseClient'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useUser()

  const isSpecialPage = pathname.includes('/pages/signin') || pathname.includes('/pages/signup') || pathname.includes('/pages/resources')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { name: 'Home', href: '/' },
    { name: 'Resources', href: '/pages/resources' },
    { name: 'Events', href: '/pages/events' },
    { name: 'NaviLink', href: '/pages/NaviLink' },
    { name: 'About', href: '/pages/about' },
    { name: 'Reference Page', href: '/pages/references' },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/pages/signin')
  }

  return (
    <header
      className={`navbar fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled || isSpecialPage ? 'scrolled' : ''
      }`}
    >
      <div className="max-w-8xl mx-auto px-6 py-5 flex items-center gap-6">

        <Link href="/" className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white">
            <Image
              src="/main_logo.png"
              alt="NaviHub logo"
              width={72}
              height={52}
              className="object-contain"
              priority
            />
          </div>
          <span className="sr-only">NaviHub</span>
        </Link>

        <span className="hidden md:block text-(--primary-text) text-2xl select-none">
          |
        </span>

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

        <div className="hidden md:flex items-center gap-4 ml-auto relative">
          {!loading && !user && (
            <>
              <Link
                href={`/pages/signin?redirect=${encodeURIComponent(pathname)}`}
                className="
                  px-5 py-2
                  text-(--primary-text)
                  border border-(--primary-text)
                  rounded-md
                  text-sm
                  font-semibold
                  hover:bg-(--primary-text)
                  hover:text-(--secondary-text)
                  transition
                "
              >
                Sign In
              </Link>

              <Link
                href={`/pages/signup?redirect=${encodeURIComponent(pathname)}`}
                className="
                  px-5 py-2
                  bg-(--primary-text)
                  text-(--secondary-text)
                  rounded-md
                  text-sm
                  font-semibold
                  hover:opacity-90
                  transition
                "
              >
                Sign Up
              </Link>
            </>
          )}

          {!loading && user && (
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="
                  flex items-center gap-3
                  px-3 py-2
                  border border-(--primary-text)
                  rounded-3xl
                  text-sm
                  font-semibold
                  text-(--primary-text)
                  hover:bg-(--primary-text)
                  hover:text-(--secondary-text)
                  transition
                "
              >
                <div className="
                  w-8 h-8
                  rounded-full
                  bg-(--primary-text)
                  text-(--secondary-text)
                  flex items-center justify-center
                  font-bold
                  text-xs
                ">
                  {(user.user_metadata?.full_name || user.email).charAt(0).toUpperCase()}
                </div>

                <span className="max-w-[100px] truncate">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </button>

              {open && (
                <div
                  className="
                    absolute right-0 mt-2 w-40
                    bg-(--secondary-bg)
                    border border-(--border)
                    rounded-md
                    shadow-lg
                    overflow-hidden
                  "
                >
                  <button
                    onClick={handleSignOut}
                    className="
                      w-full px-4 py-3
                      flex items-center gap-2
                      text-sm
                      text-(--primary-text)
                      hover:bg-(--hover-bg)
                      transition
                    "
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
