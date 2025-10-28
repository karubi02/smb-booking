"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Calendar, Check, X, Loader2 } from "lucide-react"

export default function SignUpPage() {
  const [displayName, setDisplayName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [publicSlug, setPublicSlug] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [slugError, setSlugError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Debounced slug validation
  useEffect(() => {
    if (!publicSlug.trim()) {
      setSlugStatus('idle')
      setSlugError(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      setSlugStatus('checking')
      setSlugError(null)

      try {
        const response = await fetch(`/api/check-slug?slug=${encodeURIComponent(publicSlug)}`)
        const data = await response.json()

        if (data.error) {
          setSlugStatus('invalid')
          setSlugError(data.error)
        } else if (data.available) {
          setSlugStatus('available')
          setSlugError(null)
        } else {
          setSlugStatus('taken')
          setSlugError('This slug is already taken')
        }
      } catch (error) {
        setSlugStatus('invalid')
        setSlugError('Error checking slug availability')
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [publicSlug])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      const errorMessage = "Passwords do not match"
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errorMessage,
      })
      setIsLoading(false)
      return
    }

    if (!displayName.trim()) {
      const errorMessage = "表示名は必須です"
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "入力エラー",
        description: errorMessage,
      })
      setIsLoading(false)
      return
    }

    if (!businessName.trim()) {
      const errorMessage = "事業名は必須です"
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "入力エラー",
        description: errorMessage,
      })
      setIsLoading(false)
      return
    }

    if (!publicSlug.trim()) {
      const errorMessage = "パブリックスラッグは必須です"
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "入力エラー",
        description: errorMessage,
      })
      setIsLoading(false)
      return
    }

    if (slugStatus !== 'available') {
      const errorMessage = "有効なパブリックスラッグを入力してください"
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "入力エラー",
        description: errorMessage,
      })
      setIsLoading(false)
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      const errorMessage = "有効なメールアドレスを入力してください"
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "入力エラー",
        description: errorMessage,
      })
      setIsLoading(false)
      return
    }

    try {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
              data: {
                display_name: displayName.trim(),
                business_name: businessName.trim(),
                public_slug: publicSlug.trim(),
                phone: phone.trim(),
              },
            },
          })
      if (error) throw error

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      })

      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      setError(errorMessage)

      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              スケジュール
            </span>
          </Link>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-3xl font-bold">アカウント作成</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              アカウントを作成するための情報を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium">表示名 <span className="text-red-500">*</span></Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="田中太郎"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12 placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-sm font-medium">事業名 <span className="text-red-500">*</span></Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="田中商店"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="h-12 placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publicSlug" className="text-sm font-medium">パブリックスラッグ <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="publicSlug"
                    type="text"
                    placeholder="tanaka-shop"
                    required
                    value={publicSlug}
                    onChange={(e) => setPublicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className={`h-12 placeholder:text-slate-400 pr-10 ${
                      slugStatus === 'available' ? 'border-green-500 focus:border-green-500' :
                      slugStatus === 'taken' || slugStatus === 'invalid' ? 'border-red-500 focus:border-red-500' :
                      ''
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {slugStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                    {slugStatus === 'available' && <Check className="h-4 w-4 text-green-500" />}
                    {(slugStatus === 'taken' || slugStatus === 'invalid') && <X className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
                {slugError && (
                  <p className="text-sm text-red-600">{slugError}</p>
                )}
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  あなたの公開スケジュールのURLになります (例: yoursite.com/{publicSlug || 'your-slug'})
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">メールアドレス <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tanaka@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">電話番号</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="09012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">パスワード <span className="text-red-500">*</span></Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">パスワード確認 <span className="text-red-500">*</span></Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 placeholder:text-slate-400"
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                disabled={isLoading}
              >
                {isLoading ? "アカウント作成中..." : "アカウント作成"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
              すでにアカウントをお持ちですか？{" "}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                ログイン
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
