'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, Users, ExternalLink, ThumbsUp, Star, ShieldCheck, TrendingUp, User, ChevronUp, ChevronDown, Zap, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '@/components/providers/firebase-provider';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface HotelCardProps {
  hotel: any;
  position: number;
  nextHotelScore?: number;
}

export const HotelCard = ({ hotel, position, nextHotelScore }: HotelCardProps) => {
  const { user, profile } = useFirebase();
  const [isVoting, setIsVoting] = useState(false);

  // Mock movement data if not present
  const rankChange = hotel.rankChange || 0;
  const momentum = hotel.momentum || (hotel.rankingScore > 1000 ? 1.2 : 0.8);
  const isTrending = hotel.isTrending || (hotel.growthRate && hotel.growthRate > 20) || (rankChange > 3);
  
  // Calculate points needed to pass next rank
  const pointsToNext = nextHotelScore ? Math.max(0, nextHotelScore - hotel.rankingScore + 1) : 0;

  const handleVote = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para votar!');
      return;
    }

    const isAdmin = profile?.role === 'admin' || ['philippeboechat1@gmail.com', 'cintia.farinha12@gmail.com'].includes(user.email || '');

    setIsVoting(true);
    try {
      // Check cooldown (lastVoteAt) - Bypass for admins
      if (profile?.lastVoteAt && !isAdmin) {
        const lastVote = new Date(profile.lastVoteAt).getTime();
        const now = new Date().getTime();
        const diff = now - lastVote;
        const cooldown = 24 * 60 * 60 * 1000; // 24h

        if (diff < cooldown) {
          const hoursLeft = Math.ceil((cooldown - diff) / (1000 * 60 * 60));
          toast.error(`Você já votou hoje! Tente novamente em ${hoursLeft}h.`);
          setIsVoting(false);
          return;
        }
      }

      // 1. Create vote record
      await addDoc(collection(db, 'votes'), {
        userId: user.uid,
        hotelId: hotel.id,
        createdAt: serverTimestamp(),
        ipHash: 'hashed_ip', // Ideally handled server-side or via fingerprint
        fingerprint: 'browser_fingerprint',
        voteValue: 1,
      });

      // 2. Update hotel ranking score and momentum
      const momentumBoost = profile?.isVip ? 0.05 : 0.02;
      await updateDoc(doc(db, 'hotels', hotel.id), {
        rankingScore: increment(1),
        votesCount: increment(1),
        momentum: increment(momentumBoost),
        lastVoteAt: serverTimestamp(),
      });

      // 3. Update user profile (XP, lastVoteAt, streak)
      const xpGain = profile?.isVip ? 10 : 5;
      await updateDoc(doc(db, 'users', user.uid), {
        xp: increment(xpGain),
        lastVoteAt: new Date().toISOString(),
      });

      // 4. Create Live Feed Event
      await addDoc(collection(db, 'events'), {
        hotelId: hotel.id,
        hotelName: hotel.name,
        hotelSlug: hotel.slug,
        type: 'vote',
        importance: profile?.isVip ? 'medium' : 'low',
        value: 1,
        createdAt: serverTimestamp(),
        metadata: {
          voterLevel: profile?.level || 1,
          isVip: profile?.isVip || false,
          currentRank: position
        }
      });

      // 5. Update Global Stats
      await setDoc(doc(db, 'global_stats', 'stats'), {
        totalVotes: increment(1),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 6. Check for special events (e.g. assuming Top 1)
      if (position === 1 && hotel.rankingScore > 1000) {
        // Occasionally trigger a "Top 1" event if it's a significant vote
        if (Math.random() > 0.7) {
          await addDoc(collection(db, 'events'), {
            hotelId: hotel.id,
            hotelName: hotel.name,
            hotelSlug: hotel.slug,
            type: 'top1',
            importance: 'high',
            createdAt: serverTimestamp(),
            metadata: { currentRank: 1 }
          });
        }
      }

      // 6. Check for Dispute
      if (nextHotelScore && pointsToNext < 5) {
        await addDoc(collection(db, 'events'), {
          hotelId: hotel.id,
          hotelName: hotel.name,
          hotelSlug: hotel.slug,
          type: 'dispute',
          importance: 'medium',
          createdAt: serverTimestamp(),
          metadata: { currentRank: position, targetRank: position - 1 }
        });
      }

      toast.success(`Voto computado com sucesso! +${xpGain} XP`);
    } catch (error) {
      console.error("Erro ao votar:", error);
      toast.error('Erro ao processar seu voto.');
    } finally {
      setIsVoting(false);
    }
  };

  const isGold = hotel.vipType === 'gold';
  const isSilver = hotel.vipType === 'silver';
  const isBronze = hotel.vipType === 'bronze';
  const hasVipPlan = isGold || isSilver || isBronze;
  const isVip = hotel.isVip || hasVipPlan || hotel.rankingScore > 5000;

    const isAdmin = profile?.role === 'admin' || ['philippeboechat1@gmail.com', 'cintia.farinha12@gmail.com'].includes(user?.email || '');
    const isOwner = user?.uid === hotel.ownerId;
    const canAccessPage = hasVipPlan || isAdmin || isOwner;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: position * 0.05 }}
        whileHover={{ y: -4 }}
        className="relative group"
      >
        <Card className={cn(
          "overflow-hidden border-purple-100 transition-all duration-300",
          isGold && "border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.25)] bg-gradient-to-br from-amber-50/40 to-white ring-1 ring-amber-400/50",
          isSilver && "border-gray-300 shadow-[0_0_15px_rgba(156,163,175,0.15)] bg-gradient-to-br from-gray-50/30 to-white",
          isBronze && "border-amber-200 bg-amber-50/10",
          !isVip && isTrending && "border-rose-200 bg-rose-50/10"
        )}>
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row items-center gap-6 p-4 md:p-6">
              {/* Position & Rank Movement */}
              <div className="flex flex-col items-center justify-center min-w-[80px] border-r border-gray-50 pr-4">
                <span className={cn(
                  "text-3xl font-display font-black italic leading-none mb-1",
                  position === 1 ? "text-amber-500" : 
                  position === 2 ? "text-gray-400" :
                  position === 3 ? "text-amber-700" : "text-gray-400"
                )}>
                  #{position}
                </span>
                
                {/* Movement Badge */}
                <div className="flex items-center gap-1">
                  {rankChange > 0 ? (
                    <div className={cn(
                      "flex items-center text-[10px] font-black px-1.5 py-0.5 rounded-full",
                      rankChange >= 5 ? "bg-rose-500 text-white animate-pulse" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {rankChange >= 5 ? <Zap className="w-2.5 h-2.5 mr-0.5" /> : <ChevronUp className="w-2.5 h-2.5" />}
                      {rankChange >= 5 ? `🔥 +${rankChange}` : `+${rankChange}`}
                    </div>
                  ) : rankChange < 0 ? (
                    <div className="flex items-center text-[10px] font-black px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      <ChevronDown className="w-2.5 h-2.5" />
                      {rankChange}
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">Estável</div>
                  )}
                </div>
                
                {position <= 3 && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="mt-2"
                  >
                    <Flame className={cn("w-4 h-4", position === 1 ? "text-amber-500" : "text-gray-400")} />
                  </motion.div>
                )}
              </div>

              {/* Logo */}
              {canAccessPage ? (
                <Link href={`/hotels/${hotel.slug}`} className="flex-shrink-0">
                  <div className={cn(
                    "relative h-20 w-20 overflow-hidden rounded-2xl border transition-colors",
                    isGold ? "border-amber-300 bg-amber-50 group-hover:border-amber-500 shadow-inner" : 
                    isSilver ? "border-gray-200 bg-gray-50 group-hover:border-gray-400" :
                    isTrending ? "border-rose-300 bg-rose-50 group-hover:border-rose-500" :
                    "border-purple-100 bg-purple-50 group-hover:border-purple-400"
                  )}>
                    {hotel.logo ? (
                      <Image src={hotel.logo} alt={hotel.name} fill sizes="80px" className="object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400">
                        {hotel.name[0]}
                      </div>
                    )}
                    {isVip && (
                      <div className={cn(
                        "absolute top-0 right-0 p-1 rounded-bl-lg",
                        isGold ? "bg-amber-500" : isSilver ? "bg-gray-400" : "bg-amber-700"
                      )}>
                        <Star className="w-3 h-3 text-white fill-white" />
                      </div>
                    )}
                    {isTrending && !isVip && (
                      <div className="absolute top-0 right-0 p-1 bg-rose-500 rounded-bl-lg">
                        <Flame className="w-3 h-3 text-white fill-white" />
                      </div>
                    )}
                  </div>
                </Link>
              ) : (
                <div className="flex-shrink-0">
                  <div className={cn(
                    "relative h-20 w-20 overflow-hidden rounded-2xl border transition-colors opacity-70 grayscale",
                    "border-purple-100 bg-purple-50"
                  )}>
                    {hotel.logo ? (
                      <Image src={hotel.logo} alt={hotel.name} fill sizes="80px" className="object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400">
                        {hotel.name[0]}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                  {canAccessPage ? (
                    <Link href={`/hotels/${hotel.slug}`}>
                      <h3 className={cn(
                        "text-xl font-bold font-display transition-colors",
                        isGold ? "text-amber-900 group-hover:text-amber-600" : 
                        isSilver ? "text-gray-800 group-hover:text-gray-600" :
                        isTrending ? "text-rose-900 group-hover:text-rose-600" :
                        "text-gray-900 group-hover:text-purple-500"
                      )}>
                        {hotel.name}
                      </h3>
                    </Link>
                  ) : (
                    <h3 className="text-xl font-bold font-display text-gray-400">
                      {hotel.name}
                    </h3>
                  )}
                {isGold && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none text-[10px] font-black tracking-tighter shadow-sm">
                    VIP OURO 👑
                  </Badge>
                )}
                {isSilver && (
                  <Badge className="bg-gray-400 hover:bg-gray-500 text-white border-none text-[10px] font-black tracking-tighter">
                    VIP PRATA
                  </Badge>
                )}
                {isBronze && (
                  <Badge className="bg-amber-700 hover:bg-amber-800 text-white border-none text-[10px] font-black tracking-tighter">
                    VIP BRONZE
                  </Badge>
                )}
                {isTrending && !isVip && (
                  <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none text-[10px] font-black tracking-tighter animate-pulse">
                    EM ALTA 🔥
                  </Badge>
                )}
                {hotel.isApproved && <span title="Verificado"><ShieldCheck className="w-4 h-4 text-emerald-500" /></span>}
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                {hotel.description || 'Um servidor incrível de Habbo para você se divertir!'}
              </p>

              {/* Competitive Pressure & Momentum */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                {pointsToNext > 0 && position > 1 && (
                  <div className="flex items-center gap-1 text-[10px] font-black text-purple-500 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                    <Target className="w-3 h-3" />
                    FALTAM {pointsToNext} VOTOS PARA #{position - 1}
                  </div>
                )}
                {momentum > 1 && (
                  <div className="flex items-center gap-1 text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                    <TrendingUp className="w-3 h-3" />
                    MOMENTUM: {momentum.toFixed(1)}x
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {hotel.onlineUsers || 0} Online
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <ThumbsUp className="w-3 h-3" />
                  {hotel.rankingScore || 0} Votos
                </div>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                  {hotel.category || 'Geral'}
                </Badge>
                {hotel.ownerId && (
                  <Link href={`/profile/${hotel.ownerId}`} className="flex items-center gap-1 text-[10px] text-purple-500 hover:text-purple-700 font-bold uppercase tracking-tight transition-colors">
                    <User className="w-3 h-3" /> Ver Dono
                  </Link>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {hasVipPlan ? (
                <Link href={`/hotels/${hotel.slug}`} className="w-full sm:w-auto">
                  <Button variant="outline" className={cn(
                    "w-full sm:w-auto gap-2 border-purple-100 text-purple-700 hover:bg-purple-50 font-bold shadow-sm"
                  )}>
                    <ExternalLink className="w-4 h-4" /> Página
                  </Button>
                </Link>
              ) : (
                <Link href={`/profile/${hotel.ownerId}`} className="w-full sm:w-auto">
                  <Button variant="outline" className={cn(
                    "w-full sm:w-auto gap-2 border-purple-100 text-purple-700 hover:bg-purple-50 font-bold shadow-sm"
                  )}>
                    <User className="w-4 h-4" /> Perfil
                  </Button>
                </Link>
              )}
              <Button 
                onClick={handleVote} 
                disabled={isVoting}
                className={cn(
                  "w-full sm:w-auto gap-2 min-w-[120px]",
                  isVip ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"
                )}
              >
                <ThumbsUp className={cn("w-4 h-4", isVoting && "animate-bounce")} />
                {isVoting ? 'Votando...' : 'Votar'}
              </Button>
              <a href={hotel.url} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button variant="outline" className={cn(
                  "w-full sm:w-auto gap-2",
                  isVip ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-purple-100 text-purple-700 hover:bg-purple-50"
                )}>
                  Jogar <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};