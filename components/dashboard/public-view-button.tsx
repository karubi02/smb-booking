"use client"

import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface PublicViewButtonProps {
  slug: string | null
}

export function PublicViewButton({ slug }: PublicViewButtonProps) {
  const handleOpenPublicPage = () => {
    if (slug) {
      window.open(`/${slug}`, '_blank')
    } else {
      alert('公開URLが設定されていません。設定からスラッグを登録してください。')
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleOpenPublicPage}
      className="border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 hover:text-green-700"
      title={slug ? `/${slug} の公開スケジュールを開く` : '公開URLが設定されていません'}
    >
      <ExternalLink className="w-4 h-4 mr-2" />
      公開ページを表示
    </Button>
  )
}
