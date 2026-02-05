"use client"

import * as React from "react"
import { OTPInput, OTPInputContext, type SlotProps } from "input-otp"

import { cn } from "@/lib/utils"

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

function InputOTPGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  slot,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "slot"> & {
  index?: number
  slot?: SlotProps
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const resolvedSlot =
    slot ?? (index !== undefined ? inputOTPContext?.slots?.[index] : undefined)
  const char = resolvedSlot?.char ?? ""
  const hasFakeCaret = resolvedSlot?.hasFakeCaret ?? false
  const isActive = resolvedSlot?.isActive ?? false

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex h-11 w-11 items-center justify-center rounded-md border border-input bg-background text-sm font-semibold text-foreground shadow-xs transition-all",
        "data-[active=true]:border-ring data-[active=true]:ring-2 data-[active=true]:ring-ring/50",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px animate-pulse bg-foreground/80" />
        </div>
      ) : null}
    </div>
  )
}

function InputOTPSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-separator"
      className={cn("text-muted-foreground", className)}
      {...props}
    >
      —
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
