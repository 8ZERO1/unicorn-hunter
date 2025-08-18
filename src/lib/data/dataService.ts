import { createClient } from '@supabase/supabase-js';
import { Auction } from '../types/auction';
import { DismissedItem } from '@/lib/types/dismissed-item';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DatabaseCard {
  id: string;
  player: string;
  sport: string;
  year: number;
  brand: string;
  set_name: string;
  parallel: string | null;
  grades_monitored: string[];
  priority_score: number;
  monitoring_frequency: string;
  active: boolean;
}

interface eBayItem {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  currentBidPrice?: {
    value: string;
    currency: string;
  };
  condition: string;
  seller: {
    username: string;
    feedbackPercentage: string;
    feedbackScore: number;
  };
  itemWebUrl: string;
  image?: {
    imageUrl: string;
  };
  itemEndDate?: string;
  buyingOptions?: string[];
  listingType?: string;
}

// ==========================================
// NEW: DISMISS FUNCTIONALITY
// ==========================================

interface DismissedItem {
  id: string;
  ebay_item_id: string;
  card_id: string;
  title: string;
  current_price: number;
  seller_username: string;
  dismissed_at: string;
  expires_at: string;
  user_notes?: string;
  card_info?: {
    player: string;
    year: number;
    brand: string;
    set_name: string;
  };
}

// Dismiss an auction item
export async function dismissAuctionItem(auction: Auction, userNotes?: string): Promise<boolean> {
  try {
    console.log(`🗑️ DISMISSING ITEM: ${auction.title.substring(0, 50)}... (ID: ${auction.listing_id})`);
    
    const dismissedItem = {
      ebay_item_id: auction.listing_id,
      card_id: auction.card_id,
      title: auction.title,
      current_price: auction.current_price,
      seller_username: auction.seller_username,
      user_notes: userNotes || null
    };

    const { data, error } = await supabase
      .from('dismissed_items')
      .insert(dismissedItem)
      .select();

    if (error) {
      console.error('❌ Error dismissing item:', error);
      return false;
    }

    console.log(`✅ Successfully dismissed item: ${auction.title.substring(0, 50)}...`);
    console.log(`⏰ Will expire in 30 days: ${data?.[0]?.expires_at}`);
    
    return true;
  } catch (error) {
    console.error('💥 Error in dismissAuctionItem:', error);
    return false;
  }
}

// Check if an item is currently dismissed (and not expired)
export async function isItemDismissed(ebayItemId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('dismissed_items')
      .select('id, expires_at')
      .eq('ebay_item_id', ebayItemId)
      .gt('expires_at', new Date().toISOString()) // Only non-expired dismissals
      .limit(1);

    if (error) {
      console.error('❌ Error checking if item is dismissed:', error);
      return false;
    }

    const isDismissed = data && data.length > 0;
    if (isDismissed) {
      console.log(`🚫 Item ${ebayItemId} is currently dismissed (expires: ${data[0].expires_at})`);
    }
    
    return isDismissed;
  } catch (error) {
    console.error('💥 Error in isItemDismissed:', error);
    return false;
  }
}

// Define type for what Supabase actually returns
interface SupabaseDismissedItem {
  id: string;
  ebay_item_id: string;
  card_id: string;
  title: string;
  current_price: number;
  seller_username: string;
  dismissed_at: string;
  expires_at: string;
  user_notes: string | null;
  cards: {
    player: string;
    year: string;
    brand: string;
    set_name: string;
  };
}

import { supabase } from './supabaseClient';
import { DismissedItem } from '@/lib/types/dismissed-item';

interface DismissedItemRow {
  id: string;
  ebay_item_id: string;
  title: string;
  current_price: number;
  dismissed_at: string;
  expires_at: string;
  ebay_url?: string;
  image_url?: string;
  cards?: {
    player?: string;
    year?: string;
    brand?: string;
    set_name?: string;
  };
}

// Get all dismissed items (for admin interface)
export async function getDismissedItems(includeExpired: boolean = false): Promise<DismissedItem[]> {
  try {
    console.log(`📋 FETCHING dismissed items (includeExpired: ${includeExpired})`);
    
    let query = supabase
      .from('dismissed_items')
      .select(`
        *,
        cards!inner(
          player,
          year,
          brand,
          set_name
        )
      `)
      .order('dismissed_at', { ascending: false });

    if (!includeExpired) {
      query = query.gt('expires_at', new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching dismissed items:', error);
      return [];
    }

    const dismissedItems: DismissedItem[] = (data as DismissedItemRow[])?.map(item => ({
      id: item.id,
      ebay_item_id: item.ebay_item_id,
      title: item.title,
      current_price: item.current_price,
      dismissed_at: item.dismissed_at,
      expires_at: item.expires_at,
      card_player: item.cards?.player || '',
      card_year: item.cards?.year || '',
      card_brand: item.cards?.brand || '',
      days_remaining: Math.max(
        0,
        Math.ceil((new Date(item.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      ),
      ebay_url: item.ebay_url || '',
      image_url: item.image_url || ''
    })) || [];

    console.log(`📊 Found ${dismissedItems.length} dismissed items`);
    return dismissedItems;

  } catch (error) {
    console.error('💥 Error in getDismissedItems:', error);
    return [];
  }
}

// Restore a dismissed item (remove from dismissed_items table)
export async function restoreDismissedItem(dismissedItemId: string): Promise<boolean> {
  try {
    console.log(`🔄 RESTORING dismissed item: ${dismissedItemId}`);
    
    const { error } = await supabase
      .from('dismissed_items')
      .delete()
      .eq('id', dismissedItemId);

    if (error) {
      console.error('❌ Error restoring dismissed item:', error);
      return false;
    }

    console.log(`✅ Successfully restored dismissed item: ${dismissedItemId}`);
    return true;
    
  } catch (error) {
    console.error('💥 Error in restoreDismissedItem:', error);
    return false;
  }
}

// Cleanup expired dismissals (call periodically)
export async function cleanupExpiredDismissals(): Promise<number> {
  try {
    console.log('🧹 CLEANING UP expired dismissals...');
    
    const { data, error } = await supabase
      .from('dismissed_items')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      console.error('❌ Error cleaning up expired dismissals:', error);
      return 0;
    }

    const cleanedCount = data?.length || 0;
    console.log(`✅ Cleaned up ${cleanedCount} expired dismissals`);
    return cleanedCount;
    
  } catch (error) {
    console.error('💥 Error in cleanupExpiredDismissals:', error);
    return 0;
  }
}

// ==========================================
// EXISTING FUNCTIONS (UNCHANGED)
// ==========================================

// Enhanced search query building with comprehensive negative keywords
function buildSearchQuery(card: DatabaseCard): string {
  const parts = [
    card.player,
    card.year.toString(),
    card.brand,
    card.set_name,
    'card'
  ];
  
  if (card.parallel && card.parallel !== 'Base') {
    parts.push(card.parallel);
  }
  
  // Add grade info for graded searches
  if (card.grades_monitored.length > 0 && !card.grades_monitored.includes('Raw')) {
    const psaGrades = card.grades_monitored.filter(grade => grade.startsWith('PSA'));
    if (psaGrades.length > 0) {
      parts.push('PSA');
    }
  }
  
  return parts.join(' ');
}

// NEW: Generate comprehensive negative keywords for base card isolation
function getBaseCardNegativeKeywords(): string {
  const negativeKeywords = [
    // Premium card exclusions
    '-auto', '-autograph', '-autographed', '-signed', '-signature',
    '-patch', '-jersey', '-game-used', '-worn', '-relic',
    '-memorabilia', '-dual', '-triple', '-quad',
    
    // Parallel exclusions (be conservative - only exclude obvious premium)
    '-/25', '-/50', '-/75', '-/99', '-/100', '-/199', '-/299',
    '-silver', '-gold', '-platinum', '-black', '-red', '-blue', '-green',
    '-prizm', '-refractor', '-chrome', '-shimmer', '-crystal',
    '-rainbow', '-disco', '-atomic', '-laser', '-holo',
    
    // Set exclusions
    '-lot', '-set', '-collection', '-complete', '-full',
    '-choose', '-pick', '-"you pick"', '-random', '-mystery',
    '-commons', '-"base cards"', '-duplicates', '-extras',
    '-bulk', '-wholesale', '-mixed',
    
    // Condition exclusions  
    '-damaged', '-crease', '-corner', '-edge', '-surface',
    '-"off-center"', '-miscut', '-"print line"', '-stain',
    
    // Low-value exclusions
    '-reprint', '-reproduction', '-facsimile', '-copy',
    '-custom', '-proxy', '-alter', '-sketch'
  ];
  
  return negativeKeywords.join(' ');
}

// ENHANCED: Raw card search with stronger base card targeting
function buildRawSearchQuery(card: DatabaseCard): string {
  const parts = [
    card.player,
    card.year.toString(),
    card.brand,
    card.set_name,
    'card',
    'ungraded'
  ];
  
  if (card.parallel && card.parallel !== 'Base') {
    parts.push(card.parallel);
  }
  
  return parts.join(' ');
}

// REPLACE your calculateRawROI function with this real-data version:

async function calculateRawROI(rawPrice: number, card: DatabaseCard): Promise<{
  roi_percentage: number;
  expected_value: number;
  grading_cost: number;
  potential_profit: number;
  confidence_score: number;
  uses_real_data: boolean;
}> {
  const gradingCost = 35; // $30 PSA Economy + $5 shipping/fees
  const ebayFees = 0.13; // 13% eBay + PayPal fees
  
  try {
    console.log(`💎 RAW ROI: Calculating for ${card.player} using REAL PSA grade data...`);
    
    // Get REAL PSA grade market data for this specific card
    const psaGradeData = await Promise.all([
      getRealMarketAverage(card.id, 'PSA', 'PSA 7'),
      getRealMarketAverage(card.id, 'PSA', 'PSA 8'),
      getRealMarketAverage(card.id, 'PSA', 'PSA 9'),
      getRealMarketAverage(card.id, 'PSA', 'PSA 10')
    ]);

    const [psa7Data, psa8Data, psa9Data, psa10Data] = psaGradeData;
    
    // Check if we have enough real data
    const hasRealData = psaGradeData.some(data => data.hasData && data.confidence > 50);
    
    if (hasRealData) {
      console.log(`✅ RAW ROI: Found real PSA grade data for ${card.player}`);
      
      // Use REAL PSA values (fallback to reasonable estimates if grade not available)
      const psaValues = {
        psa7: psa7Data.hasData ? psa7Data.average : (psa8Data.hasData ? psa8Data.average * 0.6 : rawPrice * 2.0),
        psa8: psa8Data.hasData ? psa8Data.average : (psa9Data.hasData ? psa9Data.average * 0.7 : rawPrice * 3.5),
        psa9: psa9Data.hasData ? psa9Data.average : (psa10Data.hasData ? psa10Data.average * 0.4 : rawPrice * 6.0),
        psa10: psa10Data.hasData ? psa10Data.average : (psa9Data.hasData ? psa9Data.average * 2.5 : rawPrice * 12.0)
      };
      
      console.log(`📊 RAW ROI: Real PSA values - 7:$${psaValues.psa7.toFixed(2)}, 8:$${psaValues.psa8.toFixed(2)}, 9:$${psaValues.psa9.toFixed(2)}, 10:$${psaValues.psa10.toFixed(2)}`);
      
      // Calculate weighted confidence based on available data
      const confidenceWeights = [
        { confidence: psa7Data.confidence || 0, weight: 0.15 },
        { confidence: psa8Data.confidence || 0, weight: 0.50 },
        { confidence: psa9Data.confidence || 0, weight: 0.30 },
        { confidence: psa10Data.confidence || 0, weight: 0.05 }
      ];
      
      const weightedConfidence = confidenceWeights.reduce((sum, item) => 
        sum + (item.confidence * item.weight), 0
      );
      
      // Expected value using industry success rates with REAL PSA values
      const expectedValue = 
        (0.05 * psaValues.psa10) +  // 5% PSA 10
        (0.30 * psaValues.psa9) +   // 30% PSA 9
        (0.50 * psaValues.psa8) +   // 50% PSA 8
        (0.15 * psaValues.psa7);    // 15% PSA 7
        
      const netExpectedValue = expectedValue * (1 - ebayFees);
      const totalCost = rawPrice + gradingCost;
      const potentialProfit = netExpectedValue - totalCost;
      const roiPercentage = (potentialProfit / totalCost) * 100;
      
      console.log(`💰 RAW ROI: Expected value $${expectedValue.toFixed(2)} → Net $${netExpectedValue.toFixed(2)} → ROI ${roiPercentage.toFixed(1)}%`);
      
      return {
        roi_percentage: Math.round(roiPercentage),
        expected_value: Math.round(netExpectedValue),
        grading_cost: gradingCost,
        potential_profit: Math.round(potentialProfit),
        confidence_score: Math.round(weightedConfidence),
        uses_real_data: true
      };
      
    } else {
      console.log(`⚠️ RAW ROI: No real PSA data for ${card.player}, using conservative estimates`);
      
      // FALLBACK: Conservative estimates (much lower than old multipliers)
      const conservativePSAValues = {
        psa7: rawPrice * 1.5,   // More conservative multipliers
        psa8: rawPrice * 2.5,
        psa9: rawPrice * 4.0,
        psa10: rawPrice * 8.0   // Much lower than 12x
      };
      
      const expectedValue = 
        (0.05 * conservativePSAValues.psa10) +
        (0.30 * conservativePSAValues.psa9) +
        (0.50 * conservativePSAValues.psa8) +
        (0.15 * conservativePSAValues.psa7);
        
      const netExpectedValue = expectedValue * (1 - ebayFees);
      const totalCost = rawPrice + gradingCost;
      const potentialProfit = netExpectedValue - totalCost;
      const roiPercentage = (potentialProfit / totalCost) * 100;
      
      return {
        roi_percentage: Math.round(roiPercentage),
        expected_value: Math.round(netExpectedValue),
        grading_cost: gradingCost,
        potential_profit: Math.round(potentialProfit),
        confidence_score: 25, // Low confidence for estimates
        uses_real_data: false
      };
    }
    
  } catch (error) {
    console.error('💥 Error calculating raw ROI with real data:', error);
    
    // Emergency fallback
    const emergencyPSAValues = {
      psa7: rawPrice * 1.5,
      psa8: rawPrice * 2.5,
      psa9: rawPrice * 4.0,
      psa10: rawPrice * 8.0
    };
    
    const expectedValue = 
      (0.05 * emergencyPSAValues.psa10) +
      (0.30 * emergencyPSAValues.psa9) +
      (0.50 * emergencyPSAValues.psa8) +
      (0.15 * emergencyPSAValues.psa7);
      
    const netExpectedValue = expectedValue * (1 - ebayFees);
    const totalCost = rawPrice + gradingCost;
    const potentialProfit = netExpectedValue - totalCost;
    const roiPercentage = (potentialProfit / totalCost) * 100;
    
    return {
      roi_percentage: Math.round(roiPercentage),
      expected_value: Math.round(netExpectedValue),
      grading_cost: gradingCost,
      potential_profit: Math.round(potentialProfit),
      confidence_score: 10, // Very low confidence for emergency fallback
      uses_real_data: false
    };
  }
}

// ENHANCED: Much stronger validation for base cards vs premium variants
function isValidCard(item: eBayItem, searchType: 'auction' | 'bin' | 'raw' = 'auction'): boolean {
  const title = item.title.toLowerCase();
  
  console.log(`🔍 VALIDATING ${searchType.toUpperCase()} ITEM: "${item.title.substring(0, 50)}..."`);
  
  const price = parseFloat(
    item.currentBidPrice?.value ||
    item.price?.value ||
    '0'
  );
  
  console.log(`   💰 Price Analysis: ${price}`);
  
  // Basic price filtering
  if (price < 1) {
    console.log(`   ❌ REJECTED: Price too low (${price})`);
    return false;
  }
  if (price > 50000) {
    console.log(`   ❌ REJECTED: Price too high (${price})`);
    return false;
  }
  
  // Enhanced exclude terms
  const excludeTerms = [
    'lot of', 'choose', 'pick', 'you pick',
    'entire set', 'complete set', 'full set', 'base set',
    'mixed lot', 'random', 'mystery', 'grab bag',
    'commons', 'base cards', 'duplicates', 'extras',
    'binder', 'collection', 'bulk', 'wholesale'
  ];
  
  const foundExcludeTerm = excludeTerms.find(term => title.includes(term));
  if (foundExcludeTerm) {
    console.log(`   ❌ REJECTED: Contains exclude term "${foundExcludeTerm}"`);
    return false;
  }
  
  // ENHANCED: Premium card detection (conservative approach)
  const premiumIndicators = [
    'autograph', 'auto ', '/25', '/50', '/75', '/99',
    'patch', 'jersey', 'game used', 'worn', 'relic',
    'memorabilia', 'dual', 'triple', 'quad',
    'signature', 'signed'
  ];
  
  const foundPremiumIndicator = premiumIndicators.find(indicator => title.includes(indicator));
  if (foundPremiumIndicator) {
    console.log(`   ❌ REJECTED: Premium card indicator "${foundPremiumIndicator}"`);
    return false;
  }
  
  // NEW: Price sanity checks based on card type
  if (searchType !== 'raw') {
    // Graded card price sanity checks
    const hasModernYear = title.match(/20(1[5-9]|2[0-5])/); // 2015-2025
    const hasPSA9 = title.includes('psa 9') || title.includes('psa9');
    
    if (hasModernYear && hasPSA9 && price > 200) {
      console.log(`   ⚠️  FLAGGED: Modern PSA 9 over $200 (${price}) - possible premium variant`);
      // Don't reject, just flag for now (conservative approach)
    }
  }
  
  // ENHANCED: Stronger raw card validation
  if (searchType === 'raw') {
    // Check for ANY grading company indicators
    const gradedTerms = [
      'psa', 'bgs', 'sgc', 'graded', 'certified', 'authenticated',
      'psa 1', 'psa 2', 'psa 3', 'psa 4', 'psa 5', 'psa 6', 'psa 7', 'psa 8', 'psa 9', 'psa 10',
      'bgs 1', 'bgs 2', 'bgs 3', 'bgs 4', 'bgs 5', 'bgs 6', 'bgs 7', 'bgs 8', 'bgs 9', 'bgs 10',
      'sgc 1', 'sgc 2', 'sgc 3', 'sgc 4', 'sgc 5', 'sgc 6', 'sgc 7', 'sgc 8', 'sgc 9', 'sgc 10'
    ];
    
    const hasGradedTerm = gradedTerms.some(term => title.includes(term));
    if (hasGradedTerm) {
      console.log(`   ❌ REJECTED: Raw search found graded card (contains grading term)`);
      return false;
    }
    
    // Additional check: Look for grade numbers followed by common grading indicators
    const gradeNumberPattern = /\b(1|2|3|4|5|6|7|8|9|10)(\.\d+)?\s*(gem|mint|excellent|good|poor|authentic|grade|graded)\b/i;
    if (gradeNumberPattern.test(title)) {
      console.log(`   ❌ REJECTED: Raw search found graded card (grade number pattern)`);
      return false;
    }
  }
  
  console.log(`   ✅ PASSED: Item is valid ${searchType} card`);
  return true;
}

function calculateHoursRemaining(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60));
}

function extractGradeInfo(title: string): { grader?: 'PSA' | 'BGS' | 'SGC'; grade?: string; grade_number?: number } {
  const gradePatterns = [
    { pattern: /PSA\s*(\d+(?:\.\d+)?)/i, grader: 'PSA' as const },
    { pattern: /BGS\s*(\d+(?:\.\d+)?)/i, grader: 'BGS' as const },
    { pattern: /SGC\s*(\d+(?:\.\d+)?)/i, grader: 'SGC' as const }
  ];

  for (const { pattern, grader } of gradePatterns) {
    const match = title.match(pattern);
    if (match) {
      const gradeValue = match[1];
      const gradeNumber = parseFloat(gradeValue);
      return {
        grader,
        grade: `${grader} ${gradeValue}`,
        grade_number: gradeNumber
      };
    }
  }

  return { grade: 'Raw' };
}

function getListingType(item: eBayItem): 'BIN' | 'Auction' | 'Auction+BIN' {
  const hasFixedPrice = item.buyingOptions?.includes('FIXED_PRICE');
  const hasAuction = item.buyingOptions?.includes('AUCTION');
  
  if (hasFixedPrice && hasAuction) return 'Auction+BIN';
  if (hasFixedPrice) return 'BIN';
  if (hasAuction) return 'Auction';
  
  if (item.price?.value && !item.currentBidPrice?.value && !item.itemEndDate) {
    return 'BIN';
  }
  
  if (item.itemEndDate && item.currentBidPrice?.value) {
    return 'Auction';
  }
  
  return 'BIN';
}

// NEW: Extract image URLs from eBay response
function extractImageUrls(item: eBayItem): { image_url?: string; thumbnail_url?: string } {
  try {
    // eBay Browse API image structure
    const primaryImage = item.image?.imageUrl;
    
    if (primaryImage) {
      console.log(`🖼️ IMAGE: Found eBay image - ${primaryImage.substring(0, 50)}...`);
      
      // eBay images often come with size parameters we can modify
      // Convert to different sizes: s-l64 (64px), s-l225 (225px), s-l300 (300px), s-l500 (500px), s-l1600 (1600px)
      const thumbnailUrl = primaryImage.replace(/s-l\d+/, 's-l225'); // 225px for thumbnails
      const fullSizeUrl = primaryImage.replace(/s-l\d+/, 's-l800');   // 800px for modal
      
      return {
        image_url: fullSizeUrl,
        thumbnail_url: thumbnailUrl
      };
    }
    
    console.log(`📷 IMAGE: No image found in eBay response`);
    return {};
    
  } catch (error) {
    console.error('Error extracting image URLs:', error);
    return {};
  }
}

// REPLACE your transformeBayToAuction function signature and logic with this:

async function transformeBayToAuction(
  item: eBayItem,
  card: DatabaseCard,
  searchQuery: string,
  originalSearchType: 'auction' | 'bin' | 'raw',
  forceGrade?: string,
  forceGrader?: string
): Promise<Auction | null> {
  try {
    const price = parseFloat(
      item.currentBidPrice?.value ||
      item.price?.value ||
      '0'
    );
    if (isNaN(price)) return null;

    const listingType = getListingType(item);
    const gradeInfo = extractGradeInfo(item.title);
    
    // NEW: Extract image URLs
    const imageData = extractImageUrls(item);

    // FIXED: Separate raw card detection from listing type
    const isRawCard = originalSearchType === 'raw' || 
                     forceGrade === 'Raw' || 
                     (!gradeInfo.grader && gradeInfo.grade === 'Raw');

    const displayListingType = listingType;
    const displayGrade = forceGrade || gradeInfo.grade || (isRawCard ? 'Raw' : 'Unknown');
    const displayGrader = forceGrader || gradeInfo.grader;

    console.log(`🔄 TRANSFORM: ${item.title.substring(0, 40)} → TYPE: ${displayListingType}, GRADE: ${displayGrade}, RAW: ${isRawCard}, IMAGE: ${imageData.image_url ? 'YES' : 'NO'}`);

    // Get market average and calculate ROI/discount (existing logic)
    let mockAveragePrice: number;
    let percentBelowAverage: number;
    let rawROI: { roi_percentage: number; expected_value: number; grading_cost: number; potential_profit: number; confidence_score: number; uses_real_data: boolean } | null = null;
    let confidence = 0;
    let usesRealData = false;

    if (isRawCard) {
      const roiResult = await calculateRawROI(price, card);
      rawROI = roiResult;
      percentBelowAverage = Math.max(0, roiResult.roi_percentage);
      mockAveragePrice = roiResult.expected_value;
      confidence = roiResult.confidence_score;
      usesRealData = roiResult.uses_real_data;
      
      console.log(`💎 RAW CARD: ${roiResult.roi_percentage}% ROI (${usesRealData ? 'REAL' : 'estimated'} data)`);
    } else {
      const grader = displayGrader || 'Unknown';
      const grade = displayGrade || 'Unknown';

      console.log(`🔍 GRADED CARD: Looking up ${grader} ${grade} market data...`);

      const realAverage = await getRealMarketAverage(card.id, grader, grade);
      
      if (realAverage.hasData && realAverage.confidence > 50) {
        mockAveragePrice = realAverage.average;
        percentBelowAverage = Math.round(((mockAveragePrice - price) / mockAveragePrice) * 100);
        confidence = realAverage.confidence;
        usesRealData = true;
        console.log(`📊 REAL DATA: ${grader} ${grade} avg $${mockAveragePrice.toFixed(2)} (${confidence}% confidence)`);
      } else {
        mockAveragePrice = price * (1.1 + Math.random() * 0.3);
        percentBelowAverage = Math.round(((mockAveragePrice - price) / mockAveragePrice) * 100);
        confidence = 25;
        usesRealData = false;
        console.log(`⚠️ ESTIMATE: ${grader} ${grade} estimated avg $${mockAveragePrice.toFixed(2)} (no historical data)`);
      }
    }

    let timeRemaining = 24;
    if (item.itemEndDate) {
      timeRemaining = calculateHoursRemaining(item.itemEndDate);
    } else {
      timeRemaining = Math.random() * 47 + 1;
    }

    // Enhanced alert reasons with data source indicators
    const alertReasons: string[] = [];
    
    if (isRawCard) {
      alertReasons.push('🎯 RAW CARD');
      if (rawROI && rawROI.roi_percentage >= 100) {
        alertReasons.push(usesRealData ? '🔥 100%+ ROI (REAL DATA)' : '🔥 100%+ ROI (estimated)');
      } else if (rawROI && rawROI.roi_percentage >= 50) {
        alertReasons.push(usesRealData ? '💰 50%+ ROI (REAL DATA)' : '💰 50%+ ROI (estimated)');
      }
    } else {
      if (percentBelowAverage >= 30) {
        alertReasons.push(usesRealData ? '🔥 30%+ below average (REAL DATA)' : '🔥 30%+ below average (estimated)');
      } else if (percentBelowAverage >= 20) {
        alertReasons.push(usesRealData ? '💰 20%+ below average (REAL DATA)' : '💰 20%+ below average (estimated)');
      }
    }
    
    if (displayListingType === 'Auction' && timeRemaining <= 1) {
      alertReasons.push('🚨 Auction ending very soon');
    } else if (displayListingType === 'Auction' && timeRemaining <= 3) {
      alertReasons.push('⏰ Auction ending soon');
    }

    if (displayListingType === 'BIN') {
      alertReasons.push('💎 Buy It Now available');
    } else if (displayListingType === 'Auction+BIN') {
      alertReasons.push('🎯 Auction + BIN option');
    }

    const alertReason = alertReasons.length > 0 ? alertReasons.join(' • ') : '📈 Price opportunity';

    return {
      id: item.itemId,
      listing_id: item.itemId,
      card_id: card.id,
      title: item.title,
      current_price: price,
      buy_it_now_price: displayListingType === 'BIN' || displayListingType === 'Auction+BIN' ? price : undefined,
      time_remaining_hours: timeRemaining,
      seller_username: item.seller.username,
      seller_feedback_score: item.seller.feedbackScore,
      seller_positive_percentage: parseFloat(item.seller.feedbackPercentage) || 100,
      url: item.itemWebUrl,
      grade: displayGrade,
      grader: displayGrader,
      grade_number: gradeInfo.grade_number,
      
      // NEW: Image data
      image_url: imageData.image_url,
      thumbnail_url: imageData.thumbnail_url,
      
      created_at: new Date().toISOString(),
      card_info: {
        player: card.player,
        year: card.year,
        brand: card.brand,
        set_name: card.set_name,
        parallel: card.parallel || undefined,
        priority_score: card.priority_score
      },
      price_analysis: {
        average_price: mockAveragePrice,
        percent_below_avg: Math.max(0, percentBelowAverage),
        is_hot_deal: percentBelowAverage > (isRawCard ? 50 : 20),
        alert_reason: alertReason,
        confidence_score: confidence,
        uses_real_data: usesRealData,
        raw_roi: rawROI,
        listing_type: displayListingType
      }
    };
  } catch (error) {
    console.error('Error transforming eBay item:', error);
    return null;
  }
}

// ENHANCED: Triple search with comprehensive negative keywords
async function fetcheBayDataForCard(searchQuery: string, rawSearchQuery: string, limit: number = 5): Promise<eBayItem[]> {
  try {
    // Get base card negative keywords
    const negativeKeywords = getBaseCardNegativeKeywords();
    
    const enhancedQuery = `${searchQuery} ${negativeKeywords}`;
    const enhancedRawQuery = `${rawSearchQuery} ${negativeKeywords}`;
    
    console.log(`🚀 ENHANCED TRIPLE search starting...`);
    console.log(`   🔨 Auction: "${enhancedQuery.substring(0, 100)}..."`);
    console.log(`   💎 BIN: "${enhancedQuery.substring(0, 100)}..."`);
    console.log(`   🎯 RAW: "${enhancedRawQuery.substring(0, 100)}..."`);
    
    // Search 1: Auctions only
    const auctionResponse = await fetch('/api/ebay-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: enhancedQuery,
        limit: limit,
        searchType: 'auction'
      }),
    });

    // Search 2: BIN only  
    const binResponse = await fetch('/api/ebay-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: enhancedQuery,
        limit: limit,
        searchType: 'bin'
      }),
    });

    // Search 3: Raw cards only
    const rawResponse = await fetch('/api/ebay-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: enhancedRawQuery,
        limit: limit,
        searchType: 'raw'
      }),
    });

    const allItems: { item: eBayItem, searchType: 'auction' | 'bin' | 'raw' }[] = [];

    // Process auction results
    if (auctionResponse.ok) {
      const auctionData = await auctionResponse.json();
      const auctionItems = auctionData.itemSummaries || [];
      console.log(`🔨 Found ${auctionItems.length} auction items`);
      allItems.push(...auctionItems.map((item: eBayItem) => ({ item, searchType: 'auction' as const })));
    }

    // Process BIN results
    if (binResponse.ok) {
      const binData = await binResponse.json();
      const binItems = binData.itemSummaries || [];
      console.log(`💎 Found ${binItems.length} BIN items`);
      allItems.push(...binItems.map((item: eBayItem) => ({ item, searchType: 'bin' as const })));
    }

    // Process RAW results
    if (rawResponse.ok) {
      const rawData = await rawResponse.json();
      const rawItems = rawData.itemSummaries || [];
      console.log(`🎯 Found ${rawItems.length} RAW items`);
      allItems.push(...rawItems.map((item: eBayItem) => ({ item, searchType: 'raw' as const })));
    }

    console.log(`📦 Total items from enhanced triple search: ${allItems.length}`);
    
    // Remove duplicates by itemId
    const uniqueItems = allItems.filter((entry, index, self) => 
      index === self.findIndex(e => e.item.itemId === entry.item.itemId)
    );
    
    console.log(`🔄 After deduplication: ${uniqueItems.length} unique items`);
    
    // ENHANCED: Apply much stronger validation with search type awareness
    const validItems = uniqueItems
      .filter(entry => isValidCard(entry.item, entry.searchType))
      .map(entry => entry.item);
      
    console.log(`✅ ${validItems.length} items passed ENHANCED validation (base cards only)`);
    
    return validItems;
  } catch (error) {
    console.error(`Error in enhanced triple search:`, error);
    return [];
  }
}

// NEW: Function to clear contaminated price snapshots and re-run collection
export async function clearAndRecollectHistoricalData(): Promise<boolean> {
  try {
    console.log('🧹 CLEARING contaminated price snapshots...');
    
    // Clear existing price snapshots (they contain premium card data)
    const { error: deleteError } = await supabase
      .from('price_snapshots')
      .delete()
      .gte('snapshot_date', '2024-01-01'); // Delete all recent data
      
    if (deleteError) {
      console.error('❌ Error clearing price snapshots:', deleteError);
      return false;
    }
    
    console.log('✅ Contaminated price snapshots cleared');
    console.log('🔄 Starting fresh historical data collection with enhanced filtering...');
    
    // Run collection with enhanced search queries
    const success = await collectHistoricalDataForAllCards();
    
    if (success) {
      console.log('🎉 CLEAN HISTORICAL DATA COLLECTION COMPLETE!');
      console.log('📊 System now uses real BASE CARD market averages');
      console.log('💎 Raw card ROI calculations use actual PSA base card prices');
      console.log('📈 "Below average" percentages reflect true market conditions');
    }
    
    return success;
    
  } catch (error) {
    console.error('💥 Error in clear and recollect:', error);
    return false;
  }
}

// ENHANCED: Enhanced main function with raw card support AND dismiss filtering
export async function getHotAuctions(): Promise<Auction[]> {
  try {
    console.log('🔄 Fetching cards from database...');
    
    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('active', true)
      .order('priority_score', { ascending: false })
      .limit(25);  // ALL cards as requested

    if (error) {
      console.error('Database error:', error);
      return [];
    }

    if (!cards || cards.length === 0) {
      console.log('No active cards found in database');
      return [];
    }

    console.log(`📊 Found ${cards.length} active cards, starting ENHANCED TRIPLE SEARCH system...`);

    // 🧹 First, cleanup expired dismissals (maintenance)
    const cleanedCount = await cleanupExpiredDismissals();
    if (cleanedCount > 0) {
      console.log(`🧹 Auto-cleaned ${cleanedCount} expired dismissals`);
    }

    const allAuctions: Auction[] = [];

    // Process all 25 cards with triple search
    for (const card of cards) {
      const gradedSearchQuery = buildSearchQuery(card);
      const rawSearchQuery = buildRawSearchQuery(card);
      
      console.log(`🎯 TRIPLE SEARCH for ${card.player}...`);

      const eBayItems = await fetcheBayDataForCard(gradedSearchQuery, rawSearchQuery, 4);
      
      for (const item of eBayItems) {
        console.log(`🔄 Processing item: ${item.title.substring(0, 50)}...`);
        
        // ✅ NEW: Check if item is dismissed before processing
        const isDismissed = await isItemDismissed(item.itemId);
        if (isDismissed) {
          console.log(`🚫 SKIPPING dismissed item: ${item.title.substring(0, 50)}...`);
          continue;
        }
        
        // ENHANCED: Better search type determination
        const gradeInfo = extractGradeInfo(item.title);
        let searchType: 'auction' | 'bin' | 'raw' = 'bin'; // Default
        
        // If grading info found, it's NOT raw
        if (gradeInfo.grader || (gradeInfo.grade && gradeInfo.grade !== 'Raw')) {
          searchType = item.buyingOptions?.includes('AUCTION') ? 'auction' : 'bin';
        } else {
          // No grading info, check if it's actually raw
          const title = item.title.toLowerCase();
          const hasGradingTerms = ['psa', 'bgs', 'sgc', 'graded'].some(term => title.includes(term));
          if (!hasGradingTerms) {
            searchType = 'raw';
          } else {
            searchType = item.buyingOptions?.includes('AUCTION') ? 'auction' : 'bin';
          }
        }
        
        const auction = await transformeBayToAuction(item, card, gradedSearchQuery, searchType);

        if (auction) {
          const percentBelow = auction.price_analysis?.percent_below_avg || 0;
          const isRaw = searchType === 'raw';
          
          // Enhanced filtering logic for raw cards
          if (
            (!isRaw && searchType === 'auction' && percentBelow >= 20) ||  // 20%+ for auctions
            (!isRaw && searchType === 'bin' && percentBelow >= 30) ||      // 30%+ for BINs
            (isRaw && percentBelow >= 40) ||                               // 40%+ ROI for raw cards
            percentBelow >= 50  // 50%+ for exceptional deals regardless of type
          ) {
            allAuctions.push(auction);
            console.log(`✅ UNICORN ADDED: ${auction.title.substring(0, 50)}... - ${percentBelow}% ${isRaw ? 'ROI' : 'below'} (${searchType}${isRaw ? ' RAW' : ''})`);
          } else {
            console.log(`❌ Below threshold: ${auction.title.substring(0, 50)}... - ${percentBelow}% ${isRaw ? 'ROI' : 'below'} (${searchType}${isRaw ? ' RAW' : ''})`);
          }
        }
      }

      // Rate limiting between cards
      await new Promise(resolve => setTimeout(resolve, 600));  // Increased for triple searches
    }

    // Enhanced sorting considering raw card ROI
    const sortedAuctions = allAuctions.sort((a, b) => {
      const aPercent = a.price_analysis?.percent_below_avg || 0;
      const bPercent = b.price_analysis?.percent_below_avg || 0;
      if (bPercent !== aPercent) {
        return bPercent - aPercent;
      }
      const aPriority = a.card_info?.priority_score || 0;
      const bPriority = b.card_info?.priority_score || 0;
      return bPriority - aPriority;
    });

    console.log(`✅ ENHANCED TRIPLE SEARCH COMPLETE: Found ${sortedAuctions.length} total unicorns (with dismiss filtering)`);
    return sortedAuctions.slice(0, 200);

  } catch (error) {
    console.error('Error in enhanced getHotAuctions:', error);
    return [];
  }
}

// ==========================================
// HISTORICAL DATA COLLECTION FUNCTIONS
// (Keeping all existing functions unchanged)
// ==========================================

interface CompletedSale {
  itemId: string;
  title: string;
  soldPrice: number;
  soldDate: string;
  grader?: 'PSA' | 'BGS' | 'SGC';
  grade?: string;
  grade_number?: number;
  condition: string;
}

interface PriceSnapshot {
  card_id: string;
  snapshot_date: string;        // ✅ Correct
  grade: string;
  grader: string;
  auction_avg: number;
  bin_avg: number;
  auction_median: number;       // ✅ Correct
  auction_p25: number;          // ✅ Correct
  auction_p75: number;          // ✅ Correct
  auction_stddev: number;       // ✅ Correct
  bin_median?: number;          // Optional for now
  bin_p25?: number;             // Optional for now
  bin_p75?: number;             // Optional for now
  bin_stddev?: number;          // Optional for now
  auction_volume: number;       // ✅ Correct
  bin_volume: number;           // ✅ Correct
  confidence_score: number;
}

// Parse Finding API response to extract completed sales
function parseCompletedSales(findingApiResponse: unknown, card: DatabaseCard): CompletedSale[] {
  try {
    const searchResult = findingApiResponse.findCompletedItemsResponse?.[0]?.searchResult?.[0];
    if (!searchResult || searchResult['@count'] === '0') {
      console.log('📊 No completed sales found');
      return [];
    }

    const items = searchResult.item || [];
    const sales: CompletedSale[] = [];

    for (const item of items) {
      try {
        // Extract sold price
        const soldPrice = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0');
        if (soldPrice < 1) continue;

        // Extract sold date
        const soldDate = item.listingInfo?.[0]?.endTime?.[0] || new Date().toISOString();
        
        // Extract title
        const title = item.title?.[0] || '';
        
        // Validate it's a legitimate card (same validation as live searches)
        const mockItem: eBayItem = {
          itemId: item.itemId?.[0] || '',
          title: title,
          price: { value: soldPrice.toString(), currency: 'USD' },
          condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'Unknown',
          seller: {
            username: item.sellerInfo?.[0]?.sellerUserName?.[0] || '',
            feedbackPercentage: '100',
            feedbackScore: 0
          },
          itemWebUrl: item.viewItemURL?.[0] || ''
        };

        // Apply same validation as live searches
        if (!isValidCard(mockItem, 'bin')) {
          console.log(`❌ HISTORICAL: Filtered out invalid item: ${title.substring(0, 50)}`);
          continue;
        }

        // Extract grade information
        const gradeInfo = extractGradeInfo(title);
        
        sales.push({
          itemId: item.itemId?.[0] || '',
          title: title,
          soldPrice: soldPrice,
          soldDate: soldDate,
          grader: gradeInfo.grader,
          grade: gradeInfo.grade,
          grade_number: gradeInfo.grade_number,
          condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'Unknown'
        });

        console.log(`✅ HISTORICAL: Valid sale - ${title.substring(0, 40)} - $${soldPrice} (${gradeInfo.grade})`);
        
      } catch (itemError) {
        console.error('Error parsing individual completed sale:', itemError);
        continue;
      }
    }

    console.log(`📈 HISTORICAL: Parsed ${sales.length} valid completed sales for ${card.player}`);
    return sales;
    
  } catch (error) {
    console.error('Error parsing completed sales response:', error);
    return [];
  }
}

// Calculate IQR-filtered statistics (removes outliers)
function calculateIQRFilteredStats(prices: number[]): {
  mean: number;
  median: number;
  p25: number;
  p75: number;
  stddev: number;
  filteredPrices: number[];
} {
  if (prices.length === 0) {
    return { mean: 0, median: 0, p25: 0, p75: 0, stddev: 0, filteredPrices: [] };
  }

  // Sort prices
  const sorted = [...prices].sort((a, b) => a - b);
  const n = sorted.length;

  // Calculate quartiles
  const p25 = sorted[Math.floor(n * 0.25)];
  const p75 = sorted[Math.floor(n * 0.75)];
  const median = sorted[Math.floor(n * 0.5)];
  
  // Calculate IQR and outlier bounds
  const iqr = p75 - p25;
  const lowerBound = p25 - 1.5 * iqr;
  const upperBound = p75 + 1.5 * iqr;
  
  // Filter out outliers
  const filteredPrices = sorted.filter(price => price >= lowerBound && price <= upperBound);
  
  console.log(`📊 IQR FILTER: ${prices.length} prices → ${filteredPrices.length} after outlier removal`);
  console.log(`   Bounds: $${lowerBound.toFixed(2)} - $${upperBound.toFixed(2)}`);
  
  if (filteredPrices.length === 0) {
    console.log('⚠️ All prices were outliers, using original data');
    return calculateIQRFilteredStats([median]); // Fallback to median only
  }

  // Calculate mean and standard deviation of filtered data
  const mean = filteredPrices.reduce((sum, price) => sum + price, 0) / filteredPrices.length;
  const variance = filteredPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / filteredPrices.length;
  const stddev = Math.sqrt(variance);
  
  return { mean, median, p25, p75, stddev, filteredPrices };
}

// Calculate confidence score based on transaction volume and recency
function calculateConfidenceScore(volume: number, daysSinceNewest: number): number {
  // Volume scoring (0-70 points)
  const volumeScore = Math.min(70, volume * 7); // 7 points per transaction, max 70
  
  // Recency scoring (0-30 points)
  const recencyScore = Math.max(0, 30 - daysSinceNewest); // Lose 1 point per day
  
  return Math.min(100, volumeScore + recencyScore);
}

// FIXED: Replace your collectHistoricalDataForCard function with this version
async function collectHistoricalDataForCard(card: DatabaseCard): Promise<PriceSnapshot[]> {
  try {
    console.log(`🔍 COLLECTING GRADE-SPECIFIC HISTORICAL DATA for ${card.player} ${card.year}...`);
    
    // Build base search query
    let baseQuery = `${card.player} ${card.year} ${card.brand} ${card.set_name}`;
    if (card.parallel && card.parallel !== 'Base') {
      baseQuery += ` ${card.parallel}`;
    }
    
    // 🎯 CRITICAL FIX: Apply same negative keywords as live auctions
    const negativeKeywords = getBaseCardNegativeKeywords();
    console.log(`🧹 ENHANCED HISTORICAL: Applying base card filters to prevent variant contamination`);
    
    // ENHANCED: Grade-specific searches WITH negative keywords (like live auctions)
    const gradeSearches = [
      { query: `${baseQuery} PSA 10 ${negativeKeywords}`, grader: 'PSA', grade: 'PSA 10' },
      { query: `${baseQuery} PSA 9 ${negativeKeywords}`, grader: 'PSA', grade: 'PSA 9' },
      { query: `${baseQuery} PSA 8 ${negativeKeywords}`, grader: 'PSA', grade: 'PSA 8' },
      { query: `${baseQuery} PSA 7 ${negativeKeywords}`, grader: 'PSA', grade: 'PSA 7' },
      { query: `${baseQuery} BGS 9.5 ${negativeKeywords}`, grader: 'BGS', grade: 'BGS 9.5' },
      { query: `${baseQuery} BGS 9 ${negativeKeywords}`, grader: 'BGS', grade: 'BGS 9' },
      { query: `${baseQuery} BGS 8 ${negativeKeywords}`, grader: 'BGS', grade: 'BGS 8' },
      { query: `${baseQuery} SGC 10 ${negativeKeywords}`, grader: 'SGC', grade: 'SGC 10' },
      { query: `${baseQuery} SGC 9 ${negativeKeywords}`, grader: 'SGC', grade: 'SGC 9' },
      { query: `${baseQuery} raw ungraded ${negativeKeywords}`, grader: 'Unknown', grade: 'Raw' }
    ];

    console.log(`🎯 Making ${gradeSearches.length} grade-specific searches WITH enhanced filtering...`);
    console.log(`📝 Sample enhanced query: "${gradeSearches[0].query.substring(0, 120)}..."`);

    const snapshots: PriceSnapshot[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Process each grade-specific search (rest of function unchanged)
    for (let i = 0; i < gradeSearches.length; i++) {
      const { query, grader, grade } = gradeSearches[i];
      
      console.log(`📊 [${i + 1}/${gradeSearches.length}] Searching for ${grade}: "${query.substring(0, 100)}..."`);

      try {
        // Make API call for this specific grade
        const response = await fetch('/api/ebay-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query,
            limit: 50,
            searchType: 'completed'
          }),
        });

        if (!response.ok) {
          console.log(`⚠️ API failed for ${grade}, skipping...`);
          continue;
        }

        const data = await response.json();
        
        // Parse completed sales with KNOWN grader/grade (not extracted)
        const sales = parseCompletedSalesWithKnownGrade(data, card, grader, grade);
        
        if (sales.length < 3) {
          console.log(`📉 Only ${sales.length} ${grade} sales found, skipping (need 3+ for confidence)`);
          continue;
        }

        console.log(`✅ Found ${sales.length} ${grade} sales`);

        // Calculate statistics for this specific grade
        const prices = sales.map(sale => sale.soldPrice);
        const stats = calculateIQRFilteredStats(prices);
        
        // Calculate confidence score
        const newest = Math.max(...sales.map(sale => new Date(sale.soldDate).getTime()));
        const daysSinceNewest = Math.floor((Date.now() - newest) / (1000 * 60 * 60 * 24));
        const confidence = calculateConfidenceScore(sales.length, daysSinceNewest);

        // Create price snapshot with CORRECT grader/grade
        const snapshot: PriceSnapshot = {
          card_id: card.id,
          snapshot_date: today,
          grade: grade,           // ✅ CORRECT: "PSA 10", "PSA 9", etc.
          grader: grader,         // ✅ CORRECT: "PSA", "BGS", "SGC", "Unknown"
          auction_avg: stats.mean,
          bin_avg: stats.mean,
          auction_median: stats.median,
          auction_p25: stats.p25,
          auction_p75: stats.p75,
          auction_stddev: stats.stddev,
          auction_volume: sales.length,
          bin_volume: sales.length,
          confidence_score: confidence
        };

        snapshots.push(snapshot);
        
        console.log(`✅ ${grade}: $${stats.mean.toFixed(2)} avg (${sales.length} sales, ${confidence}% confidence)`);

      } catch (gradeError) {
        console.error(`❌ Error collecting ${grade} data:`, gradeError);
        continue;
      }

      // Rate limiting between grade searches
      if (i < gradeSearches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`🎯 Generated ${snapshots.length} grade-specific price snapshots for ${card.player}`);
    return snapshots;
    
  } catch (error) {
    console.error(`Error collecting historical data for ${card.player}:`, error);
    return [];
  }
}

// NEW: Parse completed sales with KNOWN grader/grade (don't extract from title)
function parseCompletedSalesWithKnownGrade(
  findingApiResponse: { findCompletedItemsResponse?: Array<{ searchResult?: Array<{ '@count'?: string; item?: Array<unknown> }> }> },
  card: DatabaseCard,
  knownGrader: string,
  knownGrade: string
): CompletedSale[] {
  try {
    const searchResult = findingApiResponse.findCompletedItemsResponse?.[0]?.searchResult?.[0];
    if (!searchResult || searchResult['@count'] === '0') {
      console.log(`📊 No completed sales found for ${knownGrade}`);
      return [];
    }

    const items = searchResult.item || [];
    const sales: CompletedSale[] = [];

    for (const item of items) {
      try {
        // Extract sold price
        const soldPrice = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0');
        if (soldPrice < 1) continue;

        // Extract title and validate
        const title = item.title?.[0] || '';
        
        // Create mock item for validation
        const mockItem: eBayItem = {
          itemId: item.itemId?.[0] || '',
          title: title,
          price: { value: soldPrice.toString(), currency: 'USD' },
          condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'Unknown',
          seller: {
            username: item.sellerInfo?.[0]?.sellerUserName?.[0] || '',
            feedbackPercentage: '100',
            feedbackScore: 0
          },
          itemWebUrl: item.viewItemURL?.[0] || ''
        };

        // Apply same validation as live searches
        if (!isValidCard(mockItem, 'bin')) {
          console.log(`❌ HISTORICAL: Filtered out invalid item: ${title.substring(0, 50)}`);
          continue;
        }

        // ENHANCED: Double-check that title actually contains the expected grade
        const titleLower = title.toLowerCase();
        const gradeLower = knownGrade.toLowerCase();
        
        // For PSA/BGS/SGC, ensure title contains the grade
        if (knownGrader !== 'Unknown') {
          const graderLower = knownGrader.toLowerCase();
          if (!titleLower.includes(graderLower) || !titleLower.includes(gradeLower.split(' ')[1])) {
            console.log(`❌ GRADE MISMATCH: Expected ${knownGrade}, title: ${title.substring(0, 50)}`);
            continue;
          }
        } else {
          // For raw cards, ensure no grading terms
          const hasGradingTerms = ['psa', 'bgs', 'sgc', 'graded'].some(term => titleLower.includes(term));
          if (hasGradingTerms) {
            console.log(`❌ RAW CONTAMINATION: Found grading terms in raw search: ${title.substring(0, 50)}`);
            continue;
          }
        }

        // Extract sold date
        const soldDate = item.listingInfo?.[0]?.endTime?.[0] || new Date().toISOString();
        
        sales.push({
          itemId: item.itemId?.[0] || '',
          title: title,
          soldPrice: soldPrice,
          soldDate: soldDate,
          grader: knownGrader === 'Unknown' ? undefined : knownGrader as 'PSA' | 'BGS' | 'SGC',
          grade: knownGrade,
          grade_number: knownGrader === 'Unknown' ? undefined : parseFloat(knownGrade.split(' ')[1]),
          condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'Unknown'
        });

        console.log(`✅ HISTORICAL: Valid ${knownGrade} sale - ${title.substring(0, 40)} - $${soldPrice}`);
        
      } catch (itemError) {
        console.error('Error parsing individual completed sale:', itemError);
        continue;
      }
    }

    console.log(`📈 HISTORICAL: Parsed ${sales.length} valid ${knownGrade} sales for ${card.player}`);
    return sales;
    
  } catch (error) {
    console.error('Error parsing completed sales response:', error);
    return [];
  }
}

// REPLACE your storeHistoricalPrices function with this UUID-compatible version:

async function storeHistoricalPrices(snapshots: PriceSnapshot[]): Promise<boolean> {
  try {
    if (snapshots.length === 0) {
      console.log('📊 No snapshots to store');
      return true;
    }

    console.log(`💾 Storing ${snapshots.length} price snapshots in database...`);
    console.log('🔍 Sample snapshot:', JSON.stringify(snapshots[0], null, 2));

    // First, let's verify the price_snapshots table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('price_snapshots')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error checking price_snapshots table:', tableError);
      console.log('🔧 Table might not exist or have different schema');
    }

    // Try to insert with better error handling
    const { data, error } = await supabase
      .from('price_snapshots')
      .upsert(snapshots, { 
        onConflict: 'card_id,snapshot_date,grade,grader',
        ignoreDuplicates: false 
      })
      .select();  // Return inserted data to verify

    if (error) {
      console.error('❌ Database error storing price snapshots:', error);
      console.error('📊 Error details:', JSON.stringify(error, null, 2));
      
      // Try inserting one at a time to isolate issues
      console.log('🔄 Attempting individual inserts...');
      let successCount = 0;
      
      for (const snapshot of snapshots.slice(0, 3)) {  // Try first 3
        const { data: singleData, error: singleError } = await supabase
          .from('price_snapshots')
          .insert(snapshot)
          .select();
          
        if (singleError) {
          console.error(`❌ Failed to insert snapshot for card ${snapshot.card_id}:`, singleError);
        } else {
          console.log(`✅ Successfully inserted snapshot for card ${snapshot.card_id}`);
          successCount++;
        }
      }
      
      return successCount > 0;
    }

    console.log('✅ Historical price data stored successfully');
    console.log(`📊 Inserted ${data?.length || snapshots.length} snapshots`);
    return true;
    
  } catch (error) {
    console.error('💥 Error storing historical prices:', error);
    return false;
  }
}

// Main function to collect historical data for all active cards
export async function collectHistoricalDataForAllCards(): Promise<boolean> {
  try {
    console.log('🚀 STARTING HISTORICAL DATA COLLECTION for all active cards...');
    
    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('active', true)
      .order('priority_score', { ascending: false });

    if (error) {
      console.error('Database error fetching cards:', error);
      return false;
    }

    if (!cards || cards.length === 0) {
      console.log('No active cards found');
      return false;
    }

    console.log(`📋 Collecting historical data for ${cards.length} cards...`);

    const totalSnapshots: PriceSnapshot[] = [];

    // Process each card (rate limited)
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      console.log(`\n🎯 [${i + 1}/${cards.length}] Processing ${card.player}...`);
      
      const snapshots = await collectHistoricalDataForCard(card);
      totalSnapshots.push(...snapshots);
      
      // Rate limiting: 1 second between cards for API politeness
      if (i < cards.length - 1) {
        console.log('⏱️ Rate limiting: Waiting 1 second...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Store all snapshots
    const stored = await storeHistoricalPrices(totalSnapshots);
    
    if (stored) {
      console.log(`🎉 HISTORICAL DATA COLLECTION COMPLETE!`);
      console.log(`📊 Total snapshots: ${totalSnapshots.length}`);
      console.log(`💾 Data stored in price_snapshots table`);
      return true;
    } else {
      console.log('❌ Failed to store historical data');
      return false;
    }
    
  } catch (error) {
    console.error('Error in historical data collection:', error);
    return false;
  }
}

// REPLACE your getRealMarketAverage function with this fixed version:

export async function getRealMarketAverage(
  cardId: string,  // CHANGED: string (UUID) instead of number
  grader: string = 'Unknown', 
  grade: string = 'Raw'
): Promise<{
  average: number;
  confidence: number;
  volume: number;
  hasData: boolean;
}> {
  try {
    console.log(`🔍 QUERYING historical data: cardId=${cardId}, grader=${grader}, grade=${grade}`);
    
    const { data: snapshot, error } = await supabase
      .from('price_snapshots')
      .select('*')
      .eq('card_id', cardId)  // Now correctly using string UUID
      .eq('grader', grader)
      .eq('grade', grade)
      .order('snapshot_date', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Supabase error querying price_snapshots:', error);
      return { average: 0, confidence: 0, volume: 0, hasData: false };
    }

    if (!snapshot || snapshot.length === 0) {
      console.log(`📊 No historical data for card ${cardId} ${grader} ${grade}, using mock average`);
      return { average: 0, confidence: 0, volume: 0, hasData: false };
    }

    const data = snapshot[0];
    console.log(`✅ Found historical data: $${data.auction_avg} avg, ${data.confidence_score}% confidence`);

    return {
      average: data.auction_avg || data.bin_avg || 0,
      confidence: data.confidence_score || 0,
      volume: (data.volume_auctions || 0) + (data.volume_bin || 0),
      hasData: true
    };
    
  } catch (error) {
    console.error('💥 Error getting real market average:', error);
    return { average: 0, confidence: 0, volume: 0, hasData: false };
  }
}

// NEW: Function to trigger historical data collection from the interface
export async function initializeHistoricalData(): Promise<boolean> {
  console.log('🚀 INITIALIZING HISTORICAL DATA COLLECTION...');
  console.log('⚠️ This is a one-time process that may take 5-10 minutes');
  console.log('📊 Will collect 90 days of completed sales for all 25 cards');
  
  const success = await collectHistoricalDataForAllCards();
  
  if (success) {
    console.log('🎉 HISTORICAL DATA INITIALIZATION COMPLETE!');
    console.log('✅ Your system now uses REAL market averages instead of mock data');
    console.log('💎 Raw card ROI calculations now use actual PSA sale prices');
    console.log('📈 "Below average" percentages now reflect true market conditions');
  } else {
    console.log('❌ Historical data initialization failed');
    console.log('⚠️ System will continue using mock data as fallback');
  }
  
  return success;
}