"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export default function VerifiedPage() {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Trigger animation after mount
    const animTimer = setTimeout(() => setShowConfetti(true), 100)

    // Play success sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2) // G5
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.4)
    } catch {
      // Ignore audio errors
    }

    // Countdown and redirect
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          router.push("/")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearTimeout(animTimer)
      clearInterval(countdownInterval)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden film-grain">
      {/* Animated background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full transition-all duration-1000",
          showConfetti 
            ? "bg-primary/20 blur-[100px] scale-100 opacity-100" 
            : "bg-primary/0 blur-[50px] scale-50 opacity-0"
        )} />
      </div>

      {/* Confetti particles */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'][i % 5],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-md">
        {/* Animated checkmark */}
        <div className={cn(
          "relative mx-auto mb-8 transition-all duration-700",
          showConfetti ? "scale-100 opacity-100" : "scale-50 opacity-0"
        )}>
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          {/* Sparkle effects */}
          <Sparkles className={cn(
            "absolute -top-2 -right-2 w-6 h-6 text-primary transition-all duration-500 delay-300",
            showConfetti ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )} />
          <Sparkles className={cn(
            "absolute -bottom-1 -left-3 w-5 h-5 text-primary/70 transition-all duration-500 delay-500",
            showConfetti ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )} />
        </div>

        {/* Text */}
        <h1 className={cn(
          "text-3xl font-serif font-semibold text-foreground mb-3 transition-all duration-500 delay-200",
          showConfetti ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          You&apos;re verified!
        </h1>
        
        <p className={cn(
          "text-muted-foreground mb-8 transition-all duration-500 delay-300",
          showConfetti ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          Welcome to drift. Your account is now active and you can start connecting with travelers nearby.
        </p>

        {/* CTA */}
        <button
          onClick={() => router.push("/")}
          className={cn(
            "inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:glow-amber transition-all duration-500 delay-400",
            showConfetti ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          Start exploring
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Auto-redirect notice */}
        <p className={cn(
          "text-xs text-muted-foreground mt-6 transition-all duration-500 delay-500",
          showConfetti ? "opacity-100" : "opacity-0"
        )}>
          Redirecting in {countdown} seconds...
        </p>
      </div>

      {/* Brand footer */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <h2 className="text-2xl font-serif font-semibold text-primary/50">drift</h2>
      </div>
    </div>
  )
}
