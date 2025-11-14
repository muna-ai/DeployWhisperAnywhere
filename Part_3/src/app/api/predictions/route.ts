import { Muna } from 'muna';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const accessKey = process.env.MUNA_ACCESS_KEY;

    if (!accessKey) {
      return NextResponse.json(
        { error: 'MUNA_ACCESS_KEY not configured on server' },
        { status: 500 }
      );
    }

    // Create Muna client with server-side access key
    const muna = new Muna({ accessKey });

    // Parse JSON body (Muna SDK sends: { tag, clientId, configurationId })
    const body = await request.json();
    const { tag, clientId, configurationId } = body;

    console.log('Received prediction configuration request:', {
      tag,
      clientId,
      configurationId
    });

    // Make an authenticated request to Muna API to get configuration/resources
    // This returns the authentication token and model resources needed for
    // the browser to download the WASM model and run inference client-side
    // NOTE: We do NOT pass inputs here - they stay in the browser!
    const prediction = await muna.predictions.create({
      tag,
      clientId,           // Pass through browser's client ID (wasm32)
      configurationId,    // Pass through browser's configuration ID
      // Don't pass inputs - the browser will handle them locally
    });

    console.log('Configuration retrieved:', {
      hasConfiguration: !!prediction.configuration,
      resourceCount: prediction.resources?.length || 0
    });

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Prediction configuration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
