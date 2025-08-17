import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST() {
  try {
    console.log('🧹 Admin API: Starting contaminated data cleanup...');
    
    // Clear existing price snapshots (they contain premium card data)
    const { error: deleteError } = await supabase
      .from('price_snapshots')
      .delete()
      .gte('snapshot_date', '2024-01-01'); // Delete all recent data
      
    if (deleteError) {
      console.error('❌ Error clearing price snapshots:', deleteError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to clear contaminated data',
        error: deleteError.message
      }, { status: 500 });
    }
    
    console.log('✅ Contaminated price snapshots cleared successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Contaminated data cleared successfully. Ready for enhanced collection.' 
    });
    
  } catch (error) {
    console.error('💥 Admin API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}