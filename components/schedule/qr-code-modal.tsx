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

export function QRCodeModal({ isOpen, onClose, url, businessName = "Business" }: QRCodeModalProps) {
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
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast({
        title: "QR Code Downloaded",
        description: "QR code has been saved to your downloads folder.",
      })
    } catch (error) {
      console.error("Error downloading QR code:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download QR code. Please try again.",
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
            Schedule QR Code
          </DialogTitle>
          <DialogDescription>Scan this QR code to view the schedule or download it for printing.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code for schedule" className="w-64 h-64" />
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Point your camera at the QR code to open the schedule</p>
            <p className="text-xs text-muted-foreground font-mono break-all">{url}</p>
          </div>

          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Close
            </Button>
            <Button onClick={downloadQRCode} disabled={downloading} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              {downloading ? "Downloading..." : "Download"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
