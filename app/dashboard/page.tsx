'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirebase } from '@/components/providers/firebase-provider';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Edit, Trash2, ExternalLink, ThumbsUp, Users, Shield, Star, PlusCircle, Hotel, TrendingUp, Crown } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const ADMIN_EMAILS = ['philippeboechat1@gmail.com', 'cintia.farinha12@gmail.com'];

export default function Dashboard() {
  const { user, profile } = useFirebase();
  const [myHotels, setMyHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'hotels'),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hotelsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMyHotels(hotelsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este hotel?')) return;
    
    try {
      await deleteDoc(doc(db, 'hotels', id));
      toast.success('Hotel excluído com sucesso.');
    } catch (error) {
      toast.error('Erro ao excluir hotel.');
    }
  };

  if (!user) return null;

  const totalOnline = myHotels.reduce((acc, h) => acc + (h.onlineUsers || 0), 0);
  const totalVotes = myHotels.reduce((acc, h) => acc + (h.rankingScore || 0), 0);
  const isAdmin = ADMIN_EMAILS.includes(user.email || '');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-6">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "h-28 w-28 rounded-3xl bg-white border-4 flex items-center justify-center overflow-hidden relative shadow-2xl",
                profile?.isVip ? "border-amber-400" : "border-purple-200"
              )}
            >
              {user.photoURL ? (
                <Image src={user.photoURL} alt="Avatar" fill className="object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Star className="w-12 h-12 text-purple-200" />
              )}
              {profile?.isVip && (
                <div className="absolute top-0 right-0 bg-amber-500 p-1.5 rounded-bl-xl">
                  <Crown className="w-4 h-4 text-white fill-white" />
                </div>
              )}
            </motion.div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black text-gray-900 uppercase italic tracking-tight">
                  {profile?.username || user.displayName || 'Usuário'}
                </h1>
                {isAdmin && (
                  <Link href="/admin">
                    <Badge className="bg-red-500 hover:bg-red-600 text-white cursor-pointer gap-1 font-black uppercase italic text-[10px]">
                      <Shield className="w-3 h-3" /> Admin
                    </Badge>
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-700 border-none font-bold">
                  <Shield className="w-3 h-3" /> Nível {profile?.level || 1}
                </Badge>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">{profile?.xp || 0} XP Total</span>
                {profile?.isVip && (
                  <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white border-none font-black uppercase italic text-[10px]">
                    Plano {profile.vipType?.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
            <Card className="p-6 text-center border-purple-100 bg-white shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Hotéis</p>
              <p className="text-3xl font-black text-gray-900 italic">{myHotels.length}</p>
            </Card>
            <Card className="p-6 text-center border-purple-100 bg-white shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Votos</p>
              <p className="text-3xl font-black text-purple-600 italic">{totalVotes}</p>
            </Card>
            <Card className="p-6 text-center border-purple-100 bg-white shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Online</p>
              <p className="text-3xl font-black text-emerald-500 italic">{totalOnline}</p>
            </Card>
            <Card className="p-6 text-center border-purple-100 bg-white shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Trust</p>
              <p className="text-3xl font-black text-blue-500 italic">{(profile?.trustScore || 1.0).toFixed(1)}</p>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Hotels Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight flex items-center gap-2">
                <Hotel className="w-6 h-6 text-purple-600" /> Meus Hotéis
              </h2>
              <Link href="/hotels/new">
                <Button className="gap-2 font-black uppercase italic tracking-tight bg-purple-600 hover:bg-purple-700 shadow-lg">
                  <PlusCircle className="w-5 h-5" /> Novo Hotel
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-28 w-full rounded-3xl bg-gray-100 animate-pulse" />
                ))
              ) : myHotels.length > 0 ? (
                myHotels.map((hotel) => (
                  <motion.div 
                    key={hotel.id} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className={cn(
                      "border-purple-100 bg-white hover:border-purple-300 transition-all shadow-sm hover:shadow-md overflow-hidden group",
                      hotel.isVip && "border-amber-200 bg-amber-50/10"
                    )}>
                      <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5 w-full sm:w-auto">
                          <div className={cn(
                            "h-20 w-20 rounded-2xl border-2 overflow-hidden flex-shrink-0 relative shadow-inner",
                            hotel.isVip ? "border-amber-300 bg-amber-50" : "border-purple-50 bg-purple-50"
                          )}>
                            {hotel.logo ? (
                              <Image src={hotel.logo} alt={hotel.name} fill className="object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-black text-2xl text-gray-300">{hotel.name[0]}</div>
                            )}
                            {hotel.isVip && (
                              <div className="absolute top-0 right-0 bg-amber-500 p-1 rounded-bl-lg">
                                <Star className="w-3 h-3 text-white fill-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">{hotel.name}</h3>
                              {hotel.isVip && (
                                <Badge className="bg-amber-500 text-white text-[10px] font-black uppercase italic border-none">
                                  VIP {hotel.vipType?.toUpperCase()}
                                </Badge>
                              )}
                              {!hotel.isApproved && (
                                <Badge variant="outline" className="text-rose-500 border-rose-200 bg-rose-50 text-[10px] font-black uppercase italic">
                                  Aguardando Aprovação
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-1.5 text-emerald-600">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {hotel.onlineUsers || 0} Online
                              </span>
                              <span className="flex items-center gap-1.5 text-purple-600">
                                <ThumbsUp className="w-3.5 h-3.5" /> {hotel.rankingScore || 0} Votos
                              </span>
                              <span className="text-gray-400">{hotel.category}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <Link href={`/hotels/${hotel.slug}`} target="_blank">
                            <Button variant="outline" size="icon" className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50" title="Ver Perfil Público">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/hotels/${hotel.slug}/edit`}>
                            <Button variant="outline" size="icon" className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50" title="Editar Página">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="rounded-xl border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200" 
                            onClick={() => handleDelete(hotel.id)} 
                            title="Excluir Hotel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-purple-100 rounded-[40px] bg-white">
                  <Hotel className="w-16 h-16 text-purple-100 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold mb-6">Você ainda não cadastrou nenhum hotel.</p>
                  <Link href="/hotels/new">
                    <Button variant="outline" className="rounded-full px-8 font-black uppercase italic">Começar Agora</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Activity */}
          <div className="space-y-8">
            {/* VIP Promo */}
            {!profile?.isVip && (
              <div className="rounded-[40px] bg-gradient-to-br from-amber-400 to-amber-600 p-8 text-white shadow-xl relative overflow-hidden group">
                <Crown className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                <h3 className="text-2xl font-black uppercase italic mb-2 tracking-tight">Seja VIP Ouro</h3>
                <p className="text-white/90 text-sm mb-6 font-medium leading-relaxed">
                  Destaque seus hotéis no topo do ranking, ganhe badges exclusivas e atraia 10x mais jogadores!
                </p>
                <Link href="/vip">
                  <Button className="w-full bg-white text-amber-600 hover:bg-amber-50 font-black uppercase italic tracking-tight rounded-2xl">
                    Ver Planos VIP
                  </Button>
                </Link>
              </div>
            )}

            {/* Quick Tips */}
            <Card className="border-purple-100 bg-white rounded-[40px] overflow-hidden shadow-lg">
              <CardHeader className="bg-purple-600 text-white p-6">
                <CardTitle className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Dicas de Crescimento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-purple-600">01</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Mantenha sua **descrição atualizada** com os eventos da semana para atrair novos jogadores.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-purple-600">02</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Use a **Galeria de Fotos** para mostrar os quartos mais bonitos e raros do seu hotel.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-purple-600">03</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Hotéis com **vagas na staff** abertas costumam atrair jogadores mais engajados.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
