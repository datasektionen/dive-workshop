import Link from "next/link"
import {
  BookOpenIcon,
  LayoutDashboardIcon,
  LayersIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react"

import { LogoutButton } from "@/components/logout-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getAdminFromSessionToken, getSessionCookieName } from "@/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/admins", label: "Admins", icon: UsersIcon },
  { href: "/admin/courses", label: "Courses", icon: BookOpenIcon },
  { href: "/admin/classes", label: "Classes", icon: LayersIcon },
] as const

const otherItems = [
  { href: "/admin/security", label: "Security", icon: ShieldIcon },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
] as const

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(getSessionCookieName())?.value
  const admin = await getAdminFromSessionToken(sessionToken)

  if (!admin) {
    redirect("/admin-login")
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar variant="sidebar" collapsible="offcanvas">
          <SidebarHeader className="px-4 py-5">
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                D
              </span>
              Dive Admin
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarGroupLabel>General</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild>
                          <Link href={item.href}>
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Other</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {otherItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild>
                          <Link href={item.href}>
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="px-4 pb-5 text-xs text-muted-foreground">
            Admin tools are limited to authorized users.
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="min-h-screen border-l">
          <header className="flex flex-wrap items-center gap-4 border-b px-6 py-4">
            <SidebarTrigger className="md:hidden" />

            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden min-w-[260px] items-center md:flex">
                <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search" />
              </div>
              <ThemeToggle />
              <LogoutButton />
            </div>
          </header>
          <div className="flex-1 px-6 py-6">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
