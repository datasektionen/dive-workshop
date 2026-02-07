"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"

const Dither = dynamic(() => import("@/components/Dither"), {
  ssr: false,
})

const BACKGROUND_DISABLE_UNTIL_KEY = "dive_login_bg_disabled_until"
const BACKGROUND_DISABLE_DURATION_MS = 60 * 60 * 1000

type NavigatorWithPerformanceHints = Navigator & {
  connection?: {
    saveData?: boolean
    effectiveType?: string
  }
  deviceMemory?: number
}

export default function Page() {
  const router = useRouter()
  const [error, setError] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isBackgroundReady, setIsBackgroundReady] = React.useState(false)
  const [hideFallback, setHideFallback] = React.useState(false)
  const [shouldRenderAnimatedBackground, setShouldRenderAnimatedBackground] =
    React.useState(false)
  const [mode, setMode] = React.useState<"new" | "code">("new")
  const [participantCode, setParticipantCode] = React.useState("")

  const disableAnimatedBackground = React.useCallback((persist: boolean) => {
    setShouldRenderAnimatedBackground(false)
    setIsBackgroundReady(false)
    setHideFallback(false)

    if (!persist || typeof window === "undefined") return

    try {
      const disabledUntil = Date.now() + BACKGROUND_DISABLE_DURATION_MS
      window.localStorage.setItem(
        BACKGROUND_DISABLE_UNTIL_KEY,
        String(disabledUntil)
      )
    } catch {
      // Ignore localStorage write errors.
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false

    async function measureFrameBudget(sampleCount: number) {
      return new Promise<number>((resolve) => {
        let count = 0
        let totalDelta = 0
        let previous = performance.now()

        function sample(now: number) {
          totalDelta += now - previous
          previous = now
          count += 1

          if (count >= sampleCount) {
            resolve(totalDelta / count)
            return
          }

          window.requestAnimationFrame(sample)
        }

        window.requestAnimationFrame(sample)
      })
    }

    async function evaluateBackgroundSupport() {
      if (typeof window === "undefined") return

      try {
        const storedDisabledUntil = Number(
          window.localStorage.getItem(BACKGROUND_DISABLE_UNTIL_KEY) || "0"
        )
        const maxAllowedDisabledUntil =
          Date.now() + BACKGROUND_DISABLE_DURATION_MS
        const disabledUntil = Number.isFinite(storedDisabledUntil)
          ? Math.min(storedDisabledUntil, maxAllowedDisabledUntil)
          : 0

        if (disabledUntil !== storedDisabledUntil && disabledUntil > 0) {
          window.localStorage.setItem(
            BACKGROUND_DISABLE_UNTIL_KEY,
            String(disabledUntil)
          )
        }

        if (Number.isFinite(disabledUntil) && disabledUntil > Date.now()) {
          disableAnimatedBackground(false)
          return
        }
      } catch {
        // Ignore localStorage read errors.
      }

      const media = window.matchMedia?.("(prefers-reduced-motion: reduce)")
      if (media?.matches) {
        disableAnimatedBackground(false)
        return
      }

      const navigatorHints = navigator as NavigatorWithPerformanceHints
      if (
        navigatorHints.connection?.saveData ||
        navigatorHints.connection?.effectiveType === "2g" ||
        navigatorHints.connection?.effectiveType === "slow-2g"
      ) {
        disableAnimatedBackground(false)
        return
      }

      if (
        typeof navigatorHints.hardwareConcurrency === "number" &&
        navigatorHints.hardwareConcurrency > 0 &&
        navigatorHints.hardwareConcurrency <= 4
      ) {
        disableAnimatedBackground(false)
        return
      }

      if (
        typeof navigatorHints.deviceMemory === "number" &&
        navigatorHints.deviceMemory > 0 &&
        navigatorHints.deviceMemory <= 4
      ) {
        disableAnimatedBackground(false)
        return
      }

      const avgFrameDuration = await measureFrameBudget(12)
      if (cancelled) return

      if (avgFrameDuration > 28) {
        disableAnimatedBackground(false)
        return
      }

      await new Promise<void>((resolve) => {
        if (typeof window.requestIdleCallback === "function") {
          window.requestIdleCallback(() => resolve(), { timeout: 900 })
          return
        }
        window.setTimeout(resolve, 120)
      })
      if (cancelled) return

      setShouldRenderAnimatedBackground(true)
    }

    void evaluateBackgroundSupport()

    return () => {
      cancelled = true
    }
  }, [disableAnimatedBackground])

  React.useEffect(() => {
    if (!shouldRenderAnimatedBackground || isBackgroundReady) return

    const timeout = window.setTimeout(() => {
      // If shader setup takes too long, keep static background and remember choice.
      disableAnimatedBackground(true)
    }, 3200)

    return () => window.clearTimeout(timeout)
  }, [disableAnimatedBackground, isBackgroundReady, shouldRenderAnimatedBackground])

  React.useEffect(() => {
    if (!shouldRenderAnimatedBackground) return

    let frameHandle = 0
    let sampleCount = 0
    let slowFrameCount = 0
    let previous = performance.now()
    let active = true

    function sample(now: number) {
      if (!active) return
      if (document.visibilityState === "hidden") {
        previous = now
        frameHandle = window.requestAnimationFrame(sample)
        return
      }

      const delta = now - previous
      previous = now
      sampleCount += 1

      if (sampleCount > 8 && delta > 40) {
        slowFrameCount += 1
      }

      if (sampleCount >= 90) {
        if (slowFrameCount >= 18) {
          disableAnimatedBackground(true)
        }
        return
      }

      frameHandle = window.requestAnimationFrame(sample)
    }

    frameHandle = window.requestAnimationFrame(sample)

    return () => {
      active = false
      window.cancelAnimationFrame(frameHandle)
    }
  }, [disableAnimatedBackground, shouldRenderAnimatedBackground])

  React.useEffect(() => {
    if (mode === "new") {
      setParticipantCode("")
    }
  }, [mode])

  React.useEffect(() => {
    if (!shouldRenderAnimatedBackground || !isBackgroundReady) {
      return
    }

    const timer = window.setTimeout(() => {
      setHideFallback(true)
    }, 180)

    return () => window.clearTimeout(timer)
  }, [isBackgroundReady, shouldRenderAnimatedBackground])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const payload =
      mode === "new"
        ? {
            name: String(formData.get("name") || ""),
            accessCode: String(formData.get("accessCode") || ""),
          }
        : {
            participantCode: participantCode.trim().toUpperCase(),
          }

    try {
      const response = await fetch(
        mode === "new" ? "/api/participant-login" : "/api/participant-login-code",
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error ?? "Login failed.")
        return
      }

      router.push("/app")
    } catch {
      setError("Login failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main
      className="dark relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16"
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        backgroundColor: "#050507",
      }}
    >
      <div className="absolute inset-0" style={{ position: "absolute", inset: 0 }}>
        <div
          className="relative h-full w-full"
          style={{ width: "100%", height: "100%", position: "relative" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ position: "absolute", inset: 0, backgroundColor: "#050507" }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle at 48% 24%, #6f2391 0%, #2f0a4f 33%, #0a0a0f 72%, #050507 100%)",
              opacity:
                shouldRenderAnimatedBackground && hideFallback ? 0 : 1,
              transition: "opacity 900ms ease-out",
            }}
          />
          {shouldRenderAnimatedBackground ? (
            <div
              className="absolute inset-0"
              style={{
                position: "absolute",
                inset: 0,
                opacity: hideFallback ? 1 : 0,
                transition: "opacity 900ms ease-out",
              }}
            >
              <Dither
                waveColor={[0.43, 0.18, 0.53]}
                disableAnimation={false}
                enableMouseInteraction={false}
                mouseRadius={1}
                colorNum={6}
                pixelSize={3}
                waveAmplitude={0.3}
                waveFrequency={3}
                waveSpeed={0.03}
                onReady={() => setIsBackgroundReady(true)}
              />
            </div>
          ) : null}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 dark:bg-[radial-gradient(circle_at_50%_35%,rgba(15,23,42,0)_0%,rgba(2,6,23,0.5)_55%,rgba(2,6,23,0.88)_100%)]" />
      <div className="pointer-events-none absolute inset-0 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.35))]" />
      <div className="relative z-10 w-full max-w-md">
        <div className="pointer-events-none absolute -inset-px rounded-[1.75rem] bg-gradient-to-br from-fuchsia-500/40 via-cyan-400/30 to-transparent opacity-70 blur-sm dark:opacity-45" />
        <Card className="relative w-full overflow-hidden rounded-[1.65rem] border border-white/30 bg-white/72 shadow-[0_24px_90px_rgba(15,23,42,0.3)] backdrop-blur-2xl dark:border-white/12 dark:bg-black/45 dark:shadow-[0_24px_90px_rgba(0,0,0,0.7)]">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex items-center justify-center">
              <Image
                src="/dive.png"
                alt="Dive Workshop"
                width={80}
                height={80}
                className="h-20 w-20"
              />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl tracking-tight">Dive Workshop</CardTitle>
              <p className="text-sm text-muted-foreground">
                Dive into the world of programming!
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-5 grid grid-cols-2 rounded-xl border border-white/30 bg-white/40 p-1 text-xs font-semibold shadow-inner dark:border-white/10 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setMode("new")}
                className={`rounded-lg px-3 py-2 transition ${
                  mode === "new"
                    ? "bg-white/95 text-foreground shadow-sm dark:bg-white/15"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                New participant
              </button>
              <button
                type="button"
                onClick={() => setMode("code")}
                className={`rounded-lg px-3 py-2 transition ${
                  mode === "code"
                    ? "bg-white/95 text-foreground shadow-sm dark:bg-white/15"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Login with code
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <FieldGroup>
                {mode === "new" ? (
                  <>
                    <Field>
                      <FieldLabel htmlFor="name">Name</FieldLabel>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Your name"
                        autoComplete="name"
                        className="border-white/35 bg-white/80 backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="access-code">Access code</FieldLabel>
                      <Input
                        id="access-code"
                        name="accessCode"
                        placeholder="Enter access code"
                        autoComplete="one-time-code"
                        className="border-white/35 bg-white/80 backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
                        required
                      />
                    </Field>
                  </>
                ) : (
                  <Field>
                    <FieldLabel htmlFor="participant-code">Participant code</FieldLabel>
                    <InputOTP
                      maxLength={8}
                      value={participantCode}
                      onChange={(value) => {
                        setParticipantCode(
                          value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                        )
                      }}
                      autoComplete="one-time-code"
                      autoCorrect="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      inputMode="text"
                      pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                      className="w-full"
                      containerClassName="w-full justify-between"
                      render={({ slots }) => (
                        <InputOTPGroup className="w-full justify-between">
                          {slots.map((slot, index) => (
                            <InputOTPSlot
                              key={index}
                              slot={slot}
                              className="h-11 w-9 border-white/35 bg-white/80 dark:border-white/10 dark:bg-white/5"
                            />
                          ))}
                        </InputOTPGroup>
                      )}
                    />
                  </Field>
                )}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-900/30 transition hover:brightness-105 dark:shadow-purple-950/50"
                  disabled={
                    isSubmitting || (mode === "code" && participantCode.length < 8)
                  }
                >
                  {isSubmitting ? "Joining..." : "Continue"}
                </Button>
              </FieldGroup>
            </form>
            {error ? (
              <p className="mt-3 text-sm text-destructive">{error}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center">
        <Link
          href="/admin-login"
          className="text-xs text-muted-foreground/55 transition hover:text-muted-foreground hover:underline"
        >
          admin login
        </Link>
      </div>
    </main>
  )
}
