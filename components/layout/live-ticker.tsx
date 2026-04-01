'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ChevronUp, ChevronDown, Flame, Crown, Activity, Zap } from 'lucide-react';

export const LiveTicker = () => {
  const [latestEvent, setLatestEvent] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setLatestEvent({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      }
    });
    return () => unsubscribe();
  }, []);

  if (!latestEvent) return null;

  const getEventUI = (event: any) => {
    switch (event.type) {
      case 'vote': return { icon: <Star className="w-3 h-3 text-amber-400" />, text: `voto ⭐` };
      case 'rank_up': return { icon: <ChevronUp className="w-3 h-3 text-emerald-500" />, text: `subiu no ranking 🔥` };
      case 'rank_down': return { icon: <ChevronDown className="w-3 h-3 text-rose-500" />, text: `caiu no ranking` };
      case 'trending': return { icon: <Flame className="w-3 h-3 text-rose-600 animate-pulse" />, text: `em alta 🔥` };
      case 'top1': return { icon: <Crown className="w-3 h-3 text-amber-500 animate-bounce" />, text: `#1 👑 REI DO RANKING!` };
      case 'dispute': return { icon: <Activity className="w-3 h-3 text-purple-600" />, text: `nova disputa` };
      default: return { icon: <Zap className="w-3 h-3 text-blue-500" />, text: 'evento detectado' };
    }
  };

  const ui = getEventUI(latestEvent);

  return (
    <div className="hidden md:flex items-center gap-2 bg-purple-900/40 border border-purple-500/20 px-3 py-1 rounded-full overflow-hidden w-64 max-w-xs h-7 shadow-inner">
      <div className="flex items-center gap-1.5 min-w-max">
        <Activity className="w-3 h-3 text-purple-400 animate-pulse" />
        <span className="text-[9px] font-black uppercase text-purple-300 tracking-wider">Ao Vivo</span>
      </div>
      <div className="w-px h-3 bg-white/10 mx-1" />
      <div className="flex-1 w-full overflow-hidden relative h-full flex items-center">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={latestEvent.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="flex items-center gap-1.5 whitespace-nowrap"
          >
            {ui.icon}
            <span className="text-[10px] font-bold text-gray-200 truncate pr-2">
              {latestEvent.hotelName} <span className="font-normal text-gray-400">{ui.text}</span>
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
