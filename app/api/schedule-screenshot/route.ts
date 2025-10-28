import { NextRequest } from "next/server"
import chromium from "@sparticuz/chromium-min"
import type { Browser } from "puppeteer-core"
import puppeteer from "puppeteer-core"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

interface ScreenshotRequestBody {
  slug?: string
  month?: number
  year?: number
}

const createErrorResponse = (message: string, status = 400) =>
  new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  )

export async function POST(request: NextRequest) {
  let browser: Browser | null = null

  try {
    const body = (await request.json()) as ScreenshotRequestBody
    const { slug, month, year } = body

    if (!slug || typeof slug !== "string") {
      return createErrorResponse("Missing or invalid slug parameter")
    }

    const origin = request.nextUrl.origin
    const targetUrl = new URL(`${origin.replace(/\/$/, "")}/${slug}`)

    if (month) {
      targetUrl.searchParams.set("month", String(month))
    }

    if (year) {
      targetUrl.searchParams.set("year", String(year))
    }

    chromium.setHeadlessMode = true
    chromium.setGraphicsMode = false

    const executablePath =
      (await chromium.executablePath(process.env.CHROME_EXECUTABLE_PATH)) ||
      process.env.CHROME_EXECUTABLE_PATH ||
      undefined

    if (!executablePath) {
      throw new Error(
        "Chromium executable path could not be resolved. Provide CHROME_EXECUTABLE_PATH or include the chromium binary.",
      )
    }

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: {
        width: 1280,
        height: 900,
        deviceScaleFactor: 2,
      },
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    })

    const page = await browser.newPage()

    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: "light" },
    ])

    await page.goto(targetUrl.toString(), {
      waitUntil: "networkidle0",
      timeout: 60000,
    })

    await page.evaluate(() => {
      document.documentElement.classList.remove("dark")
      document.body?.classList?.remove("dark")
      document.documentElement.setAttribute("data-theme", "light")
      document.body?.setAttribute("data-theme", "light")
    })

    await page.waitForSelector('[data-public-schedule-root="true"]', {
      timeout: 15000,
    })

    try {
      await page.evaluate(async () => {
        if ("fonts" in document) {
          // @ts-expect-error - fonts exists in modern browsers
          await document.fonts.ready
        }
      })
    } catch {
      // Ignore font readiness failures; screenshot will still work.
    }

    await new Promise((resolve) => setTimeout(resolve, 750))

    const screenshotBuffer = await page.screenshot({
      type: "png",
      fullPage: true,
    })

    return new Response(screenshotBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error generating schedule screenshot:", error)
    const message =
      error instanceof Error
        ? `Failed to generate schedule image: ${error.message}`
        : "Failed to generate schedule image: Unknown error"
    return createErrorResponse(message, 500)
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.error("Failed to close Puppeteer browser:", closeError)
      }
    }
  }
}
