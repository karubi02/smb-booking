import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  }

  // Validate slug format
  const slugRegex = /^[a-z0-9-]+$/
  if (!slugRegex.test(slug)) {
    return NextResponse.json({ 
      available: false, 
      error: 'Slug can only contain lowercase letters, numbers, and hyphens' 
    }, { status: 200 })
  }

  // Check slug length
  if (slug.length < 3 || slug.length > 30) {
    return NextResponse.json({ 
      available: false, 
      error: 'Slug must be between 3 and 30 characters' 
    }, { status: 200 })
  }

  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('public_slug')
      .eq('public_slug', slug)
      .maybeSingle()

    if (error) {
      console.error('Error checking slug availability:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ 
      available: !data,
      slug: slug
    })
  } catch (error) {
    console.error('Error checking slug availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
