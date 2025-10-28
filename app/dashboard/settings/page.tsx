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
            設定
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">
            アカウント設定と各種情報を管理します。
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings Form */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">プロフィール設定</CardTitle>
              <CardDescription>プロフィール情報と表示内容を更新します</CardDescription>
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
              <CardTitle className="text-xl">パスワード変更</CardTitle>
              <CardDescription>セキュリティのためにパスワードを更新します</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordChangeForm />
            </CardContent>
          </Card>

          {/* Account Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">個人情報</CardTitle>
                <CardDescription>アカウント情報と連絡先を確認します</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">メールアドレス</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">電話番号</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{profile?.phone || "未登録"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">利用開始日</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(user?.created_at || "").toLocaleDateString("ja-JP", {
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
                <CardTitle className="text-xl">アカウントの状態</CardTitle>
                <CardDescription>認証状況とセキュリティ状態を確認します</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">メール認証</span>
                  </div>
                  <Badge variant={user?.email_confirmed_at ? "default" : "secondary"} className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    {user?.email_confirmed_at ? "認証済み" : "未認証"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">アカウントステータス</span>
                  </div>
                  <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">アクティブ</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium">公開用スラッグ</span>
                  </div>
                  <Badge variant="outline" className="font-mono">{profile?.public_slug || "未設定"}</Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">ユーザーID</p>
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
