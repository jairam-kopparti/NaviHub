"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabaseClient"

interface AuthCardProps {
  type: "signin" | "signup"
}

export default function AuthCard({ type }: AuthCardProps) {
  const isSignup = type === "signup"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        })

        if (error) throw error
        alert("Check your email to confirm your account.")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        window.location.href = "/"
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">
        {isSignup ? "Create Account" : "Welcome Back"}
      </h1>

      <p className="auth-subtitle">
        {isSignup
          ? "Join NaviHub to access community resources."
          : "Sign in to continue to NaviHub."}
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {isSignup && (
          <input
            type="text"
            placeholder="Full Name"
            className="auth-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email address"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : isSignup
            ? "Sign Up"
            : "Sign In"}
        </button>
      </form>

      <div className="auth-footer">
        {isSignup ? (
          <p>
            Already have an account?{" "}
            <a href="/pages/signin">Sign in</a>
          </p>
        ) : (
          <p>
            Don’t have an account?{" "}
            <a href="/pages/signup">Sign up</a>
          </p>
        )}
      </div>
    </div>
  )
}