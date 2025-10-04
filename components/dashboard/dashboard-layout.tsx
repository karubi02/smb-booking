"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { SidebarProvider } from "./sidebar-context"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase.from("profiles").select("display_name, phone").eq("id", user.id).single()
      if (!profileError) {
        setProfile(profile)
      }
      setLoading(false)
    }

    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-white dark:bg-slate-900">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header user={user} profile={profile} />
          <main className="flex-1 overflow-auto p-8 bg-white dark:bg-slate-900">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
