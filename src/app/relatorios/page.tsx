'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/auth/AuthContext';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

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

export default function RelatoriosPage() {
  const [contasPagarList, setContasPagarList] = useState<Conta[]>([]);
  const [contasReceberList, setContasReceberList] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [resPagar, resReceber] = await Promise.all([
          fetchWithAuth('/api/contas?tipo=PAGAR'),
          fetchWithAuth('/api/contas?tipo=RECEBER'),
        ]);
        
        if (resPagar.ok && resReceber.ok) {
          const [dataPagar, dataReceber] = await Promise.all([
            resPagar.json(),
            resReceber.json()
          ]);
          setContasPagarList(dataPagar.contas);
          setContasReceberList(dataReceber.contas);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground mt-1">Análise detalhada das suas finanças</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pago</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPago)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recebido</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRecebido)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendente a Pagar</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalPendentePagar)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendente a Receber</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{formatCurrency(totalPendenteReceber)}</div>
          </CardContent>
        </Card>
      </div>

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
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="h-[400px]">
                  {dadosCategoriasPagar.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosCategoriasPagar}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={120}
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
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Nenhuma despesa registrada
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {dadosCategoriasPagar.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <span className="font-bold">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receitas">
          <Card>
            <CardHeader>
              <CardTitle>Receitas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="h-[400px]">
                  {dadosCategoriasReceber.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosCategoriasReceber}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={120}
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
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Nenhuma receita registrada
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {dadosCategoriasReceber.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <span className="font-bold">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
