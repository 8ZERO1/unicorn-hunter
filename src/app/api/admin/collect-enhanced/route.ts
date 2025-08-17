import { NextResponse } from 'next/server';
import { collectHistoricalDataForAllCards } from '../../../../lib/data/dataService';

export async function POST() {
  try {
    console.log('📊 Admin API: Starting enhanced historical data collection...');
    console.log('🎯 Using comprehensive negative keywords for base cards only');
    
    const success = await collectHistoricalDataForAllCards();
    
    if (success) {
      console.log('🎉 Enhanced data collection completed successfully!');
      return NextResponse.json({ 
        success: true, 
        message: 'Enhanced data collection completed successfully! System now uses real base card market averages.' 
      });
    } else {
      console.log('❌ Enhanced data collection failed');
      return NextResponse.json({ 
        success: false, 
        message: 'Enhanced data collection failed. Check server logs for details.' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('💥 Admin API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error during enhanced collection',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}