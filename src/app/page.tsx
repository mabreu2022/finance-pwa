'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Calendar, 
  Wallet, 
  Landmark, 
  PiggyBank, 
  LineChart, 
  Coins,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ContaBancaria {
  id: number;
  nome: string;
  tipo: 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO' | 'DINHEIRO' | 'OUTRO';
  saldo_atual: number;
}

interface DashboardData {
  totalPagar: number;
  totalReceber: number;
  saldo: number;
  contasPendentes: number;
  contasAtrasadas: number;
  contasBancarias: ContaBancaria[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    totalPagar: 0,
    totalReceber: 0,
    saldo: 0,
    contasPendentes: 0,
    contasAtrasadas: 0,
    contasBancarias: []
  });
  const [startDate, setStartDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dashboard_startDate');
      if (stored) return stored;
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dashboard_endDate');
      if (stored) return stored;
    }
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);

  const carregarDados = async (start: string, end: string) => {
    setLoading(true);
    try {
      let url = '/api/dashboard';
      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await fetchWithAuth(url);
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

  useEffect(() => {
    carregarDados(startDate, endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    if (startDate) {
      localStorage.setItem('dashboard_startDate', startDate);
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate) {
      localStorage.setItem('dashboard_endDate', endDate);
    }
  }, [endDate]);

  const getBankIcon = (tipo: string) => {
    switch (tipo) {
      case 'CORRENTE':
        return <Landmark className="h-4 w-4 text-blue-500" />;
      case 'POUPANCA':
        return <PiggyBank className="h-4 w-4 text-emerald-500" />;
      case 'INVESTIMENTO':
        return <LineChart className="h-4 w-4 text-purple-500" />;
      case 'DINHEIRO':
        return <Coins className="h-4 w-4 text-amber-500" />;
      default:
        return <Wallet className="h-4 w-4 text-cyan-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    );
  }

  // Cálculos de saldo baseados em contas bancárias reais
  const saldoAtualTotal = data.contasBancarias.reduce((acc, c) => acc + c.saldo_atual, 0);
  const saldoPrevistoTotal = saldoAtualTotal + data.totalReceber - data.totalPagar;

  // Verificar se o período foi alterado do mês corrente
  const now = new Date();
  const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentMonthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const isFiltered = startDate !== currentMonthStart || endDate !== currentMonthEnd;

  const limparFiltros = () => {
    setStartDate(currentMonthStart);
    setEndDate(currentMonthEnd);
    localStorage.removeItem('dashboard_startDate');
    localStorage.removeItem('dashboard_endDate');
  };

  // Agrupar gastos por categoria no período selecionado
  const topCategorias = (() => {
    if (!data.contasPeriodo) return [];
    
    const categoriesMap: Record<string, number> = {};
    let totalPagarPeriodo = 0;
    
    data.contasPeriodo
      .filter(c => c.tipo === 'PAGAR')
      .forEach(c => {
        categoriesMap[c.categoria] = (categoriesMap[c.categoria] || 0) + c.valor;
        totalPagarPeriodo += c.valor;
      });
      
    return Object.entries(categoriesMap)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalPagarPeriodo > 0 ? (value / totalPagarPeriodo) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo de volta, {user?.nome}!
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="dashboard-start-date" className="text-xs font-medium text-muted-foreground whitespace-nowrap">Início:</Label>
            <Input
              id="dashboard-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[140px] h-9 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="dashboard-end-date" className="text-xs font-medium text-muted-foreground whitespace-nowrap">Fim:</Label>
            <Input
              id="dashboard-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[140px] h-9 text-xs"
            />
          </div>
          {isFiltered && (
            <Button
              variant="outline"
              size="sm"
              onClick={limparFiltros}
              className="text-xs h-9"
            >
              Mês Corrente
            </Button>
          )}
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Saldo Atual em Contas */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo em Contas
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoAtualTotal >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(saldoAtualTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Saldo real disponível hoje
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total a Receber */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              A Receber (Pendentes)
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data.totalReceber)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Entradas previstas pendentes
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Total a Pagar */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              A Pagar (Pendentes)
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <ArrowDownCircle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(data.totalPagar)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.contasPendentes} contas a vencer
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Saldo Previsto */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Previsto
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoPrevistoTotal >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(saldoPrevistoTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Saldo Atual + Receber - Pagar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção Principal: Boas-vindas, Lançamentos e Bancos */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Coluna da Esquerda: Resumo e Últimas Transações */}
        <div className="md:col-span-2 space-y-6">
          {/* Card 1: Visão Mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Visão Mensal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/10 flex items-start gap-4">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Próximos passos financeiros</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Você possui <strong className="text-foreground">{data.contasPendentes} contas pendentes</strong> para pagar no período selecionado.
                    {data.contasAtrasadas > 0 && (
                      <span className="text-red-500 block mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> {data.contasAtrasadas} conta(s) estão em atraso e precisam de atenção!
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <Link href="/contas-pagar" className="block">
                  <Button variant="outline" className="w-full h-12 border-dashed flex items-center gap-2 hover:border-cyan-500 hover:text-cyan-500">
                    <ArrowDownCircle className="h-4 w-4 text-red-500" /> Ir para Contas a Pagar
                  </Button>
                </Link>
                <Link href="/contas-receber" className="block">
                  <Button variant="outline" className="w-full h-12 border-dashed flex items-center gap-2 hover:border-cyan-500 hover:text-cyan-500">
                    <ArrowUpCircle className="h-4 w-4 text-emerald-500" /> Ir para Contas a Receber
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Últimas Transações */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-lg font-bold">Últimos Lançamentos</CardTitle>
              <span className="text-xs text-muted-foreground">Período selecionado</span>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.contasPeriodo && data.contasPeriodo.length > 0 ? (
                  data.contasPeriodo.slice(0, 5).map((conta) => (
                    <div key={conta.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-cyan-500/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-1.5 rounded-lg ${conta.tipo === 'RECEBER' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {conta.tipo === 'RECEBER' ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{conta.descricao}</p>
                          <p className="text-xs text-muted-foreground truncate">{conta.categoria} • Vencimento: {formatDate(conta.data_vencimento)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className={`text-sm font-bold ${conta.tipo === 'RECEBER' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {conta.tipo === 'RECEBER' ? '+' : '-'}{formatCurrency(conta.valor)}
                        </span>
                        {conta.status === 'PAGO' || conta.status === 'RECEBIDO' ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px] py-0 px-1.5">Ok</Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 text-[10px] py-0 px-1.5">Pendente</Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum lançamento neste período.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna da Direita: Lista de Bancos/Saldos e Categorias */}
        <div className="space-y-6">
          {/* Card 1: Bancos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-base font-bold">Bancos & Carteiras</CardTitle>
              <Link href="/contas-bancarias" className="text-xs text-cyan-600 hover:underline">
                Gerenciar
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.contasBancarias.map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-cyan-500/30 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded bg-muted">
                        {getBankIcon(bank.tipo)}
                      </div>
                      <span className="text-sm font-semibold truncate">{bank.nome}</span>
                    </div>
                    <span className={`text-sm font-bold ${bank.saldo_atual >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(bank.saldo_atual)}
                    </span>
                  </div>
                ))}

                {data.contasBancarias.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Nenhum banco cadastrado.
                    <Link href="/contas-bancarias" className="text-cyan-600 hover:underline block mt-1">
                      Cadastrar agora
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Categorias */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Gastos por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCategorias.length > 0 ? (
                  topCategorias.map((cat) => (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold truncate text-xs">{cat.name}</span>
                        <span className="font-bold text-muted-foreground text-xs">{formatCurrency(cat.value)} ({cat.percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum gasto neste período.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
