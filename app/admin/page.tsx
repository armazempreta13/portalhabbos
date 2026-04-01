'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { useFirebase } from '@/components/providers/firebase-provider';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  limit,
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { 
  Shield, 
  Users, 
  Hotel, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  ExternalLink, 
  Search,
  TrendingUp,
  AlertCircle,
  Crown,
  Ban,
  UserCheck,
  Flag,
  Settings,
  MoreVertical,
  Eye,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const ADMIN_EMAILS = ['philippeboechat1@gmail.com', 'cintia.farinha12@gmail.com'];

type AdminTab = 'hotels' | 'users' | 'reports' | 'stats' | 'plans' | 'comments';

export default function AdminDashboard() {
  const { user, profile } = useFirebase();
  const [activeTab, setActiveTab] = useState<AdminTab>('hotels');
  const [hotels, setHotels] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hotelFilter, setHotelFilter] = useState<'all' | 'pending' | 'approved' | 'vip'>('all');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const hotelsSnap = await getDocs(query(collection(db, 'hotels'), orderBy('createdAt', 'desc')));
      setHotels(hotelsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100)));
      setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const reportsSnap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50)));
      setReports(reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const plansSnap = await getDocs(query(collection(db, 'vip_plans'), orderBy('price', 'asc')));
      setPlans(plansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const commentsSnap = await getDocs(query(collection(db, 'comments'), orderBy('createdAt', 'desc')));
      setComments(commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const { getDoc } = await import('firebase/firestore');
      const statsDoc = await getDoc(doc(db, 'global_stats', 'stats'));
      if (statsDoc.exists()) setGlobalStats(statsDoc.data());
      
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) return;
    fetchAdminData();
  }, [user]);

  // Hotel Actions
  const handleApprove = async (id: string, status: boolean) => {
    try {
      await updateDoc(doc(db, 'hotels', id), { isApproved: status });
      toast.success(status ? 'Hotel aprovado!' : 'Hotel desaprovado.');
    } catch (error) {
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleToggleVip = async (id: string, currentVip: boolean) => {
    try {
      await updateDoc(doc(db, 'hotels', id), { 
        isVip: !currentVip,
        vipType: !currentVip ? 'gold' : 'none'
      });
      toast.success(`VIP ${!currentVip ? 'ativado' : 'desativado'}`);
    } catch (error) {
      toast.error('Erro ao atualizar VIP.');
    }
  };

  const handleDeleteHotel = async (id: string) => {
    if (!confirm('DELETAR HOTEL? Esta ação é irreversível.')) return;
    try {
      await deleteDoc(doc(db, 'hotels', id));
      toast.success('Hotel removido permanentemente.');
    } catch (error) {
      toast.error('Erro ao remover hotel.');
    }
  };

  const handleDeleteTestHotels = async () => {
    if (!confirm('DELETAR TODOS OS HOTÉIS DE TESTE? Esta ação é irreversível.')) return;
    try {
      const testHotelsQuery = query(collection(db, 'hotels'), where('isTestData', '==', true));
      const snapshot = await getDocs(testHotelsQuery);
      
      const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);
      
      toast.success(`${snapshot.size} hotéis de teste removidos com sucesso.`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao deletar hotéis de teste.');
    }
  };

  const handleSeedPlans = async () => {
    if (!confirm('Cadastrar planos VIP padrão?')) return;
    try {
      const plans = [
        { name: 'Bronze', price: 10, durationDays: 30, benefits: ['Badge Bronze', 'Sem anúncios'], color: '#cd7f32', isActive: true },
        { name: 'Silver', price: 25, durationDays: 30, benefits: ['Badge Prata', 'Sem anúncios', 'Prioridade'], color: '#c0c0c0', isActive: true },
        { name: 'Gold', price: 50, durationDays: 30, benefits: ['Badge Ouro', 'Sem anúncios', 'Prioridade', 'Suporte VIP'], color: '#ffd700', isActive: true },
      ];
      
      for (const plan of plans) {
        await addDoc(collection(db, 'vip_plans'), plan);
      }
      toast.success('Planos VIP cadastrados!');
    } catch (error) {
      console.error("Erro ao cadastrar planos:", error);
      toast.error('Erro ao cadastrar planos.');
    }
  };

  // User Actions
  const handleToggleBan = async (id: string, isBanned: boolean) => {
    try {
      await updateDoc(doc(db, 'users', id), { isBanned: !isBanned });
      toast.success(`Usuário ${!isBanned ? 'banido' : 'desbanido'}`);
    } catch (error) {
      toast.error('Erro ao atualizar banimento.');
    }
  };

  const handleChangeRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Mudar cargo para ${newRole.toUpperCase()}?`)) return;
    try {
      await updateDoc(doc(db, 'users', id), { role: newRole });
      toast.success('Cargo atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar cargo.');
    }
  };

  // Report Actions
  const handleAssignVip = async (userId: string, planName: string, durationDays: number) => {
    if (!confirm(`Atribuir plano ${planName} para este usuário?`)) return;
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);
      
      await updateDoc(doc(db, 'users', userId), {
        isVip: true,
        vipType: planName.toLowerCase(),
        vipExpiresAt: expiresAt.toISOString(),
      });
      toast.success('Plano VIP atribuído!');
    } catch (error) {
      console.error("Erro ao atribuir plano:", error);
      toast.error('Erro ao atribuir plano.');
    }
  };

  const handleResolveReport = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'reports', id), { status: newStatus });
      toast.success('Denúncia atualizada.');
      setReports(reports.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (error) {
      toast.error('Erro ao atualizar denúncia.');
    }
  };

  // Comment Actions
  const handleUpdateCommentStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'comments', id), { status });
      toast.success(`Comentário ${status === 'approved' ? 'aprovado' : 'rejeitado'}`);
    } catch (error) {
      toast.error('Erro ao atualizar comentário.');
    }
  };

  // Plan Actions
  const handleTogglePlan = async (id: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, 'vip_plans', id), { isActive: !isActive });
      toast.success(`Plano ${!isActive ? 'ativado' : 'desativado'}`);
    } catch (error) {
      toast.error('Erro ao atualizar plano.');
    }
  };

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-black text-gray-900 uppercase italic">Acesso Negado</h1>
        <p className="text-gray-500 max-w-md mt-2">Esta área é restrita apenas para administradores autorizados.</p>
        <Link href="/" className="mt-6">
          <Button>Voltar para Home</Button>
        </Link>
      </div>
    );
  }

  const filteredHotels = hotels.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (hotelFilter === 'pending') return matchesSearch && !h.isApproved;
    if (hotelFilter === 'approved') return matchesSearch && h.isApproved;
    if (hotelFilter === 'vip') return matchesSearch && h.isVip;
    return matchesSearch;
  });

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalHotels: hotels.length,
    pendingHotels: hotels.filter(h => !h.isApproved).length,
    totalUsers: users.length,
    vipHotels: hotels.filter(h => h.isVip).length,
    totalOnline: hotels.reduce((acc, h) => acc + (h.onlineUsers || 0), 0),
    activeReports: reports.filter(r => r.status === 'pending').length
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 uppercase italic tracking-tight flex items-center gap-3">
              <Shield className="w-10 h-10 text-purple-600" /> Painel Administrativo
            </h1>
            <p className="text-gray-500 font-medium">Bem-vindo de volta, {user.displayName || 'Admin'}.</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-purple-600 text-white px-4 py-1.5 rounded-full font-bold">MODO ADMIN ATIVO</Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Card className="border-purple-100 bg-white shadow-sm">
            <CardContent className="p-6 text-center">
              <Hotel className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-gray-900">{stats.totalHotels}</p>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Hotéis Totais</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-100 bg-emerald-50/30 shadow-sm">
            <CardContent className="p-6 text-center">
              <Users className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-emerald-600">{stats.totalUsers}</p>
              <p className="text-xs text-emerald-700 uppercase font-bold tracking-wider">Usuários</p>
            </CardContent>
          </Card>
          <Card className="border-amber-100 bg-amber-50/30 shadow-sm">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-amber-600">{stats.pendingHotels}</p>
              <p className="text-xs text-amber-700 uppercase font-bold tracking-wider">Pendentes</p>
            </CardContent>
          </Card>
          <Card className="border-rose-100 bg-rose-50/30 shadow-sm">
            <CardContent className="p-6 text-center">
              <Flag className="w-6 h-6 text-rose-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-rose-600">{stats.activeReports}</p>
              <p className="text-xs text-rose-700 uppercase font-bold tracking-wider">Denúncias</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-gray-200 pb-px overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('hotels')}
            className={cn(
              "px-6 py-3 text-sm font-black uppercase italic tracking-wider transition-all border-b-2",
              activeTab === 'hotels' ? "border-purple-600 text-purple-600" : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            Hotéis
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "px-6 py-3 text-sm font-black uppercase italic tracking-wider transition-all border-b-2",
              activeTab === 'users' ? "border-purple-600 text-purple-600" : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            Usuários
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={cn(
              "px-6 py-3 text-sm font-black uppercase italic tracking-wider transition-all border-b-2",
              activeTab === 'reports' ? "border-purple-600 text-purple-600" : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            Denúncias {stats.activeReports > 0 && <Badge className="ml-2 bg-rose-500">{stats.activeReports}</Badge>}
          </button>
          <button 
            onClick={() => setActiveTab('plans')}
            className={cn(
              "px-6 py-3 text-sm font-black uppercase italic tracking-wider transition-all border-b-2",
              activeTab === 'plans' ? "border-purple-600 text-purple-600" : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            Planos VIP
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={cn(
              "px-6 py-3 text-sm font-black uppercase italic tracking-wider transition-all border-b-2",
              activeTab === 'stats' ? "border-purple-600 text-purple-600" : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            Estatísticas
          </button>
          <button 
            onClick={() => setActiveTab('comments')}
            className={cn(
              "px-6 py-3 text-sm font-black uppercase italic tracking-wider transition-all border-b-2",
              activeTab === 'comments' ? "border-purple-600 text-purple-600" : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            Comentários {comments.filter(c => c.status === 'pending').length > 0 && <Badge className="ml-2 bg-amber-500">{comments.filter(c => c.status === 'pending').length}</Badge>}
          </button>
        </div>

        {/* Search Bar */}
        {(activeTab === 'hotels' || activeTab === 'users') && (
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder={activeTab === 'hotels' ? "Buscar hotel..." : "Buscar usuário..."}
                className="pl-9 rounded-full border-purple-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="space-y-6">
          {/* HOTELS TAB */}
          {activeTab === 'hotels' && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Button variant={hotelFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setHotelFilter('all')} className="rounded-full">Todos</Button>
                <Button variant={hotelFilter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setHotelFilter('pending')} className="rounded-full">Pendentes ({stats.pendingHotels})</Button>
                <Button variant={hotelFilter === 'approved' ? 'default' : 'outline'} size="sm" onClick={() => setHotelFilter('approved')} className="rounded-full">Aprovados</Button>
                <Button variant={hotelFilter === 'vip' ? 'default' : 'outline'} size="sm" onClick={() => setHotelFilter('vip')} className="rounded-full">VIPs</Button>
                <Button variant="destructive" size="sm" onClick={handleDeleteTestHotels} className="rounded-full">Deletar Hotéis de Teste</Button>
                <Button variant="secondary" size="sm" onClick={handleSeedPlans} className="rounded-full">Cadastrar Planos VIP</Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredHotels.map((hotel) => (
                    <motion.div key={hotel.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Card className={cn("border-purple-100 bg-white", !hotel.isApproved && "border-l-4 border-l-amber-500")}>
                        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="h-14 w-14 rounded-2xl bg-purple-50 border border-purple-100 overflow-hidden flex-shrink-0 relative">
                              {hotel.logo ? (
                                <Image src={hotel.logo} alt={hotel.name} fill className="object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center font-bold text-gray-400">{hotel.name[0]}</div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-black text-gray-900 uppercase italic">{hotel.name}</h3>
                                {hotel.isVip && <Badge className="bg-amber-500 text-[10px] font-black">VIP {hotel.vipType?.toUpperCase()}</Badge>}
                                {!hotel.isApproved && <Badge variant="destructive" className="text-[10px] animate-pulse">PENDENTE</Badge>}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Dono ID: {hotel.ownerId}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <Link href={`/hotels/${hotel.slug}`} target="_blank">
                              <Button variant="ghost" size="icon" title="Ver Perfil"><Eye className="w-4 h-4" /></Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn(hotel.isVip ? "text-amber-500" : "text-gray-400")}
                              onClick={() => handleToggleVip(hotel.id, hotel.isVip)}
                              title="Alternar VIP"
                            >
                              <Star className={cn("w-4 h-4", hotel.isVip && "fill-amber-500")} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn(hotel.isApproved ? "text-amber-500" : "text-emerald-500")}
                              onClick={() => handleApprove(hotel.id, !hotel.isApproved)}
                              title={hotel.isApproved ? "Desaprovar" : "Aprovar"}
                            >
                              {hotel.isApproved ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteHotel(hotel.id)} title="Excluir">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((u) => (
                  <motion.div key={u.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Card className={cn("border-purple-100 bg-white", u.isBanned && "bg-red-50/50 border-red-100")}>
                      <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="h-12 w-12 rounded-xl bg-purple-50 border border-purple-100 overflow-hidden relative">
                            {u.avatar ? (
                              <Image src={u.avatar} alt={u.username} fill className="object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-bold text-purple-300">{u.username?.[0]}</div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-gray-900">{u.username}</h3>
                              {u.role === 'admin' && <Badge className="bg-purple-600 text-[10px]">ADMIN</Badge>}
                              {u.isVip && <Badge className="bg-amber-500 text-[10px]">VIP</Badge>}
                              {u.isBanned && <Badge variant="destructive" className="text-[10px]">BANIDO</Badge>}
                            </div>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(u.isBanned ? "text-emerald-500" : "text-red-500")}
                            onClick={() => handleToggleBan(u.id, u.isBanned)}
                            title={u.isBanned ? "Desbanir" : "Banir"}
                          >
                            {u.isBanned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-purple-600"
                            onClick={() => handleChangeRole(u.id, u.role)}
                            title="Mudar Cargo"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                          <Link href={`/profile/${u.id}`}>
                            <Button variant="ghost" size="icon" title="Ver Perfil"><Eye className="w-4 h-4" /></Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* COMMENTS TAB */}
          {activeTab === 'comments' && (
            <div className="grid grid-cols-1 gap-4">
              {comments.map((comment) => (
                <Card key={comment.id} className={cn("border-purple-100 bg-white", comment.status === 'pending' && "border-amber-300 bg-amber-50/20")}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-purple-100 overflow-hidden relative">
                        {comment.avatar && <Image src={comment.avatar} alt={comment.username} fill sizes="40px" className="object-cover" referrerPolicy="no-referrer" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{comment.username}</p>
                        <p className="text-xs text-gray-500">{comment.text}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {comment.status === 'pending' && (
                        <>
                          <Button variant="ghost" size="icon" className="text-emerald-500" onClick={() => handleUpdateCommentStatus(comment.id, 'approved')}><CheckCircle className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleUpdateCommentStatus(comment.id, 'rejected')}><XCircle className="w-4 h-4" /></Button>
                        </>
                      )}
                      {comment.status !== 'pending' && (
                        <Badge className={cn(comment.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500')}>{comment.status}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {reports.map((report) => (
                  <motion.div key={report.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Card className={cn("border-purple-100 bg-white", report.status === 'pending' && "border-l-4 border-l-rose-500")}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'}>
                                {report.status.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-gray-500">{new Date(report.createdAt?.seconds * 1000).toLocaleString()}</span>
                            </div>
                            <h3 className="font-black text-gray-900 uppercase italic tracking-tight">
                              Motivo: {report.reason}
                            </h3>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                              {report.details}
                            </p>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-gray-500">Denunciante: <span className="font-bold text-gray-900">{report.reporterId}</span></span>
                              <span className="text-gray-500">Alvo ({report.targetType}): <span className="font-bold text-gray-900">{report.targetId}</span></span>
                            </div>
                          </div>
                          
                          {report.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-100" onClick={() => handleResolveReport(report.id, 'resolved')}>
                                Resolvido
                              </Button>
                              <Button variant="outline" size="sm" className="text-gray-500" onClick={() => handleResolveReport(report.id, 'dismissed')}>
                                Arquivar
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              {reports.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-purple-100">
                  <Flag className="w-12 h-12 text-purple-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold">Nenhuma denúncia encontrada.</p>
                </div>
              )}
            </div>
          )}

          {/* PLANS TAB */}
          {activeTab === 'plans' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className={cn("border-purple-100 bg-white", !plan.isActive && "opacity-60")}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-black uppercase italic">{plan.name}</CardTitle>
                      <Badge className={plan.isActive ? "bg-emerald-500" : "bg-gray-400"}>
                        {plan.isActive ? 'ATIVO' : 'INATIVO'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-3xl font-black text-purple-600">R$ {plan.price}</p>
                    <p className="text-sm text-gray-500 font-bold">{plan.durationDays} Dias de Duração</p>
                    <div className="space-y-1">
                      {plan.benefits?.map((benefit: string, i: number) => (
                        <p key={i} className="text-xs text-gray-600 flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-emerald-500" /> {benefit}
                        </p>
                      ))}
                    </div>
                    <Button 
                      variant={plan.isActive ? "outline" : "default"} 
                      className="w-full mt-4"
                      onClick={() => handleTogglePlan(plan.id, plan.isActive)}
                    >
                      {plan.isActive ? 'Desativar Plano' : 'Ativar Plano'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {plans.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-purple-100">
                  <p className="text-gray-400 font-bold">Nenhum plano VIP cadastrado no banco de dados.</p>
                </div>
              )}
            </div>
          )}

          {/* STATS TAB */}
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-purple-100 bg-white">
                <CardHeader><CardTitle className="text-lg font-black uppercase italic">Distribuição de Hotéis</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Aprovados</span>
                    <span className="font-black">{hotels.filter(h => h.isApproved).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Pendentes</span>
                    <span className="font-black">{hotels.filter(h => !h.isApproved).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">VIPs</span>
                    <span className="font-black">{hotels.filter(h => h.isVip).length}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-purple-100 bg-white">
                <CardHeader><CardTitle className="text-lg font-black uppercase italic">Atividade do Site</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Total de Votos (Global)</span>
                    <span className="font-black">{globalStats?.totalVotes || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Total de Usuários</span>
                    <span className="font-black">{users.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Jogadores Online (Total)</span>
                    <span className="font-black">{stats.totalOnline}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Denúncias Ativas</span>
                    <span className="font-black">{stats.activeReports}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
