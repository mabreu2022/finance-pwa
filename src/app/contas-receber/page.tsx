'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Pencil, Trash2, CheckCircle2, AlertCircle, Calendar, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { fetchWithAuth } from '@/lib/auth/AuthContext';
import { DocumentViewer } from '@/components/document-viewer';

interface Conta {
  id: number;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  categoria: string;
  status: string;
  tipo: string;
  observacoes: string | null;
  conta_bancaria_id: number | null;
  arquivo_boleto: string | null;
  arquivo_comprovante: string | null;
}

interface ContaBancaria {
  id: number;
  nome: string;
  tipo: string;
}

const categorias = [
  'Salário',
  'Freelance',
  'Vendas',
  'Investimentos',
  'Aluguel',
  'Serviços',
  'Comissões',
  'Reembolsos',
  'Outros',
];

export default function ContasReceberPage() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<Conta | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    dataVencimento: '',
    categoria: '',
    observacoes: '',
    contaBancariaId: '',
    arquivoBoleto: '',
    arquivoComprovante: '',
  });
  const [uploadingBoleto, setUploadingBoleto] = useState(false);
  const [uploadingComprovante, setUploadingComprovante] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState('');

  const loadContas = async () => {
    try {
      const response = await fetchWithAuth('/api/contas?tipo=RECEBER');
      if (response.ok) {
        const data = await response.json();
        setContas(data.contas);
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContasBancarias = async () => {
    try {
      const response = await fetchWithAuth('/api/contas-bancarias');
      if (response.ok) {
        const data = await response.json();
        setContasBancarias(data.contas || []);
      }
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error);
    }
  };

  useEffect(() => {
    loadContas();
    loadContasBancarias();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'BOLETO' | 'COMPROVANTE') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (tipo === 'BOLETO') setUploadingBoleto(true);
    else setUploadingComprovante(true);

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('tipo', tipo);

    try {
      const response = await fetchWithAuth('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (response.ok) {
        const result = await response.json();
        if (tipo === 'BOLETO') {
          setFormData(prev => ({ ...prev, arquivoBoleto: result.url }));
        } else {
          setFormData(prev => ({ ...prev, arquivoComprovante: result.url }));
        }
      } else {
        const err = await response.json();
        alert(err.error || 'Erro ao enviar o arquivo.');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Falha ao enviar arquivo.');
    } finally {
      if (tipo === 'BOLETO') setUploadingBoleto(false);
      else setUploadingComprovante(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      descricao: formData.descricao,
      valor: parseFloat(formData.valor),
      data_vencimento: formData.dataVencimento,
      categoria: formData.categoria,
      tipo: 'RECEBER',
      observacoes: formData.observacoes,
      conta_bancaria_id: formData.contaBancariaId ? parseInt(formData.contaBancariaId) : null,
      arquivo_boleto: formData.arquivoBoleto || null,
      arquivo_comprovante: formData.arquivoComprovante || null,
    };

    try {
      const isEdit = !!editingConta;
      const url = isEdit ? `/api/contas/${editingConta.id}` : '/api/contas';
      const method = isEdit ? 'PATCH' : 'POST';

      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setDialogOpen(false);
        setEditingConta(null);
        setFormData({ 
          descricao: '', 
          valor: '', 
          dataVencimento: '', 
          categoria: '', 
          observacoes: '', 
          contaBancariaId: '',
          arquivoBoleto: '',
          arquivoComprovante: ''
        });
        loadContas();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Erro ao salvar recebimento.');
      }
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      alert('Ocorreu um erro de rede ao tentar salvar o recebimento.');
    }
  };

  const handleEdit = (conta: Conta) => {
    setEditingConta(conta);
    setFormData({
      descricao: conta.descricao,
      valor: conta.valor.toString(),
      dataVencimento: conta.data_vencimento,
      categoria: conta.categoria,
      observacoes: conta.observacoes || '',
      contaBancariaId: conta.conta_bancaria_id ? conta.conta_bancaria_id.toString() : '',
      arquivoBoleto: conta.arquivo_boleto || '',
      arquivoComprovante: conta.arquivo_comprovante || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await fetchWithAuth(`/api/contas/${deleteId}`, { method: 'DELETE' });
        setDeleteId(null);
        loadContas();
      } catch (error) {
        console.error('Erro ao excluir conta:', error);
      }
    }
  };

  const handleReceber = async (conta: Conta) => {
    try {
      await fetchWithAuth(`/api/contas/${conta.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: 'RECEBIDO',
          data_pagamento: new Date().toISOString().split('T')[0]
        }),
      });
      loadContas();
    } catch (error) {
      console.error('Erro ao receber conta:', error);
    }
  };

  const filteredContas = contas.filter(conta => {
    const matchesSearch = conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && conta.data_vencimento >= startDate;
    }
    if (endDate) {
      matchesDate = matchesDate && conta.data_vencimento <= endDate;
    }
    
    return matchesSearch && matchesDate;
  });

  const contasPendentes = filteredContas.filter(c => c.status === 'PENDENTE');
  const contasRecebidas = filteredContas.filter(c => c.status === 'RECEBIDO');

  const getStatusBadge = (conta: Conta) => {
    if (conta.status === 'RECEBIDO') {
      return <Badge className="bg-emerald-500/10 text-emerald-600">Recebido</Badge>;
    }
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(conta.data_vencimento);
    
    if (vencimento < hoje) {
      return <Badge className="bg-red-500/10 text-red-600">Atrasado</Badge>;
    }
    
    if (vencimento.toDateString() === hoje.toDateString()) {
      return <Badge className="bg-amber-500/10 text-amber-600">Hoje</Badge>;
    }
    
    return <Badge className="bg-blue-500/10 text-blue-600">Pendente</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas a Receber</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus recebimentos e entradas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
              onClick={() => {
                setEditingConta(null);
                setFormData({ descricao: '', valor: '', dataVencimento: '', categoria: '', observacoes: '', contaBancariaId: '' });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Recebimento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingConta ? 'Editar Recebimento' : 'Novo Recebimento'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Salário, Pagamento cliente"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataVencimento">Vencimento</Label>
                  <Input
                    id="dataVencimento"
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria || undefined}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contaBancariaId">Conta Bancária / Banco</Label>
                  <Select
                    value={formData.contaBancariaId || undefined}
                    onValueChange={(value) => setFormData({ ...formData, contaBancariaId: value })}
                  >
                    <SelectTrigger id="contaBancariaId">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contasBancarias.map((cb) => (
                        <SelectItem key={cb.id} value={cb.id.toString()}>{cb.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Input
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações opcionais"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="arquivoBoletoInput">Anexar Boleto / Doc</Label>
                  <Input
                    id="arquivoBoletoInput"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileChange(e, 'BOLETO')}
                    disabled={uploadingBoleto}
                    className="cursor-pointer text-xs"
                  />
                  {uploadingBoleto && <p className="text-[10px] text-cyan-600 animate-pulse">Enviando...</p>}
                  {formData.arquivoBoleto && (
                    <p className="text-[10px] text-emerald-600 truncate">
                      ✅ <a href={formData.arquivoBoleto} target="_blank" rel="noreferrer" className="underline hover:text-emerald-750">Ver Boleto</a>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arquivoComprovanteInput">Anexar Comprovante</Label>
                  <Input
                    id="arquivoComprovanteInput"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileChange(e, 'COMPROVANTE')}
                    disabled={uploadingComprovante}
                    className="cursor-pointer text-xs"
                  />
                  {uploadingComprovante && <p className="text-[10px] text-cyan-600 animate-pulse">Enviando...</p>}
                  {formData.arquivoComprovante && (
                    <p className="text-[10px] text-emerald-600 truncate">
                      ✅ <a href={formData.arquivoComprovante} target="_blank" rel="noreferrer" className="underline hover:text-emerald-750">Ver Comprovante</a>
                    </p>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                  {editingConta ? 'Salvar Alterações' : 'Criar Recebimento'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar recebimentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Label htmlFor="filter-start-date" className="text-xs font-medium text-muted-foreground whitespace-nowrap">Início:</Label>
            <Input
              id="filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[140px] h-9 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="filter-end-date" className="text-xs font-medium text-muted-foreground whitespace-nowrap">Fim:</Label>
            <Input
              id="filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[140px] h-9 text-xs"
            />
          </div>
          {(startDate || endDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs h-9"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {contasPendentes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Recebimentos Pendentes ({contasPendentes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contasPendentes.map((conta) => (
                  <div key={conta.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold truncate">{conta.descricao}</p>
                        {getStatusBadge(conta)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {conta.categoria} {conta.conta_bancaria_id && `• ${contasBancarias.find(b => b.id === conta.conta_bancaria_id)?.nome || 'Banco'}`} • Vencimento: {formatDate(conta.data_vencimento)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      {conta.arquivo_boleto && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-cyan-600 hover:text-cyan-750" 
                          title="Ver Boleto/Cobrança"
                          onClick={() => {
                            setViewerUrl(conta.arquivo_boleto);
                            setViewerTitle(`Documento: ${conta.descricao}`);
                          }}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      )}
                      <span className="text-lg font-bold text-emerald-600">
                        {formatCurrency(conta.valor)}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-emerald-600" onClick={() => handleReceber(conta)}>
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(conta)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600" onClick={() => setDeleteId(conta.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {contasRecebidas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Recebimentos Concluídos ({contasRecebidas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contasRecebidas.map((conta) => (
                  <div key={conta.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/50 opacity-75">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold truncate">{conta.descricao}</p>
                        {getStatusBadge(conta)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {conta.categoria} {conta.conta_bancaria_id && `• ${contasBancarias.find(b => b.id === conta.conta_bancaria_id)?.nome || 'Banco'}`} • Recebido em: {conta.data_pagamento ? formatDate(conta.data_pagamento) : '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      {conta.arquivo_boleto && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-cyan-600 hover:text-cyan-750" 
                          title="Ver Boleto/Cobrança"
                          onClick={() => {
                            setViewerUrl(conta.arquivo_boleto);
                            setViewerTitle(`Documento: ${conta.descricao}`);
                          }}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      )}
                      {conta.arquivo_comprovante && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-emerald-600 hover:text-emerald-750" 
                          title="Ver Comprovante de Pagamento"
                          onClick={() => {
                            setViewerUrl(conta.arquivo_comprovante);
                            setViewerTitle(`Comprovante: ${conta.descricao}`);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      <span className="text-lg font-bold text-emerald-600">
                        {formatCurrency(conta.valor)}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(conta)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600" onClick={() => setDeleteId(conta.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {filteredContas.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum recebimento encontrado</p>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este recebimento?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DocumentViewer 
        url={viewerUrl}
        isOpen={viewerUrl !== null}
        onClose={() => setViewerUrl(null)}
        title={viewerTitle}
      />
    </div>
  );
}
