import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Page() {
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
          <form className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="access-code">Access code</FieldLabel>
                <Input
                  id="access-code"
                  name="access-code"
                  placeholder="Enter your code"
                  autoComplete="one-time-code"
                  required
                />
              </Field>
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </FieldGroup>
          </form>
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
