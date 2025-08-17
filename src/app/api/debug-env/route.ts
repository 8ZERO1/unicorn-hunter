import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const devId = process.env.EBAY_DEV_ID;

    return NextResponse.json({
      clientIdPresent: !!clientId,
      clientIdLength: clientId?.length || 0,
      clientIdStart: clientId ? clientId.substring(0, 10) + '...' : 'MISSING',
      
      clientSecretPresent: !!clientSecret,
      clientSecretLength: clientSecret?.length || 0,
      
      devIdPresent: !!devId,
      devIdLength: devId?.length || 0,
      
      allEnvVarsPresent: !!(clientId && clientSecret && devId)
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}