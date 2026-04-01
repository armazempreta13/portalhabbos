'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { HotelCard } from '@/components/hotels/hotel-card';
import { useFirebase } from '@/components/providers/firebase-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Trophy, TrendingUp, Clock, Filter, PlusCircle, Users, Mail, Star, LayoutGrid, Home as HomeIcon, Crown, Activity, Zap, ChevronUp, ChevronDown, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, limit, onSnapshot, where, addDoc, serverTimestamp, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Live Feed Component
const RankingFeed = ({ hotels }: { hotels: any[] }) => {
  const [rawEvents, setRawEvents] = useState<any[]>([]);

  useEffect(() => {
    // Listen to real events from Firestore
    const q = query(
      collection(db, 'events'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      // Filter out events older than 24h
      const now = new Date();
      const filteredEvents = eventsData.filter(event => {
        const diff = now.getTime() - event.createdAt.getTime();
        return diff < 24 * 60 * 60 * 1000;
      });

      setRawEvents(filteredEvents);
    });

    return () => unsubscribe();
  }, []);

  const groupedEvents = React.useMemo(() => {
    if (rawEvents.length === 0) return [];

    const grouped: any[] = [];
    const voteGroups: Record<string, any> = {}; // hotelId -> event

    rawEvents.forEach(event => {
      if (event.type === 'vote') {
        const key = `${event.hotelId}_${Math.floor(event.createdAt.getTime() / (3 * 60 * 1000))}`; // 3 min window
        if (voteGroups[key]) {
          voteGroups[key].value += (event.value || 1);
          // Keep the most recent timestamp
          if (event.createdAt > voteGroups[key].createdAt) {
            voteGroups[key].createdAt = event.createdAt;
          }
        } else {
          voteGroups[key] = { ...event, value: event.value || 1 };
        }
      } else {
        grouped.push(event);
      }
    });

    // Add grouped votes back
    Object.values(voteGroups).forEach(group => grouped.push(group));

    // Sort by Importance (high > medium > low) then by Time
    const importanceMap: Record<string, number> = { high: 3, medium: 2, low: 1 };
    
    const sorted = grouped.sort((a, b) => {
      const impA = importanceMap[a.importance] || 0;
      const impB = importanceMap[b.importance] || 0;
      
      if (impA !== impB) return impB - impA;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return sorted.slice(0, 20);
  }, [rawEvents]);

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora';
    if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} h`;
    return date.toLocaleDateString();
  };

  const getEventUI = (event: any) => {
    switch (event.type) {
      case 'vote':
        return {
          icon: <Star className="w-3.5 h-3.5 text-amber-400" />,
          text: event.value > 1 
            ? `+${event.value} votos recebidos nos últimos minutos` 
            : `acabou de ganhar um voto ⭐`,
          color: "bg-amber-50/50 border-amber-100/50"
        };
      case 'rank_up':
        return {
          icon: <ChevronUp className="w-3.5 h-3.5 text-emerald-500" />,
          text: `disparou no ranking 🔥 (+${event.value} posições)`,
          color: "bg-emerald-50/50 border-emerald-100/50"
        };
      case 'rank_down':
        return {
          icon: <ChevronDown className="w-3.5 h-3.5 text-rose-500" />,
          text: `caiu -${event.value} posições no ranking`,
          color: "bg-rose-50/50 border-rose-100/50"
        };
      case 'trending':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />,
          text: `entrou em alta 🔥`,
          color: "bg-rose-50/80 border-rose-200/50"
        };
      case 'top1':
        return {
          icon: <Crown className="w-3.5 h-3.5 text-amber-500 animate-bounce" />,
          text: `assumiu o #1 👑 REI DO RANKING!`,
          color: "bg-amber-100/50 border-amber-300/50"
        };
      case 'dispute':
        return {
          icon: <Activity className="w-3.5 h-3.5 text-purple-600" />,
          text: `está disputando com #${event.metadata?.targetRank}`,
          color: "bg-purple-50/50 border-purple-100/50"
        };
      default:
        return {
          icon: <Zap className="w-3.5 h-3.5 text-blue-500" />,
          text: event.text || 'Evento detectado',
          color: "bg-blue-50/50 border-blue-100/50"
        };
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-purple-100 rounded-2xl p-4 shadow-sm mb-8 overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-purple-50 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-600 animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 italic">Live Ranking Feed</h3>
        </div>
        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-purple-200 text-purple-600">Ao Vivo</Badge>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
        <AnimatePresence mode="popLayout">
          {groupedEvents.map((event) => {
            const ui = getEventUI(event);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                layout
              >
                <Link href={`/hotels/${event.hotelSlug || '#'}`}>
                  <div className={cn(
                    "flex flex-col gap-1 p-2.5 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
                    ui.color,
                    event.importance === 'high' && "ring-1 ring-purple-400/30 shadow-sm"
                  )}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {ui.icon}
                        <span className="text-[10px] font-black text-gray-900 uppercase truncate max-w-[120px]">
                          {event.hotelName}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">
                        {formatRelativeTime(event.createdAt)}
                      </span>
                    </div>
                    <p className={cn(
                      "text-[11px] font-bold leading-tight",
                      event.importance === 'high' ? "text-purple-700" : "text-gray-600"
                    )}>
                      {ui.text}
                    </p>
                    {event.metadata?.currentRank && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge className="text-[8px] h-4 bg-gray-100 text-gray-500 border-none">
                          POSIÇÃO: #{event.metadata.currentRank}
                        </Badge>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {groupedEvents.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[10px] font-bold text-gray-400 uppercase italic">Aguardando novos eventos...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Home() {
  const { user, profile } = useFirebase();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ranking' | 'trending' | 'new'>('ranking');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Seed initial events if none exist (for demo)
  useEffect(() => {
    if (hotels.length === 0) return;
    
    const seedEvents = async () => {
      const eventsSnap = await getDocs(query(collection(db, 'events'), limit(1)));
      if (eventsSnap.empty) {
        const demoHotels = hotels.slice(0, 3);
        for (const hotel of demoHotels) {
          await addDoc(collection(db, 'events'), {
            hotelId: hotel.id,
            hotelName: hotel.name,
            hotelSlug: hotel.slug,
            type: 'trending',
            importance: 'medium',
            createdAt: serverTimestamp(),
            metadata: { currentRank: hotels.indexOf(hotel) + 1 }
          });
        }
      }
    };
    seedEvents();
  }, [hotels]);

  useEffect(() => {
    let q;
    
    const constraints = [where('isActive', '==', true)];
    
    if (categoryFilter !== 'all') {
      constraints.push(where('category', '==', categoryFilter));
    }

    if (filter === 'ranking') {
      constraints.push(orderBy('rankingScore', 'desc'));
    } else if (filter === 'trending') {
      constraints.push(orderBy('growthRate', 'desc'));
    } else {
      constraints.push(orderBy('createdAt', 'desc'));
    }
    constraints.push(limit(50));
    
    q = query(collection(db, 'hotels'), ...constraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hotelsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHotels(hotelsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching hotels:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter, categoryFilter]);

  const filteredHotels = hotels.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="relative mb-12 rounded-3xl overflow-hidden bg-[#1a1a2e] border border-purple-200/20 shadow-2xl min-h-[400px] flex flex-col items-center justify-center">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-70 transition-all duration-700" 
            style={{ backgroundImage: 'url("https://i.imgur.com/s3HLa5k.png")' }} 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a1a2e]/40 to-[#1a1a2e]" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 text-center px-4 mb-16"
          >
            <motion.div 
              className="mb-6 flex justify-center"
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <Image 
                src="https://i.imgur.com/Y5BFDzJ.png" 
                alt="HabboTop Logo" 
                width={120} 
                height={40} 
                className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" 
              />
            </motion.div>
            
            <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white mb-3 drop-shadow-lg uppercase italic">
              O Ranking Oficial da <span className="text-purple-400">Comunidade</span>
            </h1>
            <p className="text-base text-purple-100/80 mb-8 font-medium drop-shadow-md max-w-xl mx-auto">
              Acompanhe os melhores servidores, vote e suba no ranking global.
            </p>
          </motion.div>

          {/* Sub-Navbar Floating Bar */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-5xl px-6 z-20">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white p-1.5 flex items-center justify-between gap-2">
              {/* Left: User Profile Quick Access */}
              <div className="flex items-center gap-3 pl-2 pr-4 border-r border-gray-100">
                <div className="relative h-10 w-10 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-center overflow-hidden">
                  {user?.photoURL ? (
                    <Image 
                      src={user.photoURL} 
                      alt="Avatar" 
                      fill
                      sizes="40px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Image 
                      src="https://www.habbo.com.br/habbo-imaging/avatarimage?user=Cintia&direction=2&head_direction=3&gesture=sml&size=m" 
                      alt="Avatar" 
                      width={48} 
                      height={48} 
                      className="object-contain mt-2 scale-125"
                    />
                  )}
                </div>
                <div className="hidden lg:block">
                  <div className="flex items-center gap-1">
                    <p className="text-[10px] text-purple-500 font-black uppercase tracking-tighter leading-none">Bem-vindo</p>
                    {profile?.isVip && <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
                  </div>
                  <p className="text-sm font-bold text-gray-900">{user ? (profile?.username || user.displayName?.split(' ')[0]) : 'Visitante'}</p>
                </div>
              </div>

              {/* Center: Navigation Links */}
              <div className="flex-1 flex items-center justify-center gap-1 md:gap-4 px-2">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="gap-2 text-purple-600 font-bold hover:bg-purple-50">
                    <HomeIcon className="w-4 h-4" /> <span className="hidden sm:inline">Início</span>
                  </Button>
                </Link>
                <Link href="/vip">
                  <Button variant="ghost" size="sm" className="gap-2 text-gray-600 font-bold hover:bg-purple-50 hover:text-purple-600">
                    <Star className="w-4 h-4" /> <span className="hidden sm:inline">VIP</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="gap-2 text-gray-600 font-bold hover:bg-purple-50 hover:text-purple-600">
                  <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Hotéis</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 text-gray-600 font-bold hover:bg-purple-50 hover:text-purple-600">
                  <Users className="w-4 h-4" /> <span className="hidden sm:inline">Membros</span>
                </Button>
              </div>

              {/* Right: Search Bar */}
              <div className="flex items-center gap-2 pl-4 border-l border-gray-100">
                <div className="relative w-full max-w-[180px] md:max-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <Input 
                    placeholder="Buscar hotel..." 
                    className="h-10 pl-9 bg-gray-50 border-transparent focus:bg-white focus:border-purple-200 text-xs rounded-xl transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar: Feed & Stats */}
          <div className="lg:col-span-1 space-y-6">
            <RankingFeed hotels={hotels} />
            
            <Card className="border-purple-100 bg-white shadow-sm overflow-hidden">
              <div className="p-4 bg-purple-600 text-white">
                <h3 className="text-xs font-black uppercase tracking-widest italic">Estatísticas Globais</h3>
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-bold uppercase">Total Online</span>
                  <span className="text-sm font-black text-purple-600">{hotels.reduce((acc, h) => acc + (h.onlineUsers || 0), 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-bold uppercase">Votos Hoje</span>
                  <span className="text-sm font-black text-emerald-600">1.240</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-bold uppercase">Hotéis Ativos</span>
                  <span className="text-sm font-black text-blue-600">{hotels.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content: Ranking */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters Section */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                <Button 
                  variant={filter === 'ranking' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className={cn("gap-2 whitespace-nowrap rounded-full", filter === 'ranking' && "bg-purple-100 text-purple-700 hover:bg-purple-200")}
                  onClick={() => setFilter('ranking')}
                >
                  <Trophy className="w-4 h-4" /> Top Ranking
                </Button>
                <Button 
                  variant={filter === 'trending' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className={cn("gap-2 whitespace-nowrap rounded-full", filter === 'trending' && "bg-rose-100 text-rose-700 hover:bg-rose-200")}
                  onClick={() => setFilter('trending')}
                >
                  <TrendingUp className="w-4 h-4" /> Em Alta
                </Button>
                <Button 
                  variant={filter === 'new' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className={cn("gap-2 whitespace-nowrap rounded-full", filter === 'new' && "bg-blue-100 text-blue-700 hover:bg-blue-200")}
                  onClick={() => setFilter('new')}
                >
                  <Clock className="w-4 h-4" /> Novos
                </Button>
                <select 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-9 rounded-full px-4 text-xs font-bold border border-purple-100 bg-white"
                >
                  <option value="all">Todas Categorias</option>
                  <option value="classic">Classic</option>
                  <option value="events">Eventos</option>
                  <option value="roleplay">Roleplay</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <Link href="/hotels/new">
                <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20 rounded-full px-6">
                  <PlusCircle className="w-4 h-4" /> Divulgar Hotel
                </Button>
              </Link>
            </div>

            {/* Ranking List */}
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-32 w-full rounded-2xl bg-purple-50 animate-pulse border border-purple-100" />
                ))
              ) : filteredHotels.length > 0 ? (
                filteredHotels.map((hotel, index) => (
                  <HotelCard 
                    key={hotel.id} 
                    hotel={hotel} 
                    position={index + 1} 
                    nextHotelScore={index > 0 ? filteredHotels[index - 1].rankingScore : undefined}
                  />
                ))
              ) : (
                <div className="text-center py-20 border border-dashed border-purple-200 rounded-3xl bg-white">
                  <p className="text-gray-500">Nenhum hotel encontrado com esses critérios.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-purple-100 bg-white py-12 mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Image src="https://i.imgur.com/Y5BFDzJ.png" alt="HabboTop Logo" width={100} height={30} className="object-contain opacity-80 grayscale hover:grayscale-0 transition-all" />
          </div>
          <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
            A maior e melhor lista de servidores privados de Habbo. 
            Feito por fãs para fãs.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
            <Link href="#" className="hover:text-purple-500 transition-colors">Termos de Uso</Link>
            <Link href="#" className="hover:text-purple-500 transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-purple-500 transition-colors">Contato</Link>
          </div>
          <p className="mt-8 text-[10px] text-gray-400">
            &copy; 2026 HabboTop. Todos os direitos reservados. Não somos afiliados à Sulake ou Habbo Hotel.
          </p>
        </div>
      </footer>
    </div>
  );
}