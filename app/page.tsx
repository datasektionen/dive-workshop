"use client"

import * as React from "react"
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
import { ThemeToggle } from "@/components/theme-toggle"
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"

export default function Page() {
  const router = useRouter()
  const [error, setError] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [mode, setMode] = React.useState<"new" | "code">("new")
  const [participantCode, setParticipantCode] = React.useState("")

  React.useEffect(() => {
    if (mode === "new") {
      setParticipantCode("")
    }
  }, [mode])

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
    } catch (err) {
      setError("Login failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-muted/30 px-6 py-16">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Enter access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex rounded-lg border bg-muted/20 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode("new")}
              className={`flex-1 rounded-md px-3 py-2 transition ${
                mode === "new"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              New participant
            </button>
            <button
              type="button"
              onClick={() => setMode("code")}
              className={`flex-1 rounded-md px-3 py-2 transition ${
                mode === "code"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Use my code
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
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="access-code">Class access code</FieldLabel>
                    <Input
                      id="access-code"
                      name="accessCode"
                      placeholder="Enter class code"
                      autoComplete="one-time-code"
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
                    containerClassName="justify-between"
                    render={({ slots }) => (
                      <InputOTPGroup>
                        {slots.map((slot, index) => (
                          <InputOTPSlot key={index} slot={slot} />
                        ))}
                      </InputOTPGroup>
                    )}
                  >
                  </InputOTP>
                </Field>
              )}
              <Button
                type="submit"
                className="w-full"
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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
        <Link
          href="/admin-login"
          className="text-xs text-muted-foreground/70 transition hover:text-muted-foreground hover:underline"
        >
          admin login
        </Link>
      </div>
    </main>
  )
}
