import { createClient } from '@supabase/supabase-js';
import { Auction } from '../types/auction';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DatabaseCard {
  id: number;
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

// Build search query for graded cards (existing)
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

// FIXED: Build raw card search query with better exclusion
function buildRawSearchQuery(card: DatabaseCard): string {
  const parts = [
    card.player,
    card.year.toString(),
    card.brand,
    card.set_name,
    'card',
    'ungraded'  // Positive indicator for raw cards
  ];
  
  if (card.parallel && card.parallel !== 'Base') {
    parts.push(card.parallel);
  }
  
  // REMOVED: eBay API exclusion syntax - will handle in validation instead
  
  return parts.join(' ');
}

// Calculate raw card ROI potential using mock PSA multipliers
function calculateRawROI(rawPrice: number, card: DatabaseCard): {
  roi_percentage: number;
  expected_value: number;
  grading_cost: number;
  potential_profit: number;
} {
  const gradingCost = 35; // $30 PSA Economy + $5 shipping/fees
  const ebayFees = 0.13; // 13% eBay + PayPal fees
  
  // Mock PSA value multipliers based on industry standards
  const mockPSAValues = {
    psa7: rawPrice * 2.0,   // PSA 7 = 2x raw price
    psa8: rawPrice * 3.5,   // PSA 8 = 3.5x raw price  
    psa9: rawPrice * 6.0,   // PSA 9 = 6x raw price
    psa10: rawPrice * 12.0  // PSA 10 = 12x raw price
  };
  
  // Expected value using industry success rates
  const expectedValue = 
    (0.05 * mockPSAValues.psa10) +  // 5% PSA 10
    (0.30 * mockPSAValues.psa9) +   // 30% PSA 9
    (0.50 * mockPSAValues.psa8) +   // 50% PSA 8
    (0.15 * mockPSAValues.psa7);    // 15% PSA 7
    
  const netExpectedValue = expectedValue * (1 - ebayFees);
  const totalCost = rawPrice + gradingCost;
  const potentialProfit = netExpectedValue - totalCost;
  const roiPercentage = (potentialProfit / totalCost) * 100;
  
  return {
    roi_percentage: Math.round(roiPercentage),
    expected_value: Math.round(netExpectedValue),
    grading_cost: gradingCost,
    potential_profit: Math.round(potentialProfit)
  };
}

// ENHANCED: Much stronger validation for raw cards
function isValidCard(item: eBayItem, searchType: 'auction' | 'bin' | 'raw' = 'auction'): boolean {
  const title = item.title.toLowerCase();
  
  console.log(`🔍 VALIDATING ${searchType.toUpperCase()} ITEM: "${item.title.substring(0, 50)}..."`);
  
  const price = parseFloat(
    item.currentBidPrice?.value ||
    item.price?.value ||
    '0'
  );
  
  console.log(`   💰 Price Analysis: ${price}`);
  
  if (price < 1) {
    console.log(`   ❌ REJECTED: Price too low (${price})`);
    return false;
  }
  if (price > 50000) {
    console.log(`   ❌ REJECTED: Price too high (${price})`);
    return false;
  }
  
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
  
  // ENHANCED: Much stronger validation for raw cards
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

// Enhanced transformation with raw card ROI
function transformeBayToAuction(item: eBayItem, card: DatabaseCard, searchQuery: string, searchType: 'auction' | 'bin' | 'raw'): Auction | null {
  try {
    const price = parseFloat(
      item.currentBidPrice?.value ||
      item.price?.value ||
      '0'
    );
    if (isNaN(price)) return null;

    const listingType = getListingType(item);
    const gradeInfo = extractGradeInfo(item.title);

    // Calculate mock "below average" percentage
    let mockAveragePrice: number;
    let percentBelowAverage: number;
    let rawROI = null;

    if (searchType === 'raw') {
      // For raw cards, calculate ROI instead of % below average
      rawROI = calculateRawROI(price, card);
      // Use ROI as "percentage below average" equivalent for filtering
      percentBelowAverage = Math.max(0, rawROI.roi_percentage);
      mockAveragePrice = rawROI.expected_value;
    } else {
      // For graded cards, use existing mock average logic
      mockAveragePrice = price * (1.2 + Math.random() * 0.4);
      percentBelowAverage = Math.round(((mockAveragePrice - price) / mockAveragePrice) * 100);
    }

    let timeRemaining = 24;
    if (item.itemEndDate) {
      timeRemaining = calculateHoursRemaining(item.itemEndDate);
    } else {
      timeRemaining = Math.random() * 47 + 1;
    }

    // Enhanced alert reasons for raw cards
    const alertReasons = [];
    
    if (searchType === 'raw') {
      alertReasons.push('🎯 RAW CARD');
      if (rawROI && rawROI.roi_percentage >= 50) {
        alertReasons.push('🔥 50%+ ROI potential');
      } else if (rawROI && rawROI.roi_percentage >= 40) {
        alertReasons.push('💰 40%+ ROI potential');
      }
    } else {
      if (percentBelowAverage >= 30) {
        alertReasons.push('🔥 30%+ below average');
      } else if (percentBelowAverage >= 20) {
        alertReasons.push('💰 20%+ below average');
      }
    }
    
    if (listingType === 'Auction' && timeRemaining <= 1) {
      alertReasons.push('🚨 Auction ending very soon');
    } else if (listingType === 'Auction' && timeRemaining <= 3) {
      alertReasons.push('⏰ Auction ending soon');
    }

    if (listingType === 'BIN') {
      alertReasons.push('💎 Buy It Now available');
    } else if (listingType === 'Auction+BIN') {
      alertReasons.push('🎯 Auction + BIN option');
    }

    const alertReason = alertReasons.length > 0 ? alertReasons.join(' • ') : '📈 Price opportunity';

    return {
      id: item.itemId,
      listing_id: item.itemId,
      card_id: card.id,
      title: item.title,
      current_price: price,
      buy_it_now_price: listingType === 'BIN' || listingType === 'Auction+BIN' ? price : undefined,
      time_remaining_hours: timeRemaining,
      seller_username: item.seller.username,
      seller_feedback_score: item.seller.feedbackScore,
      seller_positive_percentage: parseFloat(item.seller.feedbackPercentage) || 100,
      url: item.itemWebUrl,
      grade: gradeInfo.grade,
      grader: gradeInfo.grader,
      grade_number: gradeInfo.grade_number,
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
        is_hot_deal: percentBelowAverage > (searchType === 'raw' ? 40 : 20),
        alert_reason: alertReason,
        raw_roi: rawROI  // Include ROI calculation for raw cards
      }
    };
  } catch (error) {
    console.error('Error transforming eBay item:', error);
    return null;
  }
}

// Enhanced triple search function
async function fetcheBayDataForCard(searchQuery: string, rawSearchQuery: string, limit: number = 5): Promise<eBayItem[]> {
  try {
    const enhancedQuery = `${searchQuery} -lot -set -choose -pick -"you pick" -commons -base -collection`;
    const enhancedRawQuery = `${rawSearchQuery} -lot -set -choose -pick -"you pick" -commons -base -collection`;
    
    console.log(`🚀 TRIPLE search starting...`);
    console.log(`   🔨 Auction: "${enhancedQuery}"`);
    console.log(`   💎 BIN: "${enhancedQuery}"`);
    console.log(`   🎯 RAW: "${enhancedRawQuery}"`);
    
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

    let allItems: { item: eBayItem, searchType: 'auction' | 'bin' | 'raw' }[] = [];

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

    console.log(`📦 Total items from triple search: ${allItems.length}`);
    
    // Remove duplicates by itemId
    const uniqueItems = allItems.filter((entry, index, self) => 
      index === self.findIndex(e => e.item.itemId === entry.item.itemId)
    );
    
    console.log(`🔄 After deduplication: ${uniqueItems.length} unique items`);
    
    // ENHANCED: Apply stronger validation with search type awareness
    const validItems = uniqueItems
      .filter(entry => isValidCard(entry.item, entry.searchType))
      .map(entry => entry.item);
      
    console.log(`✅ ${validItems.length} items passed enhanced validation`);
    
    return validItems;
  } catch (error) {
    console.error(`Error in triple search:`, error);
    return [];
  }
}

// Enhanced main function with raw card support
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

    const allAuctions: Auction[] = [];

    // Process all 25 cards with triple search
    for (const card of cards) {
      const gradedSearchQuery = buildSearchQuery(card);
      const rawSearchQuery = buildRawSearchQuery(card);
      
      console.log(`🎯 TRIPLE SEARCH for ${card.player}...`);

      const eBayItems = await fetcheBayDataForCard(gradedSearchQuery, rawSearchQuery, 4);
      
      for (const item of eBayItems) {
        console.log(`🔄 Processing item: ${item.title.substring(0, 50)}...`);
        
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
        
        const auction = transformeBayToAuction(item, card, gradedSearchQuery, searchType);

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

    console.log(`✅ ENHANCED TRIPLE SEARCH COMPLETE: Found ${sortedAuctions.length} total unicorns (with improved raw card filtering)`);
    return sortedAuctions.slice(0, 200);

  } catch (error) {
    console.error('Error in enhanced getHotAuctions:', error);
    return [];
  }
}