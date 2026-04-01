'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirebase } from '@/components/providers/firebase-provider';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Globe, Link as LinkIcon, Image as ImageIcon, Type, Layout, Briefcase, Crown } from 'lucide-react';
import Link from 'next/link';

const hotelSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(50),
  url: z.string().url('URL inválida'),
  logo: z.string().url('URL do logo inválida').optional().or(z.literal('')),
  banner: z.string().url('URL do banner inválida').optional().or(z.literal('')),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(500),
  category: z.string().min(1, 'Categoria é obrigatória'),
  staffVacancies: z.string().optional(),
  gallery: z.string().optional(),
  wantHighlight: z.boolean().optional(),
});

type HotelFormValues = z.infer<typeof hotelSchema>;

export default function NewHotel() {
  const { user, profile } = useFirebase();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<HotelFormValues>({
    resolver: zodResolver(hotelSchema),
    defaultValues: {
      category: 'general',
    }
  });

  const onSubmit = async (data: HotelFormValues) => {
    if (!user) {
      toast.error('Você precisa estar logado!');
      return;
    }

    setIsSubmitting(true);
    try {
      // Fetch real-time online users
      let onlineUsers = 0;
      try {
        const response = await fetch(`/api/hotel-stats?url=${encodeURIComponent(data.url)}`);
        const stats = await response.json();
        onlineUsers = stats.online || 0;
      } catch (e) {
        console.error("Erro ao buscar usuários online:", e);
        // Continue with 0 if API fails
      }

      const slug = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Parse comma-separated strings into arrays
      const staffVacancies = data.staffVacancies 
        ? data.staffVacancies.split(',').map(s => s.trim()).filter(s => s !== '') 
        : [];
      const gallery = data.gallery 
        ? data.gallery.split(',').map(s => s.trim()).filter(s => s !== '') 
        : [];

      // Check if user has active VIP to highlight the hotel
      const isVipUser = profile?.isVip && 
                        profile?.vipExpiresAt && 
                        new Date(profile.vipExpiresAt) > new Date();
      const vipType = isVipUser ? profile?.vipType : 'none';
      const shouldHighlight = isVipUser && data.wantHighlight;

      await addDoc(collection(db, 'hotels'), {
        ...data,
        staffVacancies,
        gallery,
        ownerId: user.uid,
        slug,
        onlineUsers, // Use real-time data
        votesCount: 0,
        growthRate: 0,
        isActive: true,
        isApproved: false,
        isVip: shouldHighlight || false,
        vipType: shouldHighlight ? vipType : 'none',
        isTrending: false,
        fraudScore: 0,
        rankingScore: 0, // No more artificial boost
        createdAt: serverTimestamp(),
      });

      toast.success(shouldHighlight 
        ? `Hotel cadastrado com destaque ${vipType?.toUpperCase()} ativado!` 
        : 'Hotel cadastrado com sucesso! Aguarde a aprovação.'
      );
      router.push('/');
    } catch (error) {
      console.error("Erro ao cadastrar hotel:", error);
      toast.error('Erro ao cadastrar hotel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <CardTitle>Acesso Negado</CardTitle>
              <CardDescription>Você precisa estar logado para cadastrar um hotel.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link href="/">
                <Button>Voltar para Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-500 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar para o Ranking
          </Link>

          <Card className="border-purple-100 bg-white">
            <CardHeader>
              <CardTitle className="text-3xl text-gray-900">Divulgar Novo Hotel</CardTitle>
              <CardDescription>Preencha os dados abaixo para listar seu servidor no HabboTop.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Type className="w-4 h-4 text-purple-500" /> Nome do Hotel
                  </label>
                  <Input {...register('name')} placeholder="Ex: Habbo Hotel" />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-500" /> URL do Site
                  </label>
                  <Input {...register('url')} placeholder="https://meuhabbo.com" />
                  {errors.url && <p className="text-xs text-red-500">{errors.url.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-500" /> URL do Logo (Opcional)
                    </label>
                    <Input {...register('logo')} placeholder="https://.../logo.png" />
                    {errors.logo && <p className="text-xs text-red-500">{errors.logo.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Layout className="w-4 h-4 text-purple-500" /> Categoria
                    </label>
                    <select 
                      {...register('category')}
                      className="flex h-10 w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900"
                    >
                      <option value="general">Geral</option>
                      <option value="roleplay">Roleplay</option>
                      <option value="events">Eventos</option>
                      <option value="classic">Clássico</option>
                      <option value="custom">Customizado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-500" /> URL do Banner (Opcional)
                    </label>
                    <Input {...register('banner')} placeholder="https://.../banner.png" />
                    {errors.banner && <p className="text-xs text-red-500">{errors.banner.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-purple-500" /> Vagas na Staff (Separadas por vírgula)
                    </label>
                    <Input {...register('staffVacancies')} placeholder="Moderador, Arquiteto, Guia" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-500" /> Galeria de Fotos (URLs separadas por vírgula)
                  </label>
                  <textarea 
                    {...register('gallery')}
                    rows={2}
                    className="flex w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900"
                    placeholder="https://.../foto1.png, https://.../foto2.png"
                  />
                </div>

                {profile?.isVip && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <Crown className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-bold text-amber-900">Destaque VIP Ativo</p>
                        <p className="text-xs text-amber-700">Você possui o plano {profile.vipType?.toUpperCase()}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" {...register('wantHighlight')} className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      <span className="ml-3 text-sm font-bold text-amber-900">Destacar</span>
                    </label>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-purple-500" /> Descrição Curta
                  </label>
                  <textarea 
                    {...register('description')}
                    rows={4}
                    className="flex w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900"
                    placeholder="Conte um pouco sobre o seu hotel..."
                  />
                  {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar Hotel'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}