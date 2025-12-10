import { chromium, type Browser } from 'playwright'
import { APP_CONSTANTS } from '@/constants'

let browserPromise: Promise<Browser> | null = null

export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: APP_CONSTANTS.BROWSER_CONFIG.HEADLESS,
      args: [...APP_CONSTANTS.BROWSER_CONFIG.ARGS],
    })
  }
  return browserPromise
}

export async function closeBrowser() {
  try {
    const b = await browserPromise
    await b?.close()
  } catch {
    // no-op
  } finally {
    browserPromise = null
  }
}
