'use client';

import React from 'react';
import { Navbar } from '@/components/layout/navbar';
import { useFirebase } from '@/components/providers/firebase-provider';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown, ShieldCheck, TrendingUp, BarChart3, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const plans = [
  {
    id: 'bronze',
    name: 'Bronze',
    price: '1,00',
    icon: <Star className="w-6 h-6 text-amber-600" />,
    features: [
      'Badge VIP Bronze no card',
      'XP em dobro ao votar (+10 XP)',
      'Destaque sutil no ranking',
      'Suporte via Discord',
    ],
    color: 'border-amber-200 bg-amber-50/10',
    btnVariant: 'outline' as const,
  },
  {
    id: 'silver',
    name: 'Prata',
    price: '1,00',
    icon: <Zap className="w-6 h-6 text-gray-400" />,
    features: [
      'Badge VIP Prata no card',
      'XP em dobro ao votar (+10 XP)',
      'Borda prateada no hotel',
      'Analytics básicos',
      'Destaque rotativo na Home',
    ],
    color: 'border-gray-300 bg-gray-50/10',
    btnVariant: 'default' as const,
    popular: true,
  },
  {
    id: 'gold',
    name: 'Ouro',
    price: '1,00',
    icon: <Crown className="w-6 h-6 text-amber-500" />,
    features: [
      'Badge VIP Ouro no card',
      'XP em dobro ao votar (+10 XP)',
      'Borda dourada animada',
      'Analytics completos',
      'Destaque fixo no topo',
      'Suporte prioritário 24/7',
    ],
    color: 'border-amber-400 bg-amber-50/20',
    btnVariant: 'vip' as const,
  },
];

export default function VipPlans() {
  const { user, profile } = useFirebase();
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null);

  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      const payment_id = params.get('payment_id');

      if (status === 'success' || status === 'approved') {
        if (payment_id) {
          toast.loading('Validando pagamento...', { id: 'mp-val' });
          fetch('/api/checkout/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_id })
          }).then(() => {
            toast.success('Pagamento Aprovado! Seu VIP foi ativado.', { id: 'mp-val' });
            router.replace('/vip');
          }).catch(() => {
            toast.error('Erro ao validar pagamento.', { id: 'mp-val' });
          });
        }
      } else if (status === 'failure') {
        toast.error('O pagamento falhou ou foi cancelado.', { duration: 5000 });
        router.replace('/vip');
      } else if (status === 'pending') {
        toast.loading('Seu pagamento está pendente de processamento.', { duration: 5000 });
        router.replace('/vip');
      }
    }
  }, [router]);

  const handleCheckout = async (planId: string, planName: string, price: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para assinar um plano!');
      router.push('/login');
      return;
    }

    setIsProcessing(planId);
    
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, planName, price, userId: user.uid }),
      });

      const data = await res.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error(data.error || 'Erro ao gerar link de pagamento');
      }
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast.error('Erro ao conectar com Mercado Pago.');
      setIsProcessing(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge variant="vip" className="mb-4">HABBOTOP PREMIUM</Badge>
            <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight text-gray-900 mb-6">
              Destaque Seu Hotel <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-purple-400">
                Para Toda a Comunidade
              </span>
            </h1>
            <p className="text-lg text-gray-600">
              Escolha o plano ideal para impulsionar seu servidor, ganhar visibilidade e atrair centenas de novos jogadores todos os dias.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(
                "h-full flex flex-col relative overflow-hidden",
                plan.color,
                plan.popular && "ring-2 ring-purple-500 shadow-xl shadow-purple-900/10"
              )}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 p-2 bg-purple-500 text-white text-[10px] font-bold rounded-bl-xl">
                    MAIS POPULAR
                  </div>
                )}
                <CardHeader>
                  <div className="mb-4">{plan.icon}</div>
                  <CardTitle className="text-2xl text-gray-900">{plan.name}</CardTitle>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">R$ {plan.price}</span>
                    <span className="text-gray-500 text-sm">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={plan.btnVariant} 
                    className={cn(
                      "w-full h-12 text-base font-bold",
                      profile?.vipType === plan.id && "bg-emerald-500 hover:bg-emerald-600 text-white border-none"
                    )}
                    onClick={() => handleCheckout(plan.id, plan.name, plan.price)}
                    disabled={isProcessing !== null || profile?.vipType === plan.id}
                  >
                    {isProcessing === plan.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : profile?.vipType === plan.id ? (
                      'Plano Ativo'
                    ) : (
                      'Assinar Agora'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6">
            <div className="h-12 w-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Visibilidade Máxima</h3>
            <p className="text-sm text-gray-500">Apareça no topo do ranking e atraia mais jogadores organicamente.</p>
          </div>
          <div className="text-center p-6">
            <div className="h-12 w-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Badge Exclusiva</h3>
            <p className="text-sm text-gray-500">Destaque-se visualmente com badges que transmitem confiança.</p>
          </div>
          <div className="text-center p-6">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Analytics em Real-time</h3>
            <p className="text-sm text-gray-500">Acompanhe seus votos, cliques e crescimento em tempo real.</p>
          </div>
          <div className="text-center p-6">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Anti-Fraude Ativo</h3>
            <p className="text-sm text-gray-500">Proteção avançada para garantir que seus votos sejam legítimos.</p>
          </div>
        </div>
      </main>
    </div>
  );
}