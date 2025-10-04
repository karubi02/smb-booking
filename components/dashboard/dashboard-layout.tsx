import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { SidebarProvider } from "./sidebar-context"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, phone")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-white dark:bg-slate-900">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header user={user as SupabaseUser} profile={profile ?? undefined} />
          <main className="flex-1 overflow-auto p-8 bg-white dark:bg-slate-900">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
