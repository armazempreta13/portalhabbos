'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  ExternalLink, 
  ArrowLeft, 
  Star, 
  Crown, 
  ShieldCheck, 
  Briefcase, 
  Image as ImageIcon,
  Calendar,
  Globe,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

import { useFirebase } from '@/components/providers/firebase-provider';

export default function HotelDetails() {
  const { slug } = useParams();
  const router = useRouter();
  const { user: currentUser } = useFirebase();
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (!hotel) return;

    const isAdmin = currentUser?.email && ['philippeboechat1@gmail.com', 'cintia.farinha12@gmail.com'].includes(currentUser.email);

    let q;
    if (isAdmin) {
      q = query(
        collection(db, 'comments'),
        where('hotelId', '==', hotel.id),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'comments'),
        where('hotelId', '==', hotel.id),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [hotel, currentUser]);

  const handlePostComment = async () => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para comentar!');
      return;
    }
    if (!newComment.trim()) return;

    setIsPosting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        hotelId: hotel.id,
        userId: currentUser.uid,
        username: currentUser.displayName || 'Usuário',
        avatar: currentUser.photoURL || '',
        text: newComment,
        createdAt: serverTimestamp()
      });
      setNewComment('');
      toast.success('Comentário publicado!');
    } catch (error) {
      toast.error('Erro ao publicar comentário.');
    } finally {
      setIsPosting(false);
    }
  };

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const q = query(
          collection(db, 'hotels'),
          where('slug', '==', slug),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const hotelData: any = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          
          // Check if hotel has an active VIP plan
          const isGold = hotelData.vipType === 'gold';
          const isSilver = hotelData.vipType === 'silver';
          const isBronze = hotelData.vipType === 'bronze';
          const hasVipPlan = isGold || isSilver || isBronze;
          
          // Check if current user is owner or admin
          const isAdmin = currentUser?.email && ['philippeboechat1@gmail.com', 'cintia.farinha12@gmail.com'].includes(currentUser.email);
          const isOwner = currentUser?.uid === hotelData.ownerId;

          if (!hasVipPlan && !isAdmin && !isOwner) {
            toast.error('Este hotel não possui um plano VIP ativo e sua página está oculta.');
            router.push('/');
            return;
          }

          setHotel(hotelData);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error("Error fetching hotel:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchHotel();
  }, [slug, router, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-purple-200 rounded-full" />
            <div className="h-4 w-32 bg-purple-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!hotel) return null;

  const isGold = hotel.vipType === 'gold';
  const isSilver = hotel.vipType === 'silver';
  const isVip = hotel.isVip;
  const momentum = hotel.momentum || 1.0;
  const rankChange = hotel.rankChange || 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Hero Section with Banner */}
      <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
        {hotel.banner ? (
          <Image 
            src={hotel.banner} 
            alt={hotel.name} 
            fill 
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={cn(
            "h-full w-full bg-gradient-to-br",
            isGold ? "from-amber-400 via-amber-200 to-amber-500" : 
            isSilver ? "from-gray-400 via-gray-200 to-gray-500" :
            "from-purple-600 via-purple-400 to-purple-700"
          )} />
        )}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        
        <div className="container mx-auto px-4 h-full relative flex flex-col justify-end pb-12">
          <Link href="/" className="absolute top-8 left-4 inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Ranking
          </Link>

          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            {/* Logo */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "h-32 w-32 rounded-3xl overflow-hidden border-4 bg-white shadow-2xl flex-shrink-0 relative",
                isGold ? "border-amber-400" : isSilver ? "border-gray-300" : "border-white"
              )}
            >
              {hotel.logo ? (
                <Image src={hotel.logo} alt={hotel.name} fill className="object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-4xl font-black text-purple-200">
                  {hotel.name[0]}
                </div>
              )}
              {isVip && (
                <div className={cn(
                  "absolute top-0 right-0 p-1.5 rounded-bl-xl",
                  isGold ? "bg-amber-500" : isSilver ? "bg-gray-400" : "bg-amber-700"
                )}>
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
              )}
            </motion.div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-4xl md:text-6xl font-display font-black text-white drop-shadow-lg tracking-tight">
                  {hotel.name}
                </h1>
                <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-3 py-1 rounded-full">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 text-xs font-black uppercase tracking-widest">Online</span>
                </div>
                {isGold && <Badge className="bg-amber-500 text-white border-none px-3 py-1 font-black">VIP OURO 👑</Badge>}
                {isSilver && <Badge className="bg-gray-400 text-white border-none px-3 py-1 font-black">VIP PRATA</Badge>}
                {hotel.isApproved && <ShieldCheck className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />}
              </div>
              
              {/* Movement Stats in Hero */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                {rankChange !== 0 && (
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-md border",
                    rankChange > 0 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  )}>
                    {rankChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                    {rankChange > 0 ? `Subiu ${rankChange} posições` : `Caiu ${Math.abs(rankChange)} posições`}
                  </div>
                )}
                {momentum > 1.1 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 backdrop-blur-md">
                    <Zap className="w-3 h-3" />
                    Momentum: {momentum.toFixed(1)}x
                  </div>
                )}
              </div>

              <p className="text-white/90 text-lg font-medium max-w-2xl drop-shadow-md">
                {hotel.description}
              </p>
            </div>

            <div className="flex flex-col gap-3 min-w-[200px]">
              <a href={hotel.url} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button size="lg" className={cn(
                  "w-full gap-2 text-lg font-bold shadow-xl",
                  isGold ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"
                )}>
                  <ExternalLink className="w-5 h-5" /> JOGAR AGORA
                </Button>
              </a>
              {currentUser?.uid === hotel.ownerId && (
                <Link href={`/hotels/${hotel.slug}/edit`} className="w-full">
                  <Button variant="outline" size="lg" className="w-full gap-2 font-bold border-white/20 text-white hover:bg-white/10 backdrop-blur-md">
                    <Briefcase className="w-5 h-5" /> EDITAR PÁGINA
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-purple-100 bg-white shadow-sm">
                <CardContent className="p-6 text-center">
                  <Users className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-black text-gray-900">{hotel.onlineUsers || 0}</p>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Online</p>
                </CardContent>
              </Card>
              <Card className="border-purple-100 bg-white shadow-sm">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-black text-gray-900">{hotel.rankingScore || 0}</p>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Score</p>
                </CardContent>
              </Card>
              <Card className="border-purple-100 bg-white shadow-sm">
                <CardContent className="p-6 text-center">
                  <Activity className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                  <p className="text-2xl font-black text-gray-900">{momentum.toFixed(1)}x</p>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Momentum</p>
                </CardContent>
              </Card>
              <Card className="border-purple-100 bg-white shadow-sm">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-black text-gray-900">
                    {hotel.createdAt ? (
                      hotel.createdAt.toDate ? 
                      hotel.createdAt.toDate().toLocaleDateString() : 
                      new Date(hotel.createdAt.seconds * 1000).toLocaleDateString()
                    ) : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Desde</p>
                </CardContent>
              </Card>
            </div>

            {/* Gallery */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <ImageIcon className="w-6 h-6 text-purple-500" />
                <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">Galeria de Fotos</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hotel.gallery && hotel.gallery.length > 0 ? (
                  hotel.gallery.map((img: string, i: number) => (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      className="relative h-64 rounded-2xl overflow-hidden border border-purple-100 shadow-md"
                    >
                      <Image src={img} alt={`Gallery ${i}`} fill className="object-cover" referrerPolicy="no-referrer" />
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-2 py-12 text-center border-2 border-dashed border-purple-100 rounded-3xl bg-white">
                    <p className="text-gray-400">Nenhuma foto disponível no momento.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Staff Vacancies */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Briefcase className="w-6 h-6 text-purple-500" />
                <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">Vagas na Staff</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hotel.staffVacancies && hotel.staffVacancies.length > 0 ? (
                  hotel.staffVacancies.map((vaga: string, i: number) => (
                    <Card key={i} className="border-purple-100 bg-white hover:border-purple-300 transition-colors">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-bold text-gray-900">{vaga}</span>
                        </div>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-100 bg-emerald-50">ABERTA</Badge>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-2 py-12 text-center border-2 border-dashed border-purple-100 rounded-3xl bg-white">
                    <p className="text-gray-400">Não há vagas abertas no momento.</p>
                  </div>
                )}
              </div>
            </section>
            
            {/* Comments Section */}
            <section className="mt-12">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-6 h-6 text-purple-500" />
                <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">Comunidade</h2>
              </div>
              
              <Card className="border-purple-100 bg-white shadow-sm p-6">
                <div className="flex gap-4 mb-6">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex-shrink-0 overflow-hidden relative">
                    {currentUser?.photoURL ? (
                      <Image src={currentUser.photoURL} alt="Avatar" fill sizes="40px" className="object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-purple-400 font-bold">
                        {currentUser?.displayName?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="O que você achou deste hotel?"
                      className="w-full p-3 rounded-xl border border-purple-100 focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-all resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <Button onClick={handlePostComment} disabled={isPosting || !newComment.trim()}>
                        {isPosting ? 'Publicando...' : 'Publicar Comentário'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="h-10 w-10 rounded-full bg-white flex-shrink-0 overflow-hidden relative border border-gray-200">
                        {comment.avatar ? (
                          <Image src={comment.avatar} alt="Avatar" fill sizes="40px" className="object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold">
                            {comment.username?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{comment.username}</span>
                          <span className="text-xs text-gray-400">
                            {comment.createdAt?.toDate ? 
                              comment.createdAt.toDate().toLocaleDateString() : 
                              new Date(comment.createdAt?.seconds * 1000).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-center text-gray-400 py-4">Nenhum comentário ainda. Seja o primeiro!</p>
                  )}
                </div>
              </Card>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card className="border-purple-100 bg-white shadow-lg overflow-hidden">
              <div className="p-6 bg-purple-600 text-white">
                <h3 className="text-xl font-black uppercase italic tracking-tight">Informações Técnicas</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm flex items-center gap-2"><Globe className="w-4 h-4" /> Categoria</span>
                  <Badge variant="secondary" className="uppercase text-[10px]">{hotel.category}</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Status</span>
                  <span className="text-emerald-500 font-bold text-sm">ONLINE</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500 text-sm flex items-center gap-2"><Crown className="w-4 h-4" /> Plano</span>
                  <span className={cn(
                    "font-black text-sm uppercase",
                    isGold ? "text-amber-500" : isSilver ? "text-gray-400" : "text-purple-600"
                  )}>
                    {hotel.vipType || 'Gratuito'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Ad Space or Similar Hotels */}
            <div className="rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 p-8 text-white text-center shadow-xl">
              <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h4 className="text-xl font-black mb-2 uppercase italic">Quer seu hotel aqui?</h4>
              <p className="text-sm text-white/80 mb-6">
                Assine um plano VIP e ganhe uma página exclusiva como esta para atrair mais jogadores!
              </p>
              <Link href="/vip">
                <Button variant="secondary" className="w-full font-bold">VER PLANOS VIP</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
