import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Clock, Users, Shield, Zap, Star, Calendar } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image src="/icon.png" alt="スケジュールのロゴ" width={40} height={40} priority className="object-contain" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              スケジュール
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  ダッシュボードへ
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">ログイン</Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    無料で始める
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-6">
          <Star className="w-3 h-3 mr-1" />
          1000社以上に選ばれています
        </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent">
              スケジュール管理
              <br />
              <span className="text-4xl md:text-5xl">簡単に</span>
            </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
          直感的なスケジュール管理プラットフォームで業務を効率化。予約管理から公開スケジュールまで、ビジネスの成長をスムーズに後押しします。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Link href="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-6">
                ダッシュボードを開く
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/sign-up">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-6">
                  無料で始める
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                デモを見る
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">スケジュール管理に必要な機能をすべて搭載</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            業務をシンプルにし、顧客体験を高めるための強力なツールセット
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Image src="/icon.png" alt="スケジュールのアイコン" width={28} height={28} className="rounded-full" />
              </div>
              <CardTitle>スマートなスケジュール設定</CardTitle>
              <CardDescription>
                直感的なカレンダーUIで複雑なスケジュールも簡単に作成・管理
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>公開ページ共有</CardTitle>
              <CardDescription>
                洗練された公開ページで空き状況を顧客と共有
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>リアルタイム更新</CardTitle>
              <CardDescription>
                即時通知とライブ更新でチーム全員の情報を同期
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>軽快なレスポンス</CardTitle>
              <CardDescription>
                すばやい表示と滑らかな操作性でストレスのない体験を提供
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>安心のセキュリティ</CardTitle>
              <CardDescription>
                99.9%の稼働率とエンタープライズ級のセキュリティで安心
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-pink-600" />
              </div>
              <CardTitle>モバイル対応</CardTitle>
              <CardDescription>
                デバイスを問わずどこからでもスケジュールを閲覧・管理
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-0 shadow-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">今すぐ始めませんか？</h2>
            <p className="text-xl mb-8 opacity-90">
              すでに多くのビジネスが「スケジュール」で効率的な運用を実現しています。
            </p>
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  ダッシュボードへ
                </Button>
              </Link>
            ) : (
              <Link href="/auth/sign-up">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  無料アカウントを作成
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
          <footer className="border-t bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
            <div className="container mx-auto px-4 py-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center space-x-2 mb-4 md:mb-0">
                  <Image src="/icon.png" alt="スケジュールのアイコン" width={32} height={32} className="rounded-full" />
                  <span className="font-semibold">スケジュール</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  © 2024 スケジュール. 無断転載・複製を禁じます。
                </p>
              </div>
            </div>
          </footer>
    </div>
  )
}
