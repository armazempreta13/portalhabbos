import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
  }

  try {
    // Lista de endpoints comuns usados por servidores de Habbo
    const endpoints = [
      `${url.replace(/\/$/, '')}/api/online`,
      `${url.replace(/\/$/, '')}/api/stats`,
      `${url.replace(/\/$/, '')}/api/status`
    ];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000); // Timeout de 3 segundos
        
        const response = await fetch(endpoint, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (response.ok) {
          const data = await response.json();
          // Tenta extrair o número de usuários de diferentes formatos comuns de API
          const onlineCount = data.online || data.users || data.count || 0;
          return NextResponse.json({ online: onlineCount });
        }
      } catch (e) {
        continue;
      }
    }

    return NextResponse.json({ online: 0, message: 'Não foi possível obter estatísticas automaticamente.' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar estatísticas.' }, { status: 500 });
  }
}
