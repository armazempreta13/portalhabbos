import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });
const WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || 'habbotop-mp-secret-2024';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || url.searchParams.get('topic');
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id');

    if (type !== 'payment' || !dataId) {
      return NextResponse.json({ success: true, message: 'Not a payment event' });
    }

    const payment = new Payment(client);
    const paymentData = await payment.get({ id: dataId });

    if (paymentData.status === 'approved' && paymentData.external_reference) {
      const [userId, planId] = paymentData.external_reference.split('|');
      
      if (!userId || !planId) return NextResponse.json({ success: true, message: 'No reference' });

      // Calcula a validade de 30 dias
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      // 1. Atualiza o perfil do usuário garantindo o webhookSecret para bypass das regras
      await updateDoc(doc(db, 'users', userId), {
        isVip: true,
        vipType: planId,
        vipExpiresAt: expiresAt.toISOString(),
        webhookSecret: WEBHOOK_SECRET
      });

      // 2. Atualiza todos os hotéis desse usuário
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
      
      console.log(`✅ VIP Atribuído ao Usuário: ${userId} (${planId}) via Webhook MP`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
