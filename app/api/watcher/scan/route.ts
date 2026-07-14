import { NextRequest, NextResponse } from 'next/server'
import { scanAll } from '@/watcher/scanner'

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
  const results = await scanAll()
  return NextResponse.json({ results, scannedAt: new Date().toISOString() })
}

// Vercel Cron invokes GET; the UI uses POST.
export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}
