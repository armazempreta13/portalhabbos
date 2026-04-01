import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

// To run this securely, Vercel requires comparing a secret
// defined in the environment variables.
const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret_key';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Busca todos os hotéis aprovados
    const hotelsQuery = query(collection(db, 'hotels'), where('isApproved', '==', true));
    const snapshot = await getDocs(hotelsQuery);

    let checked = 0;
    let onlineChanged = 0;

    for (const hDoc of snapshot.docs) {
      const data = hDoc.data();
      const url = data.url;

      if (!url) continue;

      try {
        // Tenta fazer um HEAD request para verificar se a página responde rápido
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sec timeout

        const response = await fetch(url, { 
          method: 'HEAD', 
          signal: controller.signal,
          headers: { 'User-Agent': 'HabboTop-Uptime-Bot/1.0' }
        });
        clearTimeout(timeoutId);

        const isOnline = response.ok;

        if (data.isOnline !== isOnline) {
          await updateDoc(doc(db, 'hotels', hDoc.id), {
            isOnline,
            lastCheckedAt: serverTimestamp()
          });
          onlineChanged++;
        }
      } catch (e) {
        // Se der timeout ou erro, marca como offline
        if (data.isOnline !== false) {
          await updateDoc(doc(db, 'hotels', hDoc.id), {
            isOnline: false,
            lastCheckedAt: serverTimestamp()
          });
          onlineChanged++;
        }
      }
      checked++;
    }

    return NextResponse.json({ 
      success: true, 
      checked, 
      statusChanged: onlineChanged,
      message: `Uptime verificado para ${checked} hotéis.`
    });
  } catch (error) {
    console.error('Error on Uptime Cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
