"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
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
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignup) {
        
        // Moderate Name (Optional but good for quality)
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
          options: {
            data: {
              full_name: name,
            },
          },
        })

        if (error) throw error
        alert("Check your email to confirm your account.")
        setEmail("")
        setPassword("")
        setName("")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

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
          <p className={`text-sm ${error === "Email does not exist. Please sign up." ? "!text-black" : "text-red-600"}`}>
            {error}
          </p>
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
