import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendUnclaimNotification } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { claimId } = await request.json()

    if (!claimId) {
      return NextResponse.json({ error: 'Claim ID is required' }, { status: 400 })
    }

    // 1. Fetch claim and item details
    const { data: claim, error: claimError } = await supabase
      .from('lost_found_claims')
      .select('*, lost_found_items(title)')
      .eq('id', claimId)
      .single()

    if (claimError || !claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    // 2. Update claim status to 'unclaimed'
    const { error: updateError } = await supabase
      .from('lost_found_claims')
      .update({ status: 'unclaimed' })
      .eq('id', claimId)

    if (updateError) throw updateError

    // 3. Send notification
    await sendUnclaimNotification(claim.claimer_email, (claim.lost_found_items as any).title)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Unclaim error:', error)
    return NextResponse.json({ error: error.message || 'Unclaim failed' }, { status: 500 })
  }
}
