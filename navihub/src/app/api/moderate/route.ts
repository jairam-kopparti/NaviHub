import { NextResponse } from 'next/server'
import { moderateContent } from './moderation'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { content } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { safe: false, message: 'Content is required' },
        { status: 400 }
      )
    }

    const moderation = moderateContent(content)

    if (!moderation.allowed) {
      return NextResponse.json({
        safe: false,
        message: moderation.reason,
        details: moderation
      })
    }

    return NextResponse.json({ 
      safe: true,
      details: moderation
    })
  } catch (error) {
    console.error('Moderation error:', error)
    return NextResponse.json(
      { safe: false, message: 'Server error during moderation' },
      { status: 500 }
    )
  }
}