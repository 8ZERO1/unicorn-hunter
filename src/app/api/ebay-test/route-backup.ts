import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10, searchType = 'mixed' } = await request.json();
    
    console.log(`🔍 eBay API: ${searchType.toUpperCase()} search for:`, query);

    const applicationToken = await getApplicationToken();
    const ebayApiUrl = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
    
    const searchParams = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      category_ids: '212',
      sort: 'EndTimeSoonest'
    });

    // Apply filter based on search type
    if (searchType === 'auction') {
      searchParams.set('filter', 'buyingOptions:{AUCTION}');
      console.log('🔨 Searching auctions only');
    } else if (searchType === 'bin') {
      // For BIN search, we'll use no filter (defaults to BIN as we saw)
      console.log('💎 Searching BIN only');
    } else if (searchType === 'raw') {
      // NEW: Raw card search - no grading filters, broader condition search
      console.log('🎯 Searching RAW cards only');
      // Remove any grading company filters and use broader search
      searchParams.set('filter', 'conditionIds:{1000,1500,2000,2500,3000}'); // New to Like New conditions
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