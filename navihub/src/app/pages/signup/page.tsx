"use client"

import AuthCard from "../../components/auth/AuthCard"
import "../../styles/auth.css"

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <img
        src="/page-images/signup.jpg"
        alt="Sign up background"
        className="auth-bg"
      />

      <div className="auth-overlay">
        <AuthCard type="signup" />
      </div>
    </main>
  )
}