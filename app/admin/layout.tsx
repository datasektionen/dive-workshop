import Link from "next/link"
import Image from "next/image"
import {
  BookOpenIcon,
  BoxesIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react"

import { AdminGlobalSearch } from "@/components/admin/admin-global-search"
import { AdminSidebarAccount } from "@/components/admin/admin-sidebar-account"
import { ThemeToggle } from "@/components/theme-toggle"
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
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getAdminFromSessionToken, getSessionCookieName } from "@/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

const generalItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/participants", label: "Participants", icon: UserRoundIcon },
  { href: "/admin/admins", label: "Admins", icon: UsersIcon },
] as const

const learningItems = [
  { href: "/admin/classes", label: "Classes", icon: GraduationCapIcon },
  { href: "/admin/courses", label: "Courses", icon: BookOpenIcon },
  { href: "/admin/modules", label: "Modules", icon: LayoutGridIcon },
  { href: "/admin/blocks", label: "Blocks", icon: BoxesIcon },
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
              <Image src="/dive.png" alt="Dive" width={30} height={30} />
              Dive Admin
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarGroupLabel>General</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {generalItems.map((item) => {
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
              <SidebarGroupLabel>Learning</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {learningItems.map((item) => {
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
          <SidebarFooter className="px-4 pb-5">
            <AdminSidebarAccount name={admin.fullName} email={admin.email} />
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="min-h-screen border-l">
          <header className="flex flex-wrap items-center gap-4 border-b px-6 py-4">
            <SidebarTrigger className="md:hidden" />

            <div className="ml-auto flex items-center gap-2">
              <AdminGlobalSearch />
              <ThemeToggle />
            </div>
          </header>
          <div className="flex-1 px-6 py-6">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
