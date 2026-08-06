'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
} from 'recharts';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Calendar,
  FilterX
} from 'lucide-react';

interface Conta {
  id: number;
  descricao: string;
  valor: number;
  categoria: string;
  status: string;
  tipo: string;
}

interface DadosCategoria {
  name: string;
  value: number;
  color: string;
}

const COLORS = [
  '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

// Helper para obter datas do mês corrente
const getMonthDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  
  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${y}-${m}-${d}`;
  };
  
  return {
    start: formatDate(start),
    end: formatDate(end)
  };
};

export default function RelatoriosPage() {
  const [contasPagarList, setContasPagarList] = useState<Conta[]>([]);
  const [contasReceberList, setContasReceberList] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de filtro de período
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Carregar filtros persistidos no LocalStorage ou usar o mês corrente
  useEffect(() => {
    const defaults = getMonthDates();
    const savedStart = localStorage.getItem('relatorios_startDate') || defaults.start;
    const savedEnd = localStorage.getItem('relatorios_endDate') || defaults.end;
    
    setStartDate(savedStart);
    setEndDate(savedEnd);
  }, []);

  const carregarDados = async (start: string, end: string) => {
    if (!start || !end) return;
    setLoading(true);
    try {
      const [resPagar, resReceber] = await Promise.all([
        fetchWithAuth(`/api/contas?tipo=PAGAR&startDate=${start}&endDate=${end}`),
        fetchWithAuth(`/api/contas?tipo=RECEBER&startDate=${start}&endDate=${end}`),
      ]);
      
      if (resPagar.ok && resReceber.ok) {
        const [dataPagar, dataReceber] = await Promise.all([
          resPagar.json(),
          resReceber.json()
        ]);
        setContasPagarList(dataPagar.contas || []);
        setContasReceberList(dataReceber.contas || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados toda vez que o período mudar
  useEffect(() => {
    if (startDate && endDate) {
      carregarDados(startDate, endDate);
    }
  }, [startDate, endDate]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartDate(val);
    localStorage.setItem('relatorios_startDate', val);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEndDate(val);
    localStorage.setItem('relatorios_endDate', val);
  };

  const handleClearFilter = () => {
    const defaults = getMonthDates();
    setStartDate(defaults.start);
    setEndDate(defaults.end);
    localStorage.setItem('relatorios_startDate', defaults.start);
    localStorage.setItem('relatorios_endDate', defaults.end);
  };

  const calcularTotais = () => {
    const totalPago = contasPagarList
      .filter(c => c.status === 'PAGO')
      .reduce((acc, c) => acc + c.valor, 0);
    
    const totalRecebido = contasReceberList
      .filter(c => c.status === 'RECEBIDO')
      .reduce((acc, c) => acc + c.valor, 0);
    
    const totalPendentePagar = contasPagarList
      .filter(c => c.status === 'PENDENTE')
      .reduce((acc, c) => acc + c.valor, 0);
    
    const totalPendenteReceber = contasReceberList
      .filter(c => c.status === 'PENDENTE')
      .reduce((acc, c) => acc + c.valor, 0);

    return { totalPago, totalRecebido, totalPendentePagar, totalPendenteReceber };
  };

  const agruparPorCategoria = (contas: Conta[]): DadosCategoria[] => {
    const agrupado = contas.reduce((acc, conta) => {
      acc[conta.categoria] = (acc[conta.categoria] || 0) + conta.valor;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(agrupado)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  };

  const { totalPago, totalRecebido, totalPendentePagar, totalPendenteReceber } = calcularTotais();
  const dadosCategoriasPagar = agruparPorCategoria(contasPagarList.filter(c => c.status === 'PAGO'));
  const dadosCategoriasReceber = agruparPorCategoria(contasReceberList.filter(c => c.status === 'RECEBIDO'));

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Análise detalhada das suas finanças</p>
        </div>
      </div>

      {/* Barra de Filtro de Período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Período de Análise</h3>
            <p className="text-xs text-muted-foreground">Filtro persistido por data de vencimento</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-muted-foreground mb-1 ml-1 uppercase tracking-wider">Início</span>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="px-3 py-2 rounded-xl border border-border bg-muted/30 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-muted-foreground mb-1 ml-1 uppercase tracking-wider">Fim</span>
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="px-3 py-2 rounded-xl border border-border bg-muted/30 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>
          <div className="flex items-end self-stretch pt-5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilter}
              className="text-xs font-medium border-border hover:bg-muted"
            >
              <FilterX className="w-3.5 h-3.5 mr-1.5" />
              Resetar Mês
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-80 rounded-2xl border border-dashed border-border bg-card">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-3" />
          <p className="text-xs text-muted-foreground font-medium">Carregando relatórios do período...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="shadow-sm border-border/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Pago</CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPago)}</div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Recebido</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRecebido)}</div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Pendente a Pagar</CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalPendentePagar)}</div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Pendente a Receber</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-600">{formatCurrency(totalPendenteReceber)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos e Abas */}
          <Tabs defaultValue="despesas" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
              <TabsTrigger value="despesas">
                <PieChartIcon className="w-4 h-4 mr-2" />
                Despesas
              </TabsTrigger>
              <TabsTrigger value="receitas">
                <TrendingUp className="w-4 h-4 mr-2" />
                Receitas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="despesas">
              <Card className="shadow-sm border-border/80">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Despesas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="h-[350px]">
                      {dadosCategoriasPagar.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={dadosCategoriasPagar}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {dadosCategoriasPagar.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-medium border border-dashed border-border rounded-xl">
                          Nenhuma despesa registrada neste período
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {dadosCategoriasPagar.map((cat) => (
                        <div key={cat.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/40">
                          <div className="flex items-center gap-3">
                            <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="font-semibold text-sm">{cat.name}</span>
                          </div>
                          <span className="font-bold text-sm">{formatCurrency(cat.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="receitas">
              <Card className="shadow-sm border-border/80">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Receitas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="h-[350px]">
                      {dadosCategoriasReceber.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={dadosCategoriasReceber}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {dadosCategoriasReceber.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-medium border border-dashed border-border rounded-xl">
                          Nenhuma receita registrada neste período
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {dadosCategoriasReceber.map((cat) => (
                        <div key={cat.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/40">
                          <div className="flex items-center gap-3">
                            <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="font-semibold text-sm">{cat.name}</span>
                          </div>
                          <span className="font-bold text-sm">{formatCurrency(cat.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
