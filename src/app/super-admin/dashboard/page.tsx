'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, CreditCard, TrendingUp, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DashboardData {
  totalTenants: number;
  totalUsuarios: number;
  totalContas: number;
  tenantsAtivos: number;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({
    totalTenants: 0,
    totalUsuarios: 0,
    totalContas: 0,
    tenantsAtivos: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('superAdminToken');
    if (!token) {
      router.push('/super-admin/login');
      return;
    }

    // Carregar dados do dashboard
    const carregarDados = async () => {
      try {
        const response = await fetch('/api/super-admin/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdminUser');
    router.push('/super-admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Super Admin</h1>
              <p className="text-xs text-slate-400">Painel de Gestão SaaS</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-slate-300 hover:text-white">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Visão Geral do Sistema</h2>
          <p className="text-slate-400">Gerencie tenants, usuários e configurações globais</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total de Tenants</CardTitle>
              <Building2 className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{data.totalTenants}</div>
              <p className="text-xs text-slate-500 mt-1">{data.tenantsAtivos} ativos</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{data.totalUsuarios}</div>
              <p className="text-xs text-slate-500 mt-1">usuários cadastrados</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total de Contas</CardTitle>
              <CreditCard className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{data.totalContas}</div>
              <p className="text-xs text-slate-500 mt-1">movimentações</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Receita Mensal</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">R$ 0,00</div>
              <p className="text-xs text-slate-500 mt-1">em andamento</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Gerenciar Tenants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-slate-400 text-sm">Visualize e gerencie todas as empresas/clientes do sistema.</p>
              <Link href="/super-admin/tenants">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                  <Building2 className="w-4 h-4 mr-2" />
                  Ver Tenants
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-slate-400 text-sm">Gerencie planos, preços e configurações globais.</p>
              <Button className="w-full bg-slate-600 hover:bg-slate-700" disabled>
                <Shield className="w-4 h-4 mr-2" />
                Em breve
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
