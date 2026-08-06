'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, Key, AlertTriangle, Clock, DollarSign, CheckCircle2,
  XCircle, Pencil, ReceiptText, ChevronRight, Search
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/auth/AuthContext';

interface Licenca {
  id: number;
  cliente_id: number;
  software_id: number;
  conta_bancaria_id: number | null;
  descricao: string;
  valor: number;
  periodicidade: string;
  dia_vencimento: number;
  data_inicio: string;
  data_fim: string | null;
  status: 'ATIVA' | 'SUSPENSA' | 'CANCELADA';
  ultima_geracao: string | null;
  observacoes: string | null;
  cliente_nome?: string;
  software_nome?: string;
}
interface Cliente { id: number; nome: string; nome_fantasia: string | null; }
interface Software { id: number; nome: string; }
interface ContaBancaria { id: number; nome: string; }

const periodos: Record<string, string> = {
  MENSAL: 'Mensal', BIMESTRAL: 'Bimestral', TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral', ANUAL: 'Anual'
};

const emptyForm = {
  cliente_id: '',
  software_id: '',
  conta_bancaria_id: '',
  descricao: '',
  valor: '',
  periodicidade: 'MENSAL',
  dia_vencimento: '10',
  data_inicio: new Date().toISOString().split('T')[0],
  data_fim: '',
  observacoes: '',
};

function getDiasAteVencimento(diaVencimento: number): number {
  const hoje = new Date();
  const proximo = new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimento);
  if (proximo < hoje) proximo.setMonth(proximo.getMonth() + 1);
  return Math.ceil((proximo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function getProximaDataVencimento(diaVencimento: number): Date {
  const hoje = new Date();
  const proximo = new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimento);
  if (proximo < hoje) proximo.setMonth(proximo.getMonth() + 1);
  return proximo;
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function LicencasPage() {
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [softwares, setSoftwares] = useState<Software[]>([]);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLicenca, setEditingLicenca] = useState<Licenca | null>(null);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [gerarId, setGerarId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vencimentoFilter, setVencimentoFilter] = useState<'TODAS' | 'PERTO_VENCER' | 'VENCIDAS'>('TODAS');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const licRes = await fetchWithAuth('/api/licencas');
      if (licRes.ok) setLicencas((await licRes.json()).licencas || []);

      const cliRes = await fetchWithAuth('/api/clientes');
      if (cliRes.ok) setClientes((await cliRes.json()).clientes || []);

      const swRes = await fetchWithAuth('/api/softwares');
      if (swRes.ok) setSoftwares((await swRes.json()).softwares || []);

      const cbRes = await fetchWithAuth('/api/contas-bancarias');
      if (cbRes.ok) setContas((await cbRes.json()).contas || []);
    } catch (error) {
      console.error('Erro ao carregar dados de licenças:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingLicenca;
    const payload = {
      cliente_id: Number(formData.cliente_id),
      software_id: Number(formData.software_id),
      conta_bancaria_id: formData.conta_bancaria_id ? Number(formData.conta_bancaria_id) : null,
      descricao: formData.descricao,
      valor: Number(formData.valor),
      periodicidade: formData.periodicidade,
      dia_vencimento: Number(formData.dia_vencimento),
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim || null,
      observacoes: formData.observacoes || null,
    };
    const url = isEdit ? `/api/licencas/${editingLicenca.id}` : '/api/licencas';
    try {
      const res = await fetchWithAuth(url, { method: isEdit ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      if (res.ok) {
        setDialogOpen(false);
        setEditingLicenca(null);
        setFormData(emptyForm);
        loadAll();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Erro ao salvar licença.');
      }
    } catch (error) {
      console.error('Erro ao salvar licença:', error);
      alert('Ocorreu um erro ao salvar a licença.');
    }
  };

  const handleEdit = (l: Licenca) => {
    setEditingLicenca(l);
    setFormData({
      cliente_id: String(l.cliente_id),
      software_id: String(l.software_id),
      conta_bancaria_id: l.conta_bancaria_id ? String(l.conta_bancaria_id) : '',
      descricao: l.descricao,
      valor: String(l.valor),
      periodicidade: l.periodicidade,
      dia_vencimento: String(l.dia_vencimento),
      data_inicio: l.data_inicio ? l.data_inicio.split('T')[0] : '',
      data_fim: l.data_fim ? l.data_fim.split('T')[0] : '',
      observacoes: l.observacoes || '',
    });
    setDialogOpen(true);
  };

  const handleCancelar = async () => {
    if (!cancelId) return;
    await fetchWithAuth(`/api/licencas/${cancelId}`, { method: 'DELETE' });
    setCancelId(null);
    loadAll();
  };

  const handleGerarCobranca = async () => {
    if (!gerarId) return;
    const res = await fetchWithAuth(`/api/licencas/${gerarId}/gerar-cobranca`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setSuccessMsg(data.message || 'Cobrança gerada com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
      loadAll();
    }
    setGerarId(null);
  };

  const ativas = licencas.filter(l => l.status === 'ATIVA');
  const suspensas = licencas.filter(l => l.status === 'SUSPENSA');
  const canceladas = licencas.filter(l => l.status === 'CANCELADA');
  const aVencer7 = ativas.filter(l => getDiasAteVencimento(l.dia_vencimento) <= 7);
  const aVencer30 = ativas.filter(l => getDiasAteVencimento(l.dia_vencimento) <= 30);
  const valorRecorrente = ativas.reduce((acc, l) => {
    const divMap: Record<string, number> = { MENSAL: 1, BIMESTRAL: 2, TRIMESTRAL: 3, SEMESTRAL: 6, ANUAL: 12 };
    return acc + (l.valor / (divMap[l.periodicidade] || 1));
  }, 0);

  // Filtragem dinâmica de licenças
  const filteredLicencas = licencas.filter(l => {
    const matchesSearch = 
      l.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.cliente_nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.software_nome || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const proxVenc = getProximaDataVencimento(l.dia_vencimento);
    const proxVencStr = proxVenc.toISOString().split('T')[0];

    if (startDate && endDate) {
      const nextPaymentInPeriod = proxVencStr >= startDate && proxVencStr <= endDate;
      const expirationInPeriod = l.data_fim ? (l.data_fim >= startDate && l.data_fim <= endDate) : false;
      if (!nextPaymentInPeriod && !expirationInPeriod) return false;
    } else if (startDate) {
      const nextPaymentInPeriod = proxVencStr >= startDate;
      const expirationInPeriod = l.data_fim ? l.data_fim >= startDate : true;
      if (!nextPaymentInPeriod && !expirationInPeriod) return false;
    } else if (endDate) {
      const nextPaymentInPeriod = proxVencStr <= endDate;
      const expirationInPeriod = l.data_fim ? l.data_fim <= endDate : false;
      if (!nextPaymentInPeriod && !expirationInPeriod) return false;
    }

    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    const isExpired = (l.data_fim && l.data_fim < hojeStr) || l.status === 'CANCELADA';
    const diasAteVenc = getDiasAteVencimento(l.dia_vencimento);
    const isPertoVencer = l.status === 'ATIVA' && (diasAteVenc <= 30 || (l.data_fim && getDiasAteVencimento(new Date(l.data_fim).getDate()) <= 30));

    if (vencimentoFilter === 'PERTO_VENCER' && !isPertoVencer) return false;
    if (vencimentoFilter === 'VENCIDAS' && !isExpired) return false;

    return true;
  });

  const filteredAtivas = filteredLicencas.filter(l => l.status === 'ATIVA');
  const filteredSuspensas = filteredLicencas.filter(l => l.status === 'SUSPENSA');
  const filteredCanceladas = filteredLicencas.filter(l => l.status === 'CANCELADA');

  const LicencaCard = ({ licenca }: { licenca: Licenca }) => {
    const dias = getDiasAteVencimento(licenca.dia_vencimento);
    const urgente = dias <= 7;
    const atencao = dias <= 30 && !urgente;
    return (
      <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            urgente ? 'bg-red-500/10' : atencao ? 'bg-amber-500/10' : 'bg-cyan-500/10'
          }`}>
            <Key className={`w-5 h-5 ${urgente ? 'text-red-600' : atencao ? 'text-amber-600' : 'text-cyan-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold truncate">{licenca.cliente_nome}</p>
              <span className="text-muted-foreground">–</span>
              <p className="text-sm text-muted-foreground">{licenca.software_nome}</p>
            </div>
            <p className="text-xs text-muted-foreground truncate">{licenca.descricao}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px]">{periodos[licenca.periodicidade]}</Badge>
              {licenca.status === 'ATIVA' && (
                <Badge variant="outline" className={`text-[10px] ${urgente ? 'border-red-300 text-red-600' : atencao ? 'border-amber-300 text-amber-600' : 'border-muted text-muted-foreground'}`}>
                  Vence em {dias} dias (dia {licenca.dia_vencimento})
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <p className="font-bold text-base">{formatCurrency(licenca.valor)}</p>
          {licenca.status === 'ATIVA' && (
            <Button
              variant="outline"
              size="sm"
              className="border-cyan-500/30 text-cyan-600 hover:bg-cyan-50"
              onClick={() => setGerarId(licenca.id)}
            >
              <ReceiptText className="w-3.5 h-3.5 mr-1" />
              Gerar Cobrança
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEdit(licenca)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          {licenca.status === 'ATIVA' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setCancelId(licenca.id)}>
              <XCircle className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Licenças</h1>
        <p className="text-muted-foreground">Acompanhamento de licenças e cobranças recorrentes</p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="font-medium">{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{ativas.length}</p>
              <p className="text-xs text-muted-foreground">Licenças Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{aVencer7.length}</p>
              <p className="text-xs text-muted-foreground">Vencem em 7 dias</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{aVencer30.length}</p>
              <p className="text-xs text-muted-foreground">Vencem em 30 dias</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{formatCurrency(valorRecorrente)}</p>
              <p className="text-xs text-muted-foreground">Recorrência Mensal</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, software ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full h-9 text-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filtro por Situação de Vencimento */}
          <div className="flex items-center gap-2">
            <Label htmlFor="filter-venc" className="text-xs font-medium text-muted-foreground whitespace-nowrap">Vencimento:</Label>
            <Select value={vencimentoFilter} onValueChange={(v: any) => setVencimentoFilter(v)}>
              <SelectTrigger id="filter-venc" className="w-[150px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas</SelectItem>
                <SelectItem value="PERTO_VENCER">Perto de Vencer</SelectItem>
                <SelectItem value="VENCIDAS">Vencidas / Expiradas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Filtro de Período */}
          <div className="flex items-center gap-2">
            <Label htmlFor="filter-start-date" className="text-xs font-medium text-muted-foreground whitespace-nowrap">Início:</Label>
            <Input
              id="filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[130px] h-9 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="filter-end-date" className="text-xs font-medium text-muted-foreground whitespace-nowrap">Fim:</Label>
            <Input
              id="filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[130px] h-9 text-xs"
            />
          </div>
          {(searchTerm || startDate || endDate || vencimentoFilter !== 'TODAS') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStartDate('');
                setEndDate('');
                setVencimentoFilter('TODAS');
              }}
              className="text-xs h-9"
            >
              Limpar Filtros
            </Button>
          )}
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { setEditingLicenca(null); setFormData(emptyForm); }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white h-9 text-xs">
                <Plus className="w-4 h-4 mr-2" /> Nova Licença
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingLicenca ? 'Editar Licença' : 'Nova Licença'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente *</Label>
                    <Select value={formData.cliente_id || undefined} onValueChange={(v) => setFormData({ ...formData, cliente_id: v })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                      <SelectContent>
                        {clientes.filter(c => c).map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.nome_fantasia || c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Software *</Label>
                    <Select value={formData.software_id || undefined} onValueChange={(v) => setFormData({ ...formData, software_id: v })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Selecionar software" /></SelectTrigger>
                      <SelectContent>
                        {softwares.map(s => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Input id="descricao" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} required placeholder="Ex: Licença Pro – 5 usuários" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor (R$) *</Label>
                    <Input id="valor" type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData({ ...formData, valor: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Periodicidade *</Label>
                    <Select value={formData.periodicidade || undefined} onValueChange={(v) => setFormData({ ...formData, periodicidade: v })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(periodos).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dia_vencimento">Dia de Vencimento *</Label>
                    <Input id="dia_vencimento" type="number" min="1" max="28" value={formData.dia_vencimento} onChange={(e) => setFormData({ ...formData, dia_vencimento: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Conta Bancária</Label>
                    <Select value={formData.conta_bancaria_id || 'none'} onValueChange={(v) => setFormData({ ...formData, conta_bancaria_id: v === 'none' ? '' : v })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Sem conta vinculada" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem conta vinculada</SelectItem>
                        {contas.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_inicio">Data de Início *</Label>
                    <Input id="data_inicio" type="date" value={formData.data_inicio} onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_fim">Data de Fim</Label>
                    <Input id="data_fim" type="date" value={formData.data_fim} onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Input id="observacoes" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                    {editingLicenca ? 'Salvar Alterações' : 'Cadastrar Licença'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando licenças...</div>
      ) : (
        <Tabs defaultValue="ativas">
          <TabsList>
            <TabsTrigger value="ativas">Ativas <Badge className="ml-2 bg-cyan-500/20 text-cyan-700">{filteredAtivas.length}</Badge></TabsTrigger>
            <TabsTrigger value="suspensas">Suspensas <Badge className="ml-2 bg-amber-500/20 text-amber-700">{filteredSuspensas.length}</Badge></TabsTrigger>
            <TabsTrigger value="canceladas">Canceladas <Badge className="ml-2 bg-red-500/20 text-red-700">{filteredCanceladas.length}</Badge></TabsTrigger>
          </TabsList>
          <TabsContent value="ativas">
            <Card>
              <CardContent className="p-0">
                {filteredAtivas.length === 0 ? (
                  <div className="text-center py-16">
                    <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma licença ativa encontrada</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredAtivas.map(l => <LicencaCard key={l.id} licenca={l} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="suspensas">
            <Card>
              <CardContent className="p-0">
                {filteredSuspensas.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">Nenhuma licença suspensa encontrada</div>
                ) : (
                  <div className="divide-y">
                    {filteredSuspensas.map(l => <LicencaCard key={l.id} licenca={l} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="canceladas">
            <Card>
              <CardContent className="p-0">
                {filteredCanceladas.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">Nenhuma licença cancelada encontrada</div>
                ) : (
                  <div className="divide-y">
                    {filteredCanceladas.map(l => <LicencaCard key={l.id} licenca={l} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog gerar cobrança */}
      <AlertDialog open={!!gerarId} onOpenChange={() => setGerarId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gerar Cobrança</AlertDialogTitle>
            <AlertDialogDescription>
              Será criada uma nova entrada em <strong>Contas a Receber</strong> com base nessa licença.
              O vencimento será calculado automaticamente para o próximo período.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGerarCobranca} className="bg-cyan-600">
              Gerar Cobrança
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog cancelar */}
      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Licença?</AlertDialogTitle>
            <AlertDialogDescription>A licença será marcada como cancelada. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelar} className="bg-red-600">Cancelar Licença</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
