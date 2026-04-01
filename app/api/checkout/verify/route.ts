import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

export const runtime = 'edge';

const WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || 'habbotop-mp-secret-2024';

export async function POST(req: Request) {
  try {
    const { payment_id } = await req.json();
    if (!payment_id) return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 });

    const token = process.env.MP_ACCESS_TOKEN || '';
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const paymentData = await response.json();

    if ((paymentData.status === 'approved' || paymentData.status === 'pending') && paymentData.external_reference) {
      const [userId, planId] = paymentData.external_reference.split('|');
      if (!userId || !planId) return NextResponse.json({ success: true, processed: false });

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await updateDoc(doc(db, 'users', userId), {
        isVip: true,
        vipType: planId,
        vipExpiresAt: expiresAt.toISOString(),
        webhookSecret: WEBHOOK_SECRET,
        paymentStatus: paymentData.status,
      });

      const hotelsQuery = query(collection(db, 'hotels'), where('ownerId', '==', userId));
      const hotelsSnapshot = await getDocs(hotelsQuery);

      if (!hotelsSnapshot.empty) {
        const batch = writeBatch(db);
        hotelsSnapshot.docs.forEach((hotelDoc) => {
          batch.update(hotelDoc.ref, { isVip: true, vipType: planId, webhookSecret: WEBHOOK_SECRET });
        });
        await batch.commit();
      }

      return NextResponse.json({ success: true, processed: true, status: paymentData.status });
    }

    return NextResponse.json({ success: true, processed: false, status: paymentData.status });
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
