'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Building2, Plus, Search, MoreVertical, Shield, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Tenant {
  id: number;
  nome: string;
  cnpj: string | null;
  nome_fantasia: string | null;
  email_admin: string | null;
  status: string;
  plano_id: number | null;
  data_criacao: string;
}

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('superAdminToken');
    if (!token) {
      router.push('/super-admin/login');
      return;
    }

    const carregarTenants = async () => {
      try {
        const response = await fetch('/api/super-admin/tenants', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTenants(data.tenants);
        }
      } catch (error) {
        console.error('Erro ao carregar tenants:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarTenants();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdminUser');
    router.push('/super-admin/login');
  };

  const filteredTenants = tenants.filter(t => 
    (t.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (t.email_admin?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return <Badge className="bg-emerald-500/10 text-emerald-600">Ativo</Badge>;
      case 'TRIAL':
        return <Badge className="bg-amber-500/10 text-amber-600">Trial</Badge>;
      case 'INATIVO':
        return <Badge className="bg-red-500/10 text-red-600">Inativo</Badge>;
      case 'BLOQUEADO':
        return <Badge className="bg-slate-500/10 text-slate-600">Bloqueado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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
            <Link href="/super-admin/dashboard">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Tenants</h1>
              <p className="text-xs text-slate-400">Gerenciar empresas/clientes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleLogout} className="text-slate-300 hover:text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Empresas Cadastradas</h2>
            <p className="text-slate-400">{tenants.length} tenants no sistema</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>

        {/* Tenants Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTenants.map((tenant) => (
            <Card key={tenant.id} className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg">{tenant.nome}</CardTitle>
                    <p className="text-xs text-slate-400">{tenant.cnpj || 'Sem CNPJ'}</p>
                  </div>
                </div>
                {getStatusBadge(tenant.status)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email Admin:</span>
                    <span className="text-white">{tenant.email_admin || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plano:</span>
                    <span className="text-cyan-400">ID #{tenant.plano_id || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Criado em:</span>
                    <span className="text-white">{new Date(tenant.data_criacao).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTenants.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhum tenant encontrado</p>
          </div>
        )}
      </main>
    </div>
  );
}
