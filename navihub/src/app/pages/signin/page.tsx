"use client"

import Image from "next/image"
import AuthCard from "../../components/auth/AuthCard"
import "../../styles/auth.css"

export default function SignInPage() {
  return (
    <main className="auth-page">
      <Image
        src="/page-images/signin.jpg"
        alt="Sign in background"
        className="auth-bg"
        fill
        priority
      />
      <div className="auth-overlay">
        <AuthCard type="signin" />
      </div>
    </main>
  )
}
