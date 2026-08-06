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
import { Plus, Pencil, Trash2, Landmark, PiggyBank, LineChart, Coins, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/auth/AuthContext';

interface ContaBancaria {
  id: number;
  nome: string;
  tipo: 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO' | 'DINHEIRO' | 'OUTRO';
  saldo_inicial: number;
  saldo_atual: number;
}

const tiposConta = [
  { value: 'CORRENTE', label: 'Conta Corrente' },
  { value: 'POUPANCA', label: 'Poupança' },
  { value: 'INVESTIMENTO', label: 'Investimentos' },
  { value: 'DINHEIRO', label: 'Dinheiro (Espécie)' },
  { value: 'OUTRO', label: 'Outro' },
];

export default function ContasBancariasPage() {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaBancaria | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'CORRENTE',
    saldo_inicial: '',
  });

  const loadContas = async () => {
    try {
      const response = await fetchWithAuth('/api/contas-bancarias');
      if (response.ok) {
        const data = await response.json();
        setContas(data.contas);
      }
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEdit = !!editingConta;
    const url = isEdit ? `/api/contas-bancarias/${editingConta.id}` : '/api/contas-bancarias';
    const method = isEdit ? 'PATCH' : 'POST';

    const payload = {
      nome: formData.nome,
      tipo: formData.tipo,
      saldo_inicial: parseFloat(formData.saldo_inicial || '0'),
    };

    try {
      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setDialogOpen(false);
        setEditingConta(null);
        setFormData({ nome: '', tipo: 'CORRENTE', saldo_inicial: '' });
        loadContas();
      }
    } catch (error) {
      console.error('Erro ao salvar conta bancária:', error);
    }
  };

  const handleEdit = (conta: ContaBancaria) => {
    setEditingConta(conta);
    setFormData({
      nome: conta.nome,
      tipo: conta.tipo,
      saldo_inicial: conta.saldo_inicial.toString(),
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        const response = await fetchWithAuth(`/api/contas-bancarias/${deleteId}`, { method: 'DELETE' });
        if (response.ok) {
          setDeleteId(null);
          loadContas();
        }
      } catch (error) {
        console.error('Erro ao excluir conta bancária:', error);
      }
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'CORRENTE':
        return <Landmark className="h-5 w-5 text-blue-500" />;
      case 'POUPANCA':
        return <PiggyBank className="h-5 w-5 text-emerald-500" />;
      case 'INVESTIMENTO':
        return <LineChart className="h-5 w-5 text-purple-500" />;
      case 'DINHEIRO':
        return <Coins className="h-5 w-5 text-amber-500" />;
      default:
        return <Wallet className="h-5 w-5 text-cyan-500" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    return tiposConta.find(t => t.value === tipo)?.label || tipo;
  };

  const totalPatrimonio = contas.reduce((total, c) => total + c.saldo_atual, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas Bancárias</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas carteiras, contas correntes e acompanhe seus saldos
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingConta(null);
            setFormData({ nome: '', tipo: 'CORRENTE', saldo_inicial: '' });
            setDialogOpen(true);
          }}
          className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Adicionar Conta
        </Button>
      </div>

      {/* Card de Resumo de Patrimônio */}
      <Card className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-transparent border border-cyan-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Patrimônio Líquido Total
              </p>
              <h2 className={`text-4xl font-extrabold mt-1 ${totalPatrimonio >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(totalPatrimonio)}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <Wallet className="h-6 w-6 text-cyan-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Contas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contas.map((conta) => (
          <Card key={conta.id} className="relative overflow-hidden group hover:border-cyan-500/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted group-hover:bg-cyan-500/10 transition-colors">
                  {getIcon(conta.tipo)}
                </div>
                <div>
                  <CardTitle className="text-base font-bold">{conta.nome}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{getTipoLabel(conta.tipo)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => handleEdit(conta)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-red-600"
                  onClick={() => setDeleteId(conta.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-muted-foreground">Saldo Atual:</span>
                  <span className={`text-2xl font-bold ${conta.saldo_atual >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(conta.saldo_atual)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-1 border-t border-muted">
                  <span>Saldo Inicial:</span>
                  <span>{formatCurrency(conta.saldo_inicial)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
          <Wallet className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-lg">Nenhuma conta cadastrada</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
            Cadastre suas contas correntes ou carteiras físicas para começar a gerenciar seus saldos por banco.
          </p>
        </div>
      )}

      {/* Modal Dialog Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingConta ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Conta / Banco</Label>
              <Input
                id="nome"
                placeholder="Ex: Itaú Corrente, Carteira Física"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Conta</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposConta.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="saldo_inicial">Saldo Inicial (R$)</Label>
                <Input
                  id="saldo_inicial"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.saldo_inicial}
                  onChange={(e) => setFormData({ ...formData, saldo_inicial: e.target.value })}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                {editingConta ? 'Salvar Alterações' : 'Criar Conta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso fará o arquivamento desta conta bancária. As transações vinculadas a ela não serão perdidas, mas a conta não estará mais ativa para novas transações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
