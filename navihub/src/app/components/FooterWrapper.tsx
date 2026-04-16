'use client'
import { usePathname } from 'next/navigation'
import Footer from './Footer'

export default function FooterWrapper() {
  const pathname = usePathname()
  if (pathname?.includes('/pages/signin') || pathname?.includes('/pages/signup') || pathname?.includes('/pages/account') || pathname?.includes('/pages/admin')) return null
  return <Footer />
}