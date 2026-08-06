'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { fetchWithAuth } from '@/lib/auth/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Calendar,
  FilterX,
  TrendingUp,
  DollarSign,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Users,
  BarChart3,
  ListTodo,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
type Estagio = 'PROSPECCAO' | 'PROPOSTA' | 'NEGOCIACAO' | 'GANHA' | 'PERDIDA';

interface Proposta {
  id: number;
  cliente_id: number;
  usuario_id: number;
  titulo: string;
  valor: number;
  estagio: Estagio;
  descricao: string | null;
  data_validade: string | null;
  data_fechamento: string | null;
  data_cadastro: string;
  cliente_nome?: string;
  usuario_nome?: string;
}

interface Cliente {
  id: number;
  nome: string;
}

interface Vendedor {
  id: number;
  nome: string;
  perfil: string;
}

interface EstagioInfo {
  label: string;
  color: string;
  bg: string;
  border: string;
}

const ESTAGIO_DETAILS: Record<Estagio, EstagioInfo> = {
  PROSPECCAO: { label: 'Prospecção', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  PROPOSTA: { label: 'Proposta Enviada', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  NEGOCIACAO: { label: 'Negociação', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800' },
  GANHA: { label: 'Fechada (Ganha)', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
  PERDIDA: { label: 'Perdida', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
};

const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444'];

const getMonthDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${y}-${m}-${d}`;
  };
  return {
    start: formatDate(new Date(year, month, 1)),
    end: formatDate(new Date(year, month + 1, 0))
  };
};

export default function ComercialPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'funil' | 'propostas'>('dashboard');

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedSeller, setSelectedSeller] = useState<string>('all');

  // Lists
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [stats, setStats] = useState<any>({ stages: [], wonTotal: 0, wonCount: 0, totalFinished: 0, sellers: [] });

  const [loading, setLoading] = useState(true);

  // Modal Form
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cliente_id: '',
    usuario_id: '',
    titulo: '',
    valor: '',
    estagio: 'PROSPECCAO' as Estagio,
    descricao: '',
    data_validade: '',
    data_fechamento: '',
  });

  // Guard access
  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.perfil !== 'VENDEDOR') {
      router.replace('/');
    }
  }, [user, router]);

  // Load initial filters and list vendors/clients
  useEffect(() => {
    const defaults = getMonthDates();
    const savedStart = localStorage.getItem('comercial_startDate') || defaults.start;
    const savedEnd = localStorage.getItem('comercial_endDate') || defaults.end;
    const savedSeller = localStorage.getItem('comercial_seller') || 'all';

    setStartDate(savedStart);
    setEndDate(savedEnd);
    setSelectedSeller(savedSeller);

    carregarAuxiliares();
  }, []);

  const carregarAuxiliares = async () => {
    try {
      const [resClients, resUsers] = await Promise.all([
        fetchWithAuth('/api/clientes'),
        fetchWithAuth('/api/configuracoes/usuarios')
      ]);
      if (resClients.ok) {
        const data = await resClients.json();
        setClientes(data.clientes || data);
      }
      if (resUsers.ok) {
        const data = await resUsers.json();
        // Filtra para mostrar apenas Admin ou Vendedores
        const filtered = (data.usuarios || data).filter((u: any) => u.role === 'ADMIN' || u.perfil === 'VENDEDOR' || u.perfil === 'ADMIN');
        setVendedores(filtered);
      }
    } catch (e) {
      console.error('Erro ao carregar dados auxiliares:', e);
    }
  };

  const loadData = async (start: string, end: string, seller: string) => {
    setLoading(true);
    try {
      const sellerParam = seller !== 'all' ? `&usuarioId=${seller}` : '';
      const [resProps, resStats] = await Promise.all([
        fetchWithAuth(`/api/comercial/propostas?startDate=${start}&endDate=${end}${sellerParam}`),
        fetchWithAuth(`/api/comercial/dashboard?startDate=${start}&endDate=${end}${sellerParam}`)
      ]);

      if (resProps.ok && resStats.ok) {
        const propsData = await resProps.json();
        const statsData = await resStats.json();
        setPropostas(propsData.propostas || []);
        setStats(statsData.stats || { stages: [], wonTotal: 0, wonCount: 0, totalFinished: 0, sellers: [] });
      }
    } catch (error) {
      console.error('Erro ao buscar dados comerciais:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reload on filters change
  useEffect(() => {
    if (startDate && endDate) {
      loadData(startDate, endDate, selectedSeller);
    }
  }, [startDate, endDate, selectedSeller]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartDate(val);
    localStorage.setItem('comercial_startDate', val);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEndDate(val);
    localStorage.setItem('comercial_endDate', val);
  };

  const handleSellerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSeller(val);
    localStorage.setItem('comercial_seller', val);
  };

  const handleResetFilters = () => {
    const defaults = getMonthDates();
    setStartDate(defaults.start);
    setEndDate(defaults.end);
    setSelectedSeller('all');
    localStorage.setItem('comercial_startDate', defaults.start);
    localStorage.setItem('comercial_endDate', defaults.end);
    localStorage.setItem('comercial_seller', 'all');
  };

  // Modal Open functions
  const openCreate = () => {
    setEditingId(null);
    setFormError('');
    setFormSuccess('');
    setForm({
      cliente_id: clientes[0]?.id.toString() || '',
      usuario_id: user?.id.toString() || '',
      titulo: '',
      valor: '',
      estagio: 'PROSPECCAO',
      descricao: '',
      data_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      data_fechamento: '',
    });
    setModalOpen(true);
  };

  const openEdit = (p: Proposta) => {
    setEditingId(p.id);
    setFormError('');
    setFormSuccess('');
    setForm({
      cliente_id: p.cliente_id.toString(),
      usuario_id: p.usuario_id.toString(),
      titulo: p.titulo,
      valor: p.valor.toString(),
      estagio: p.estagio,
      descricao: p.descricao || '',
      data_validade: p.data_validade ? p.data_validade.split('T')[0] : '',
      data_fechamento: p.data_fechamento ? p.data_fechamento.split('T')[0] : '',
    });
    setModalOpen(true);
  };

  // CRUD Actions
  const handleSave = async () => {
    if (!form.titulo || !form.valor || !form.cliente_id || !form.usuario_id) {
      setFormError('Preencha todos os campos obrigatórios (*)');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        cliente_id: parseInt(form.cliente_id),
        usuario_id: parseInt(form.usuario_id),
        titulo: form.titulo,
        valor: parseFloat(form.valor),
        estagio: form.estagio,
        descricao: form.descricao || null,
        data_validade: form.data_validade || null,
        data_fechamento: form.estagio === 'GANHA' || form.estagio === 'PERDIDA' 
          ? (form.data_fechamento || new Date().toISOString().split('T')[0]) 
          : null,
      };

      let res;
      if (editingId) {
        res = await fetchWithAuth(`/api/comercial/propostas/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetchWithAuth('/api/comercial/propostas', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setFormSuccess('Sucesso!');
        setTimeout(() => {
          setModalOpen(false);
          loadData(startDate, endDate, selectedSeller);
        }, 1000);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao processar');
      }
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente remover esta proposta?')) return;
    try {
      const res = await fetchWithAuth(`/api/comercial/propostas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData(startDate, endDate, selectedSeller);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStage = async (id: number, current: Proposta, nextStage: Estagio) => {
    try {
      const payload = {
        estagio: nextStage,
        data_fechamento: nextStage === 'GANHA' || nextStage === 'PERDIDA' 
          ? new Date().toISOString().split('T')[0] 
          : null
      };
      const res = await fetchWithAuth(`/api/comercial/propostas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        loadData(startDate, endDate, selectedSeller);
      }
    } catch (e) {
      console.error('Erro ao mover estágio:', e);
    }
  };

  // Calculations for mini dashboard
  const totalValueInFunnel = propostas.reduce((acc, p) => acc + p.valor, 0);
  const activeProposalsCount = propostas.filter(p => p.estagio !== 'GANHA' && p.estagio !== 'PERDIDA').length;
  const wonRate = stats.totalFinished > 0 ? (stats.wonCount / stats.totalFinished) * 100 : 0;

  // Chart Mappings
  const chartData = Object.keys(ESTAGIO_DETAILS).map((key) => {
    const st = stats.stages?.find((s: any) => s.estagio === key);
    return {
      name: ESTAGIO_DETAILS[key as Estagio].label,
      valor: st ? st.valor : 0,
      quantidade: st ? st.quantidade : 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Comercial</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestão de propostas, funil de vendas e ranking comercial</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={openCreate} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0">
            <Plus className="w-4 h-4 mr-2" />
            Nova Proposta
          </Button>
        </div>
      </div>

      {/* Filtros Gerais */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-3 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-border pb-3 lg:pb-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filtros Comerciais</h3>
            <p className="text-[10px] text-muted-foreground">Restringir período e vendedores</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:col-span-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Início</span>
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="px-3 py-2 rounded-xl border border-border bg-muted/30 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Fim</span>
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="px-3 py-2 rounded-xl border border-border bg-muted/30 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Vendedor</span>
            <select
              value={selectedSeller}
              onChange={handleSellerChange}
              className="px-3 py-2 rounded-xl border border-border bg-muted/30 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="all">Todos os Vendedores</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>{v.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="lg:col-span-4 flex justify-end border-t border-border/50 pt-2">
          <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs text-muted-foreground hover:text-foreground">
            <FilterX className="w-3.5 h-3.5 mr-1.5" />
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'dashboard'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Dashboard Comercial
        </button>
        <button
          onClick={() => setActiveTab('funil')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'funil'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          Funil de Vendas (Kanban)
        </button>
        <button
          onClick={() => setActiveTab('propostas')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'propostas'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Propostas
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-80 rounded-2xl border border-dashed border-border bg-card">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-3" />
          <p className="text-xs text-muted-foreground font-medium">Carregando dados comerciais...</p>
        </div>
      ) : (
        <>
          {/* ── Tab: Dashboard ─────────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="shadow-sm border-border/80">
                  <CardHeader className="flex flex-row items-center justify-between pb-1">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Volume no Funil</CardTitle>
                    <DollarSign className="w-4 h-4 text-cyan-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{formatCurrency(totalValueInFunnel)}</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{propostas.length} propostas totais no ciclo</p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/80">
                  <CardHeader className="flex flex-row items-center justify-between pb-1">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vendas Fechadas (Ganhas)</CardTitle>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.wonTotal)}</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{stats.wonCount} propostas ganhas</p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/80">
                  <CardHeader className="flex flex-row items-center justify-between pb-1">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total de Comissões</CardTitle>
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.comissaoTotal || 0)}</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Comissão padrão/individual ativa</p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/80">
                  <CardHeader className="flex flex-row items-center justify-between pb-1">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Propostas em Aberto</CardTitle>
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{activeProposalsCount}</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Negociações ativas no funil</p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/80">
                  <CardHeader className="flex flex-row items-center justify-between pb-1">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Taxa de Conversão</CardTitle>
                    <AlertCircle className="w-4 h-4 text-violet-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-violet-600 dark:text-violet-400">{wonRate.toFixed(1)}%</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{stats.totalFinished} propostas concluídas</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico do Funil */}
                <Card className="lg:col-span-2 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Distribuição de Valores por Estágio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tickFormatter={(val) => `R$ ${val / 1000}k`} tick={{ fontSize: 10 }} />
                          <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Ranking de Vendedores */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-500" />
                      Desempenho por Vendedor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {stats.sellers?.length > 0 ? (
                      stats.sellers.map((s: any, idx: number) => (
                        <div key={s.vendedorId} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/30">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center font-bold text-xs">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-xs">{s.vendedorNome}</div>
                              <div className="text-[10px] text-muted-foreground">{s.quantidade} vendas ganhas</div>
                              <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">Comissão: {formatCurrency(s.comissao || 0)}</div>
                            </div>
                          </div>
                          <span className="font-bold text-xs text-amber-600 dark:text-amber-400">{formatCurrency(s.valor)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground text-xs font-medium border border-dashed border-border rounded-xl">
                        Nenhuma venda registrada
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ── Tab: Funil (Kanban) ────────────────────────────────────────────── */}
          {activeTab === 'funil' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto pb-4">
              {(Object.keys(ESTAGIO_DETAILS) as Estagio[]).map((key) => {
                const stage = ESTAGIO_DETAILS[key];
                const stageProps = propostas.filter((p) => p.estagio === key);
                const stageTotal = stageProps.reduce((acc, p) => acc + p.valor, 0);

                return (
                  <div key={key} className="flex flex-col w-full min-w-[220px] rounded-2xl bg-muted/30 border border-border/60 p-3 h-[600px]">
                    {/* Header do Estágio */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${stage.color}`}>{stage.label}</span>
                      <span className="text-[10px] bg-background/50 px-2 py-0.5 rounded-full border border-border/30 font-semibold">{stageProps.length}</span>
                    </div>
                    <div className="text-[11px] font-bold text-muted-foreground border-b border-border/30 pb-2 mb-3">
                      Total: {formatCurrency(stageTotal)}
                    </div>

                    {/* Cards do Kanban */}
                    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                      {stageProps.map((p) => (
                        <div key={p.id} className="p-3.5 rounded-xl bg-background border border-border shadow-sm flex flex-col justify-between hover:border-amber-400/50 transition-all group">
                          <div>
                            <div className="text-xs font-bold leading-tight group-hover:text-amber-600 transition-colors mb-1">{p.titulo}</div>
                            <div className="text-[10px] text-muted-foreground/80 mb-2 truncate">Cliente: {p.cliente_name || p.cliente_nome}</div>
                          </div>
                          <div>
                            <div className="text-xs font-bold mb-3">{formatCurrency(p.valor)}</div>
                            <div className="text-[9px] text-muted-foreground flex items-center justify-between border-t border-border/30 pt-2">
                              <span>Resp: {p.usuario_name || p.usuario_nome}</span>
                            </div>
                            
                            {/* Botões Rápidos de Ação */}
                            <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 border-t border-border/20">
                              {key !== 'PROSPECCAO' && (
                                <button
                                  onClick={() => {
                                    const stagesOrder: Estagio[] = ['PROSPECCAO', 'PROPOSTA', 'NEGOCIACAO', 'GANHA', 'PERDIDA'];
                                    const prev = stagesOrder[stagesOrder.indexOf(key) - 1];
                                    handleUpdateStage(p.id, p, prev);
                                  }}
                                  className="text-[10px] font-medium text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded bg-muted/60 border border-border/30"
                                >
                                  ← voltar
                                </button>
                              )}
                              {key !== 'GANHA' && key !== 'PERDIDA' && (
                                <button
                                  onClick={() => {
                                    const stagesOrder: Estagio[] = ['PROSPECCAO', 'PROPOSTA', 'NEGOCIACAO', 'GANHA', 'PERDIDA'];
                                    const next = stagesOrder[stagesOrder.indexOf(key) + 1];
                                    handleUpdateStage(p.id, p, next);
                                  }}
                                  className="text-[10px] font-semibold text-amber-600 hover:text-white px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-600 border border-amber-500/20"
                                >
                                  avançar →
                                </button>
                              )}
                              {(key === 'NEGOCIACAO' || key === 'PROPOSTA') && (
                                <button
                                  onClick={() => handleUpdateStage(p.id, p, 'PERDIDA')}
                                  className="text-[9px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-1 py-0.5 rounded border border-red-500/10"
                                >
                                  perder
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {stageProps.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border/40 rounded-xl h-24 text-[10px] text-muted-foreground/60">
                          Vazio
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Tab: Propostas (CRUD) ─────────────────────────────────────────── */}
          {activeTab === 'propostas' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border overflow-hidden bg-card">
                {propostas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-16 text-center">
                    <Briefcase className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm font-medium">Nenhuma proposta comercial cadastrada no período</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">Título</th>
                        <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">Cliente</th>
                        <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">Valor</th>
                        <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">Estágio</th>
                        <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">Vendedor</th>
                        <th className="text-right px-4 py-3.5 font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {propostas.map((p, idx) => {
                        const est = ESTAGIO_DETAILS[p.estagio] || ESTAGIO_DETAILS.PROSPECCAO;
                        return (
                          <tr key={p.id} className={`border-b border-border/50 transition-colors hover:bg-muted/20 ${idx % 2 === 0 ? '' : 'bg-muted/5'}`}>
                            <td className="px-4 py-3.5 font-medium">{p.titulo}</td>
                            <td className="px-4 py-3.5 text-muted-foreground">{p.cliente_name || p.cliente_nome}</td>
                            <td className="px-4 py-3.5 font-bold">{formatCurrency(p.valor)}</td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${est.bg} ${est.border} ${est.color}`}>
                                {est.label}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground">{p.usuario_name || p.usuario_nome}</td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-muted-foreground hover:text-red-500">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modal: Criar / Editar Proposta ──────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
              <h3 className="text-lg font-bold">
                {editingId ? 'Editar Proposta Comercial' : 'Nova Proposta Comercial'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  <Check className="w-4 h-4 shrink-0" />
                  {formSuccess}
                </div>
              )}

              {/* Título da proposta */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Título da Proposta *</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
                  placeholder="Ex: Contrato Anual ERP ou Projeto Mobile"
                />
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Cliente *</label>
                <select
                  value={form.cliente_id}
                  onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
                >
                  <option value="" disabled>Selecione um Cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Valor */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Valor Proposto (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valor}
                    onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-bold"
                    placeholder="0.00"
                  />
                </div>

                {/* Estágio */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Estágio Inicial *</label>
                  <select
                    value={form.estagio}
                    onChange={e => setForm(f => ({ ...f, estagio: e.target.value as Estagio }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
                  >
                    {(Object.entries(ESTAGIO_DETAILS) as [Estagio, EstagioInfo][]).map(([key, info]) => (
                      <option key={key} value={key}>{info.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vendedor Responsável */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Vendedor Responsável *</label>
                <select
                  value={form.usuario_id}
                  onChange={e => setForm(f => ({ ...f, usuario_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
                  disabled={user?.role !== 'ADMIN'} // Vendedor não pode atribuir a outros
                >
                  {vendedores.map((v) => (
                    <option key={v.id} value={v.id}>{v.nome}</option>
                  ))}
                </select>
              </div>

              {/* Datas de Validade e Fechamento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Data de Validade</label>
                  <input
                    type="date"
                    value={form.data_validade}
                    onChange={e => setForm(f => ({ ...f, data_validade: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Data de Fechamento</label>
                  <input
                    type="date"
                    value={form.data_fechamento}
                    onChange={e => setForm(f => ({ ...f, data_fechamento: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
                    disabled={form.estagio !== 'GANHA' && form.estagio !== 'PERDIDA'} // Apenas fechado
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Detalhes / Escopo da Proposta</label>
                <textarea
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium resize-none"
                  placeholder="Escopo resumido do projeto ou termos comerciais negociados..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-border bg-muted/10">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 rounded-xl"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Proposta'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
