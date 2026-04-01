import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

export async function POST(req: Request) {
  try {
    const { planId, planName, price, userId } = await req.json();

    if (!userId || !planId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const preference = new Preference(client);
    const numericPrice = parseFloat(price.replace(',', '.'));

    // Detect production by token prefix: APP_USR- = real, TEST- = sandbox
    const token = process.env.MP_ACCESS_TOKEN || '';
    const isProductionToken = token.startsWith('APP_USR-');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
      ? process.env.NEXT_PUBLIC_APP_URL
      : 'http://localhost:3000';

    const body: any = {
      items: [
        {
          id: planId,
          title: `Plano VIP ${planName} - HabboTop`,
          quantity: 1,
          unit_price: numericPrice,
        }
      ],
      external_reference: `${userId}|${planId}`,
      back_urls: {
        success: `${baseUrl}/vip?status=success`,
        failure: `${baseUrl}/vip?status=failure`,
        pending: `${baseUrl}/vip?status=pending`,
      },
    };

    // auto_return only works with non-localhost back_urls
    if (!baseUrl.includes('localhost')) {
      body.auto_return = 'approved';
    }

    const response = await preference.create({ body });

    // Use real init_point for production token, sandbox for test token
    const checkoutUrl = isProductionToken
      ? response.init_point
      : response.sandbox_init_point;

    return NextResponse.json({ init_point: checkoutUrl });
  } catch (error: any) {
    console.error('Checkout error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
