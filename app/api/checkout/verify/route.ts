import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });
const WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || 'habbotop-mp-secret-2024';

export async function POST(req: Request) {
  try {
    const { payment_id } = await req.json();
    if (!payment_id) return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 });

    const payment = new Payment(client);
    const paymentData = await payment.get({ id: payment_id });

    if (paymentData.status === 'approved' && paymentData.external_reference) {
      const [userId, planId] = paymentData.external_reference.split('|');

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      // Bypass security rule locally using Webhook Secret
      await updateDoc(doc(db, 'users', userId), {
        isVip: true,
        vipType: planId,
        vipExpiresAt: expiresAt.toISOString(),
        webhookSecret: WEBHOOK_SECRET
      });

      const hotelsQuery = query(collection(db, 'hotels'), where('ownerId', '==', userId));
      const hotelsSnapshot = await getDocs(hotelsQuery);
      
      if (!hotelsSnapshot.empty) {
        const batch = writeBatch(db);
        hotelsSnapshot.docs.forEach((hotelDoc) => {
          batch.update(hotelDoc.ref, { 
            isVip: true,
            vipType: planId,
            webhookSecret: WEBHOOK_SECRET
          });
        });
        await batch.commit();
      }
      return NextResponse.json({ success: true, processed: true });
    }
    
    return NextResponse.json({ success: true, processed: false });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
