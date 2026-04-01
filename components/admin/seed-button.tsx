'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Database, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SEED_HOTELS = [
  {
    name: 'Habbo BR/PT',
    url: 'https://habbo.com.br',
    logo: 'https://picsum.photos/seed/habbo1/200/200',
    description: 'O maior servidor de Habbo do Brasil e Portugal. Venha fazer amigos!',
    category: 'classic',
    votesCount: 125,
    onlineUsers: 450,
    rankingScore: 2150, // (125 * 10) + (450 * 2)
    growthRate: 15,
    isActive: true,
    isApproved: true,
    isTrending: false,
    staffVacancies: ['Moderador', 'Promotor de Eventos'],
    gallery: [
      'https://picsum.photos/seed/habbo_g1/800/600',
      'https://picsum.photos/seed/habbo_g2/800/600'
    ],
  },
  {
    name: 'Pixel Hotel',
    url: 'https://pixel.com',
    logo: 'https://picsum.photos/seed/pixel/200/200',
    description: 'Um mundo de pixels esperando por você. Eventos diários e raros grátis!',
    category: 'events',
    votesCount: 85,
    onlineUsers: 120,
    rankingScore: 1090, // (85 * 10) + (120 * 2)
    growthRate: 45,
    isActive: true,
    isApproved: true,
    isTrending: true,
    staffVacancies: ['Arquiteto', 'Guia'],
    gallery: [
      'https://picsum.photos/seed/pixel_g1/800/600',
      'https://picsum.photos/seed/pixel_g2/800/600'
    ],
  },
  {
    name: 'Retro Habbo',
    url: 'https://retro.net',
    logo: 'https://picsum.photos/seed/retro/200/200',
    description: 'A experiência clássica do Habbo 2005. Sem customizados, apenas diversão.',
    category: 'classic',
    votesCount: 42,
    onlineUsers: 85,
    rankingScore: 590, // (42 * 10) + (85 * 2)
    growthRate: 5,
    isActive: true,
    isApproved: true,
    isTrending: false,
    staffVacancies: [],
    gallery: ['https://picsum.photos/seed/retro_g1/800/600'],
  },
  {
    name: 'RP City',
    url: 'https://rpcity.com',
    logo: 'https://picsum.photos/seed/rp/200/200',
    description: 'O melhor servidor de Roleplay. Tenha um emprego, família e casa própria.',
    category: 'roleplay',
    votesCount: 31,
    onlineUsers: 65,
    rankingScore: 440, // (31 * 10) + (65 * 2)
    growthRate: 25,
    isActive: true,
    isApproved: true,
    isTrending: true,
    staffVacancies: ['Policial', 'Médico'],
    gallery: ['https://picsum.photos/seed/rp_g1/800/600'],
  },
  {
    name: 'Custom World',
    url: 'https://custom.io',
    logo: 'https://picsum.photos/seed/custom/200/200',
    description: 'Móveis customizados, roupas exclusivas e comandos únicos. Venha conferir!',
    category: 'custom',
    votesCount: 15,
    onlineUsers: 42,
    rankingScore: 234, // (15 * 10) + (42 * 2)
    growthRate: 10,
    isActive: true,
    isApproved: true,
    isTrending: false,
    staffVacancies: ['Pixel Artist'],
    gallery: ['https://picsum.photos/seed/custom_g1/800/600'],
  }
];

export const SeedButton = ({ ownerId }: { ownerId: string }) => {
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const vipTypes = ['gold', 'silver', 'bronze', null];
      
      for (let i = 0; i < 10; i++) {
        const randomVip = vipTypes[Math.floor(Math.random() * vipTypes.length)];
        const name = `Hotel Teste ${Math.floor(Math.random() * 1000)}`;
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        await addDoc(collection(db, 'hotels'), {
          name,
          url: 'https://habbo.com.br',
          logo: `https://picsum.photos/seed/${Math.random()}/200/200`,
          banner: `https://picsum.photos/seed/${Math.random()}/1920/400`,
          gallery: [
            `https://picsum.photos/seed/${Math.random()}/800/600`,
            `https://picsum.photos/seed/${Math.random()}/800/600`,
            `https://picsum.photos/seed/${Math.random()}/800/600`
          ],
          staffVacancies: ['Moderador', 'Construtor', 'Promotor'],
          description: 'Hotel gerado automaticamente para testes de interface. Este hotel possui uma estrutura completa para testes.',
          category: ['classic', 'events', 'roleplay', 'custom'][Math.floor(Math.random() * 4)],
          votesCount: Math.floor(Math.random() * 500),
          onlineUsers: Math.floor(Math.random() * 1000),
          rankingScore: Math.floor(Math.random() * 5000),
          growthRate: Math.floor(Math.random() * 50),
          isActive: true,
          isApproved: true,
          isVip: !!randomVip,
          vipType: randomVip,
          ownerId: ownerId,
          slug,
          fraudScore: 0,
          isTestData: true, // Flag para fácil identificação e deleção
          createdAt: serverTimestamp(),
        });
      }
      toast.success('10 hotéis de teste gerados com sucesso!');
    } catch (error) {
      console.error("Erro ao gerar dados:", error);
      toast.error('Erro ao gerar dados iniciais.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleSeed} disabled={isSeeding} className="text-xs gap-1 text-gray-500">
      {isSeeding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
      Seed
    </Button>
  );
};