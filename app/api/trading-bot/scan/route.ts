import { NextRequest, NextResponse } from 'next/server'
import { runScan } from '@/trading-bot/scanner'

// Protect with a shared secret: /api/trading-bot/scan?secret=XXX
// Set BOT_SECRET env var. Vercel Cron uses GET; the UI can use POST.
function authorize(req: NextRequest): NextResponse | null {
  const secret = new URL(req.url).searchParams.get('secret')
  if (process.env.BOT_SECRET && secret !== process.env.BOT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

async function handle(req: NextRequest) {
  const denied = authorize(req)
  if (denied) return denied
  const results = await runScan()
  return NextResponse.json({ results, scannedAt: new Date().toISOString() })
}

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}
