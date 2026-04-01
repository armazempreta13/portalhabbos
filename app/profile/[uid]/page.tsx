'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Crown, Calendar, ShieldCheck, ArrowLeft, Hotel as HotelIcon, Users, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { HotelCard } from '@/components/hotels/hotel-card';

export default function UserProfile() {
  const { uid } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!uid) return;
      
      try {
        // Fetch User Profile
        const userDoc = await getDoc(doc(db, 'users', uid as string));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        } else {
          router.push('/');
          return;
        }

        // Fetch User's Hotels
        const hotelsQuery = query(
          collection(db, 'hotels'),
          where('ownerId', '==', uid),
          where('isActive', '==', true),
          orderBy('rankingScore', 'desc')
        );
        const hotelsSnapshot = await getDocs(hotelsQuery);
        const hotelsData = hotelsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHotels(hotelsData);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uid, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-purple-200 rounded-full" />
            <div className="h-4 w-48 bg-purple-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const totalOnline = hotels.reduce((acc, h) => acc + (h.onlineUsers || 0), 0);
  const totalVotes = hotels.reduce((acc, h) => acc + (h.rankingScore || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Ranking
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar: Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-purple-100 shadow-xl overflow-hidden">
              <div className="h-24 bg-gradient-to-br from-purple-600 to-indigo-700" />
              <CardContent className="p-6 -mt-12 text-center">
                <div className="relative inline-block mb-4">
                  <div className={cn(
                    "h-24 w-24 rounded-3xl bg-white border-4 flex items-center justify-center overflow-hidden shadow-lg",
                    profile.isVip ? "border-amber-400" : "border-white"
                  )}>
                    {profile.avatar ? (
                      <Image 
                        src={profile.avatar} 
                        alt={profile.username} 
                        fill
                        className="object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Image 
                        src={`https://www.habbo.com.br/habbo-imaging/avatarimage?user=${profile.username}&direction=2&head_direction=3&gesture=sml&size=m`} 
                        alt={profile.username} 
                        width={80} 
                        height={80} 
                        className="object-contain mt-4 scale-150"
                      />
                    )}
                  </div>
                  {profile.isVip && (
                    <div className="absolute -top-2 -right-2 bg-amber-400 p-1.5 rounded-xl shadow-lg border-2 border-white">
                      <Crown className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">{profile.username}</h2>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-100">
                    Nível {profile.level || 1}
                  </Badge>
                  {profile.isVip && (
                    <Badge className="bg-amber-400 text-white border-none">VIP</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">XP Total</p>
                    <p className="text-lg font-black text-purple-600">{profile.xp || 0}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Trust</p>
                    <p className="text-lg font-black text-emerald-600">{profile.trustScore?.toFixed(1) || '1.0'}</p>
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                    <span className="text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Membro desde</span>
                    <span className="font-bold text-gray-900">
                      {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                    <span className="text-gray-500 flex items-center gap-2"><HotelIcon className="w-4 h-4" /> Hotéis</span>
                    <span className="font-bold text-gray-900">{hotels.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2">
                    <span className="text-gray-500 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Verificado</span>
                    <span className="text-emerald-500 font-bold">SIM</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges Section */}
            <Card className="border-purple-100 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-sm font-black uppercase italic tracking-tight text-gray-900 mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" /> Conquistas
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-purple-100 text-purple-700 border-none">Pioneiro</Badge>
                  {hotels.length > 0 && <Badge className="bg-blue-100 text-blue-700 border-none">Dono de Hotel</Badge>}
                  {totalVotes > 100 && <Badge className="bg-rose-100 text-rose-700 border-none">Popular</Badge>}
                  {profile.isVip && <Badge className="bg-amber-100 text-amber-700 border-none">Apoiador VIP</Badge>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content: User's Hotels */}
          <div className="lg:col-span-3 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
                  <HotelIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tight">Hotéis de {profile.username}</h2>
                  <p className="text-gray-500 text-sm">Confira todos os servidores gerenciados por este usuário.</p>
                </div>
              </div>
            </div>

            {/* User Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-purple-100 bg-white">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-900">{totalOnline}</p>
                    <p className="text-xs text-gray-500 uppercase font-bold">Jogadores Online</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-purple-100 bg-white">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Star className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-900">{totalVotes}</p>
                    <p className="text-xs text-gray-500 uppercase font-bold">Votos Totais</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-purple-100 bg-white">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-900">#{hotels[0]?.rankingScore > 1000 ? '1' : 'Top 50'}</p>
                    <p className="text-xs text-gray-500 uppercase font-bold">Melhor Posição</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {hotels.length > 0 ? (
                hotels.map((hotel, index) => (
                  <HotelCard key={hotel.id} hotel={hotel} position={index + 1} />
                ))
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-purple-100 rounded-3xl bg-white">
                  <HotelIcon className="w-12 h-12 text-purple-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Este usuário ainda não possui hotéis ativos.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
