"use client"

import Image from "next/image"
import AuthCard from "../../components/auth/AuthCard"
// @ts-expect-error - CSS side effect import
import "../../styles/auth.css"

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <Image
        src="/page-images/signup.jpg"
        alt="Sign up background"
        className="auth-bg"
        fill
        priority
      />
      <div className="auth-overlay">
        <AuthCard type="signup" />
      </div>
    </main>
  )
}
