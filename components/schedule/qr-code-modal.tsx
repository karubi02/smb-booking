"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { QrCode, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  businessName?: string
}

export function QRCodeModal({ isOpen, onClose, url, businessName = "ビジネス" }: QRCodeModalProps) {
  const [downloading, setDownloading] = useState(false)
  const { toast } = useToast()

  // Generate QR code URL using qr-server.com API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`

  const downloadQRCode = async () => {
    setDownloading(true)
    try {
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()

      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `${businessName.toLowerCase().replace(/\s+/g, "-")}-schedule-qr.png`
      document.body.appendChild(link)
      link.click()
      if (link.isConnected && link.parentNode) {
        link.parentNode.removeChild(link)
      }
      window.URL.revokeObjectURL(downloadUrl)

      toast({
        title: "QRコードを保存しました",
        description: "ダウンロードフォルダにQRコードを保存しました。",
      })
    } catch (error) {
      console.error("Error downloading QR code:", error)
      toast({
        title: "ダウンロードに失敗しました",
        description: "QRコードのダウンロードに失敗しました。もう一度お試しください。",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            スケジュール用QRコード
          </DialogTitle>
          <DialogDescription>QRコードを読み取るとスケジュールページを表示できます。印刷用にダウンロードも可能です。</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <img src={qrCodeUrl || "/placeholder.svg"} alt="スケジュール用QRコード" className="w-64 h-64" />
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">スマートフォンのカメラで読み取るとスケジュールページが開きます</p>
            <p className="text-xs text-muted-foreground font-mono break-all">{url}</p>
          </div>

          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              閉じる
            </Button>
            <Button onClick={downloadQRCode} disabled={downloading} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              {downloading ? "ダウンロード中..." : "ダウンロード"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
