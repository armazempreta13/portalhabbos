import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { planId, planName, price, userId } = await req.json();

    if (!userId || !planId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const numericPrice = parseFloat(price.replace(',', '.'));
    const token = process.env.MP_ACCESS_TOKEN || '';
    const isProductionToken = token.startsWith('APP_USR-');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
      ? process.env.NEXT_PUBLIC_APP_URL
      : 'http://localhost:3000';

    const body: any = {
      items: [{ id: planId, title: `Plano VIP ${planName} - HabboTop`, quantity: 1, unit_price: numericPrice }],
      external_reference: `${userId}|${planId}`,
      back_urls: {
        success: `${baseUrl}/vip?status=success`,
        failure: `${baseUrl}/vip?status=failure`,
        pending: `${baseUrl}/vip?status=pending`,
      },
    };

    if (!baseUrl.includes('localhost')) {
      body.auto_return = 'approved';
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MP API error:', data);
      return NextResponse.json({ error: data.message || 'MP API error' }, { status: 500 });
    }

    const checkoutUrl = isProductionToken ? data.init_point : data.sandbox_init_point;
    return NextResponse.json({ init_point: checkoutUrl });
  } catch (error: any) {
    console.error('Checkout error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
