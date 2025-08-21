import { NextRequest, NextResponse } from 'next/server';

// Define interfaces for eBay API responses
interface EBayItemSummary {
  itemId: string;
  title: string;
  price?: {
    value: string;
    currency: string;
  };
  condition?: string;
  seller?: {
    username: string;
    feedbackPercentage?: string;
    feedbackScore?: number;
  };
  itemWebUrl: string;
  itemEndDate?: string;
  image?: {
    imageUrl: string;
  };
  buyingOptions?: string[];
}

interface EBayBrowseApiResponse {
  total?: number;
  itemSummaries?: EBayItemSummary[];
}

// Cache for application token
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getApplicationToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    console.log('🎫 Using cached application token');
    return cachedToken.token;
  }

  console.log('🔄 Generating new application token...');

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('eBay Client ID or Client Secret not found in environment variables');
  }

  // Create basic auth header
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  // Request application token from eBay
  const tokenResponse = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('❌ Token generation failed:', errorText);
    throw new Error(`Failed to get application token: ${tokenResponse.status} ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  console.log('✅ Application token generated successfully');

  // Cache the token (expires in seconds, we'll refresh 5 minutes early)
  const expiresInMs = (tokenData.expires_in - 300) * 1000; // 5 min buffer
  cachedToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + expiresInMs
  };

  return tokenData.access_token;
}

// FIXED: Replace Finding API with Browse API for completed sales
async function searchCompletedItems(query: string, applicationToken: string, limit: number = 20) {
  console.log('📈 HISTORICAL DATA: Using Browse API for completed sales:', query.substring(0, 100) + '...');
  
  const clientId = process.env.EBAY_CLIENT_ID;
  if (!clientId) {
    throw new Error('EBAY_CLIENT_ID not found in environment variables');
  }
  
  // Use Browse API endpoint (which you have access to)
  const browseApiUrl = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
  
  // ENHANCED: Clean query for Browse API (strip excessive negative keywords for API compatibility)
  const cleanQuery = query
    .replace(/-\w+/g, '') // Remove negative keywords for Browse API
    .replace(/\s+/g, ' ') // Clean up extra spaces
    .trim();
    
  console.log(`🧹 Cleaned query for Browse API: "${cleanQuery}"`);
  
  // Build search parameters for completed/sold items using Browse API
  const searchParams = new URLSearchParams({
    q: cleanQuery,
    limit: Math.min(limit, 200).toString(), // Browse API allows up to 200
    category_ids: '212', // Sports Trading Cards
    sort: 'EndTimeSoonest',
    // KEY FIX: Filter for sold items only - this gets completed sales
    filter: 'conditions:{USED,NEW},soldItems:true'
  });

  const fullUrl = `${browseApiUrl}?${searchParams}`;
  console.log('📡 Making Browse API request for completed sales');
  console.log('🔑 Using App ID:', clientId.substring(0, 8) + '...');

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${applicationToken}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Browse API Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Browse API Error Response:', errorText);
      
      // ENHANCED: Check for specific error types
      if (response.status === 403) {
        throw new Error(`Browse API Access Denied: Check your application permissions. Status: ${response.status}`);
      } else if (response.status === 400) {
        throw new Error(`Browse API Bad Request: Check query format or parameters. Status: ${response.status}`);
      } else {
        throw new Error(`Browse API Error: ${response.status} - ${errorText}`);
      }
    }

    const data: EBayBrowseApiResponse = await response.json();
    
    console.log('✅ HISTORICAL DATA: Found', data.total || 0, 'completed sales via Browse API');
    
    // Transform Browse API response to match Finding API format (for compatibility)
    const transformedData = {
      findCompletedItemsResponse: [{
        searchResult: [{
          '@count': (data.total || 0).toString(),
          item: (data.itemSummaries || []).map((item: { itemId?: string; title?: string; price?: { value: string; currency: string }; itemEndDate?: string; condition?: string; seller?: { username?: string }; itemWebUrl?: string }) => ({
            itemId: item.itemId || 'unknown',
            title: item.title || 'Unknown Title',
            sellingStatus: [{
              currentPrice: [{
                __value__: item.price?.value || '0.00',
                '@currencyId': item.price?.currency || 'USD'
              }]
            }],
            listingInfo: [{
              endTime: [item.itemEndDate || new Date().toISOString()]
            }],
            condition: [{
              conditionDisplayName: [item.condition || 'Used']
            }],
            sellerInfo: [{
              sellerUserName: [item.seller?.username || 'unknown_seller']
            }],
            viewItemURL: [item.itemWebUrl || `https://www.ebay.com/itm/${item.itemId}`]
          }))
        }]
      }],
      isRealData: true,
      hasResults: (data.total || 0) > 0,
      apiUsed: 'Browse API (soldItems filter)'
    };
    
    return transformedData;
    
  } catch (fetchError) {
    console.error('💥 Browse API Fetch Error:', fetchError);
    throw fetchError;
  }
}

// ENHANCED: Better query handling for Browse API
function enhanceBrowseApiQuery(query: string, searchType: string): string {
  // For Browse API, we can be more aggressive with negative keywords
  // but need to be careful not to exceed query length limits
  
  if (searchType === 'raw') {
    // For raw cards, focus on core terms and avoid grading terms
    const coreTerms = query
      .replace(/\s+/g, ' ')
      .split(' ')
      .slice(0, 6) // Take first 6 words to avoid length issues
      .join(' ');
      
    return `${coreTerms} -auto -autograph -patch -jersey -/25 -/50 -/99 -silver -gold -prizm`;
  } else {
    // For graded cards, use moderate negative keyword filtering
    const coreTerms = query
      .replace(/\s+/g, ' ')
      .split(' ')
      .slice(0, 8) // Take first 8 words
      .join(' ');
      
    return `${coreTerms} -auto -autograph -patch -jersey -/25 -/50`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10, searchType = 'mixed' } = await request.json();
    
    const applicationToken = await getApplicationToken();

    // FIXED: Handle completed sales with Browse API instead of Finding API
    if (searchType === 'completed') {
      console.log('🔍 REAL HISTORICAL DATA REQUEST for:', query);
      
      try {
        // Use Browse API with soldItems filter instead of Finding API
        const completedData = await searchCompletedItems(query, applicationToken, limit);
        
        // Check if we actually got real data
        const searchResult = completedData.findCompletedItemsResponse?.[0]?.searchResult?.[0];
        const count = parseInt(searchResult?.['@count'] || '0');
        
        if (count === 0) {
          console.log('📊 Browse API: No completed sales found for this search');
          console.log('✅ PREFERRED: Returning empty results (no mock data)');
          
          // Return properly formatted empty response
          return NextResponse.json({
            findCompletedItemsResponse: [{
              searchResult: [{
                '@count': '0',
                item: []
              }]
            }],
            isRealData: true,
            hasResults: false,
            apiUsed: 'Browse API (soldItems filter)'
          });
        }
        
        console.log(`✅ Browse API: Found ${count} real completed sales`);
        return NextResponse.json(completedData);
        
      } catch (browseError) {
        console.error('❌ Browse API failed for completed sales:', browseError);
        console.log('🚫 NO FALLBACK: Returning empty results instead of mock data');
        
        // Return empty results instead of mock data
        return NextResponse.json({
          findCompletedItemsResponse: [{
            searchResult: [{
              '@count': '0',
              item: []
            }]
          }],
          isRealData: false,
          hasResults: false,
          error: 'Browse API failed - no completed sales data available',
          apiUsed: 'Browse API (failed)'
        });
      }
    }
    
    // EXISTING: Browse API for live listings (unchanged from your original)
    console.log(`🔍 eBay API: ${searchType.toUpperCase()} search for:`, query.substring(0, 100) + '...');

    const ebayApiUrl = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
    
    // Enhanced query processing for Browse API
    const enhancedQuery = enhanceBrowseApiQuery(query, searchType);
    console.log(`🧹 Enhanced query: "${enhancedQuery}"`);
    
    const searchParams = new URLSearchParams({
      q: enhancedQuery,
      limit: limit.toString(),
      category_ids: '212',
      sort: 'EndTimeSoonest'
    });

    // Apply filter based on search type
    if (searchType === 'auction') {
      searchParams.set('filter', 'buyingOptions:{AUCTION}');
      console.log('🔨 Searching auctions only');
    } else if (searchType === 'bin') {
      console.log('💎 Searching BIN only');
    } else if (searchType === 'raw') {
      console.log('🎯 Searching RAW cards only');
      searchParams.set('filter', 'conditionIds:{1000,1500,2000,2500,3000}');
    } else {
      console.log('🔄 Mixed search (default)');
    }

    const fullUrl = `${ebayApiUrl}?${searchParams}`;
    
    const ebayResponse = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${applicationToken}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!ebayResponse.ok) {
      const errorText = await ebayResponse.text();
      console.error('❌ eBay API Error:', errorText);
      return NextResponse.json(
        { error: `eBay API Error: ${ebayResponse.status}`, details: errorText },
        { status: ebayResponse.status }
      );
    }

    const data = await ebayResponse.json();
    console.log(`✅ ${searchType.toUpperCase()} search found:`, data.total || 0, 'items');
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('💥 API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}