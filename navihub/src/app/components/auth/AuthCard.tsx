"use client"

import { useState } from "react"
import Image from "next/image"
import { Eye, EyeOff, MapPin, Calendar, Users, Newspaper } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"

interface AuthCardProps {
  type: "signin" | "signup"
}

const FEATURES = [
  { icon: MapPin, text: "Explore NYC community resources by location" },
  { icon: Calendar, text: "RSVP to local events & get email confirmations" },
  { icon: Users, text: "Connect on NaviLink, our community forum" },
  { icon: Newspaper, text: "Stay updated with NYC local news" },
]

export default function AuthCard({ type }: AuthCardProps) {
  const isSignup = type === "signup"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignup) {
        const nameCheck = await fetch("/api/moderate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: name }),
        });
        const nameResult = await nameCheck.json();

        if (!nameResult.safe) {
          throw new Error(`Invalid name: ${nameResult.message}`);
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        })

        if (error) throw error
        alert("Check your email to confirm your account.")
        setEmail("")
        setPassword("")
        setName("")
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
          if (error.message.includes("Invalid login credentials") || error.message.includes("incorrect")) {
            throw new Error("Invalid email or password")
          }
          throw error
        }
        const redirect = new URLSearchParams(window.location.search).get('redirect')
        window.location.href = redirect || "/"
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      if (errorMessage.includes("Email not confirmed")) {
        setError("Please check your email to confirm your account")
      } else if (errorMessage.includes("Invalid login credentials") || errorMessage.includes("incorrect") || errorMessage === "Invalid email or password") {
        setError("Email does not exist. Please sign up.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  async function handleGoogleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) {
      console.error('Error signing in with Google:', error.message)
      setError(error.message)
    }
  }

  return (
    <div className="auth-split">
      {/* ── Left panel (desktop only) ── */}
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <div
            className="inline-flex mb-6 bg-[#FFDBBB]/45 backdrop-blur-xl shadow-[0_8px_30px_rgba(255,219,187,0.28)] items-center justify-center"
            style={{
              width: "144px",
              height: "104px",
              borderRadius: "14px",
            }}
          >
            <Image
              src="/main_logo.png"
              alt="NaviHub"
              width={128}
              height={93}
              style={{ width: "128px", height: "93px", objectFit: "contain", display: "block" }}
            />
          </div>
          <h2 className="auth-brand-title">
            {isSignup ? "Join NaviHub" : "Welcome back"}
          </h2>
          <p className="auth-brand-subtitle">
            NYC&apos;s community resource hub — connecting residents to what matters.
          </p>
          <ul className="auth-features">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="auth-feature-item">
                <div className="auth-feature-icon">
                  <Icon size={14} />
                </div>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="auth-form-panel">
        <div className="auth-card">
          {/* Mobile logo */}
          <div className="auth-mobile-logo">
            <div
              className="inline-flex bg-[#FFDBBB]/45 backdrop-blur-xl shadow-[0_8px_20px_rgba(255,219,187,0.24)] items-center justify-center"
              style={{
                width: "93px",
                height: "66px",
                borderRadius: "14px",
              }}
            >
              <Image src="/main_logo.png" alt="NaviHub" width={80} height={56} style={{ width: "80px", height: "56px", objectFit: "contain", display: "block" }} />
            </div>
          </div>

          <h1 className="auth-title">
            {isSignup ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="auth-subtitle">
            {isSignup
              ? "Join NaviHub to access community resources."
              : "Sign in to continue to NaviHub."}
          </p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="google-signin-btn"
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <input
                type="text"
                placeholder="Full Name"
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                required
              />
            )}

            <input
              type="email"
              placeholder="Email address"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              required
            />

            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="auth-input password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <p className={`text-sm ${error === "Email does not exist. Please sign up." ? "text-gray-700" : "text-red-600"}`}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? "Loading..." : isSignup ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <div className="auth-footer">
            {isSignup ? (
              <p>Already have an account? <a href="/pages/signin">Sign in</a></p>
            ) : (
              <p>Don&apos;t have an account? <a href="/pages/signup">Sign up</a></p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
