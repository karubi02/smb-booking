import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { SettingsForm } from "@/components/settings/settings-form"
import { PasswordChangeForm } from "@/components/settings/password-change-form"
import { Mail, Phone, Calendar, Shield, User } from "lucide-react"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, business_name, phone, public_slug, logo_url, banner_url")
    .eq("id", user?.id)
    .single()

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings Form */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">Profile Settings</CardTitle>
              <CardDescription>Update your profile information and display preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsForm
                initialData={{
                  display_name: profile?.display_name || "",
                  business_name: profile?.business_name || "",
                  email: user?.email || "",
                  phone: profile?.phone || "",
                  logo_url: profile?.logo_url || "",
                  banner_url: profile?.banner_url || "",
                  public_slug: profile?.public_slug || "",
                }}
                userId={user?.id || ""}
              />
            </CardContent>
          </Card>

          {/* Password Change Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">Change Password</CardTitle>
              <CardDescription>Update your account password for security</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordChangeForm />
            </CardContent>
          </Card>

          {/* Account Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Personal Information</CardTitle>
                <CardDescription>Your account details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email Address</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone Number</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{profile?.phone || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(user?.created_at || "").toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Account Status</CardTitle>
                <CardDescription>Your account verification and security status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Email Verified</span>
                  </div>
                  <Badge variant={user?.email_confirmed_at ? "default" : "secondary"} className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    {user?.email_confirmed_at ? "Verified" : "Pending"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Account Status</span>
                  </div>
                  <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">Active</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium">Public Slug</span>
                  </div>
                  <Badge variant="outline" className="font-mono">{profile?.public_slug || "Not set"}</Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">User ID</p>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded break-all">{user?.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
