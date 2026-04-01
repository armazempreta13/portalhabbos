'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useFirebase } from '@/components/providers/firebase-provider';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { LogIn, LogOut, Plus, Trophy, User, Shield, Database, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { SeedButton } from '@/components/admin/seed-button';
import { LiveTicker } from '@/components/layout/live-ticker';
import { cn } from '@/lib/utils';

export const Navbar = () => {
  const { user, profile } = useFirebase();
  const isAdmin = user?.email === 'cintia.farinha12@gmail.com' || user?.email === 'philippeboechat1@gmail.com';

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Bem-vindo ao HabboTop!');
    } catch (error) {
      toast.error('Erro ao fazer login.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Até logo!');
    } catch (error) {
      toast.error('Erro ao sair.');
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0f0f1a]/95 backdrop-blur-md shadow-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="https://i.imgur.com/Y5BFDzJ.png" alt="HabboTop Logo" width={60} height={20} className="object-contain" />
          </Link>
          
          <LiveTicker />

          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors flex items-center gap-1">
              <Trophy className="w-4 h-4" /> Ranking
            </Link>
            <Link href="/vip" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
              Planos VIP
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                <Shield className="w-4 h-4" /> Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && user && <SeedButton ownerId={user.uid} />}
          
          {user ? (
            <>
              <Link href="/hotels/new">
                <Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-white/10 text-gray-300 hover:bg-white/5">
                  <Plus className="w-4 h-4" /> Divulgar Hotel
                </Button>
              </Link>
              <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                <div className="text-right hidden sm:block">
                  <div className="flex items-center justify-end gap-1">
                    {profile?.isVip && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    <p className="text-xs font-bold text-white">{profile?.username || user.displayName}</p>
                  </div>
                  <p className="text-[10px] text-purple-400">Nível {profile?.level || 1} {profile?.isVip && '• VIP'}</p>
                </div>
                <Link href="/dashboard">
                  <div className={cn(
                    "h-9 w-9 rounded-full bg-white/5 border flex items-center justify-center overflow-hidden transition-all relative",
                    profile?.isVip ? "border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]" : "border-white/10 hover:border-purple-500"
                  )}>
                    {user.photoURL ? (
                      <Image 
                        src={user.photoURL} 
                        alt="Avatar" 
                        fill
                        sizes="36px"
                        className="object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-purple-900/50">
                        <User className="w-5 h-5 text-purple-300" />
                      </div>
                    )}
                  </div>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair" className="text-gray-400 hover:text-white hover:bg-white/5">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <Link href="/login">
              <Button className="gap-2 bg-purple-600 hover:bg-purple-500 text-white">
                <LogIn className="w-4 h-4" /> Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};