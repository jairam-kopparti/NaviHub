'use client'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

export default function NavbarWrapper() {
  const pathname = usePathname()
  if (pathname?.includes('/pages/signin') || pathname?.includes('/pages/signup') || pathname?.includes('/pages/account') || pathname?.includes('/pages/admin')) return null
  return <Navbar />
}

