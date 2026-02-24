import { NextRequest, NextResponse } from 'next/server';

const LEMONSQUEEZY_API = 'https://api.lemonsqueezy.com/v1/licenses';
const API_KEY = process.env.LEMONSQUEEZY_API_KEY;

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { success: false, error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { action, licence_key } = body;

    if (!licence_key || typeof licence_key !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing licence key' },
        { status: 400 }
      );
    }

    if (action === 'activate') {
      const response = await fetch(`${LEMONSQUEEZY_API}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          license_key: licence_key,
          instance_name: 'binara-web',
        }),
      });

      const data = await response.json();

      if (data.activated || data.valid) {
        return NextResponse.json({ success: true });
      }

      return NextResponse.json({
        success: false,
        error: data.error || 'Invalid licence key',
      });
    }

    if (action === 'verify') {
      const response = await fetch(`${LEMONSQUEEZY_API}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          license_key: licence_key,
        }),
      });

      const data = await response.json();

      return NextResponse.json({
        success: true,
        valid: data.valid === true,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "activate" or "verify".' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
