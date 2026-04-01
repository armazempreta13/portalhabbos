'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export const AuthForm = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userDocRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          username: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          email: result.user.email,
          role: 'user',
          xp: 0,
          level: 1,
          trustScore: 1.0,
          createdAt: new Date().toISOString(),
        });
      }
      toast.success('Login com Google realizado com sucesso!');
      router.push('/');
    } catch (error: any) {
      toast.error('Erro no login com Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Login realizado com sucesso! Redirecionando...');
        router.push('/');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          username: email.split('@')[0],
          email: email,
          role: 'user',
          xp: 0,
          level: 1,
          trustScore: 1.0,
          createdAt: new Date().toISOString(),
        });
        toast.success('Cadastro realizado com sucesso! Bem-vindo!');
        router.push('/');
      }
    } catch (error: any) {
      let msg = error.message;
      if (error.code === 'auth/invalid-credential') msg = 'E-mail ou senha incorretos.';
      if (error.code === 'auth/email-already-in-use') msg = 'Este e-mail já está registrado.';
      if (error.code === 'auth/weak-password') msg = 'A senha é muito fraca.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-8 bg-white rounded-3xl shadow-xl border border-purple-100">
      <div className="text-center">
        <h2 className="text-2xl font-black uppercase italic text-gray-900">{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
        <p className="text-sm text-gray-500 mt-1">{isLogin ? 'Entre para continuar no HabboTop' : 'Junte-se à nossa comunidade'}</p>
      </div>
      
      <Button type="button" variant="outline" className="w-full gap-2" onClick={handleGoogleLogin} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar com Google'}
      </Button>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Ou continue com</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl" />
        <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-xl" />
        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Cadastrar'}
        </Button>
      </form>
      
      <div className="text-center">
        <Button type="button" variant="ghost" className="text-sm text-purple-600 hover:text-purple-700" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
        </Button>
      </div>
    </div>
  );
};
