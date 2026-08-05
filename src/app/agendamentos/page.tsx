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
import { Plus, Search, Pencil, Trash2, Play, Repeat, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { fetchWithAuth } from '@/lib/auth/AuthContext';
import { Switch } from '@/components/ui/switch';

interface Agendamento {
  id: number;
  descricao: string;
  valor: number;
  dia_fixo: number;
  categoria: string;
  tipo: string;
  recorrente: string;
  ativo: string;
  ultima_execucao: string | null;
  proxima_execucao: string | null;
}

const categorias = [
  'Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação',
  'Lazer', 'Vestuário', 'Contas', 'Impostos', 'Outros',
];

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Agendamento | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    dia_fixo: '',
    categoria: '',
    tipo: 'PAGAR',
  });

  const loadAgendamentos = async () => {
    try {
      const response = await fetchWithAuth('/api/agendamentos');
      if (response.ok) {
        const data = await response.json();
        setAgendamentos(data.agendamentos);
      }
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgendamentos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      descricao: formData.descricao,
      valor: parseFloat(formData.valor),
      dia_fixo: parseInt(formData.dia_fixo),
      categoria: formData.categoria,
      tipo: formData.tipo,
      recorrente: isRecorrente,
    };

    try {
      const response = await fetchWithAuth('/api/agendamentos', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setDialogOpen(false);
        setEditingItem(null);
        setFormData({ descricao: '', valor: '', dia_fixo: '', categoria: '', tipo: 'PAGAR' });
        setIsRecorrente(false);
        loadAgendamentos();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const handleEdit = (item: Agendamento) => {
    setEditingItem(item);
    setFormData({
      descricao: item.descricao,
      valor: item.valor.toString(),
      dia_fixo: item.dia_fixo.toString(),
      categoria: item.categoria,
      tipo: item.tipo,
    });
    setIsRecorrente(item.recorrente === 'S');
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await fetchWithAuth(`/api/agendamentos/${deleteId}`, { method: 'DELETE' });
        setDeleteId(null);
        loadAgendamentos();
      } catch (error) {
        console.error('Erro ao excluir:', error);
      }
    }
  };

  const handleExecutar = async (item: Agendamento) => {
    try {
      const response = await fetchWithAuth(`/api/agendamentos/${item.id}`, { method: 'POST' });
      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        loadAgendamentos();
      }
    } catch (error) {
      console.error('Erro ao executar:', error);
    }
  };

  const handleToggleAtivo = async (item: Agendamento) => {
    try {
      await fetchWithAuth(`/api/agendamentos/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ativo: item.ativo === 'S' ? 'N' : 'S' }),
      });
      loadAgendamentos();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const filteredItems = agendamentos.filter(item =>
    item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ativos = filteredItems.filter(a => a.ativo === 'S');
  const inativos = filteredItems.filter(a => a.ativo === 'N');

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
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground mt-1">Gerencie pagamentos e recebimentos recorrentes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-violet-500 to-purple-600"
              onClick={() => {
                setEditingItem(null);
                setFormData({ descricao: '', valor: '', dia_fixo: '', categoria: '', tipo: 'PAGAR' });
                setIsRecorrente(false);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Agendamento' : 'Novo Agendamento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Aluguel, Salário"
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
                  <Label htmlFor="dia_fixo">Dia do Mês</Label>
                  <Input
                    id="dia_fixo"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dia_fixo}
                    onChange={(e) => setFormData({ ...formData, dia_fixo: e.target.value })}
                    placeholder="1-31"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAGAR">A Pagar</SelectItem>
                      <SelectItem value="RECEBER">A Receber</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-violet-500" />
                  <Label htmlFor="recorrente" className="cursor-pointer">
                    Conta Recorrente?
                  </Label>
                </div>
                <Switch
                  id="recorrente"
                  checked={isRecorrente}
                  onCheckedChange={setIsRecorrente}
                />
              </div>

              {!isRecorrente && (
                <p className="text-sm text-muted-foreground">
                  ⚠️ Se não for recorrente, uma conta será gerada automaticamente na data especificada.
                </p>
              )}
              
              <DialogFooter>
                <Button type="submit" className="bg-gradient-to-r from-violet-500 to-purple-600">
                  {editingItem ? 'Salvar' : 'Criar Agendamento'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar agendamentos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-6">
        {ativos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-500" />
                Agendamentos Ativos ({ativos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ativos.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold truncate">{item.descricao}</p>
                        {item.recorrente === 'S' && (
                          <Badge className="bg-violet-500/10 text-violet-600">
                            <Repeat className="w-3 h-3 mr-1" />
                            Recorrente
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.categoria} • Dia {item.dia_fixo} • {item.tipo === 'PAGAR' ? 'A Pagar' : 'A Receber'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <span className={`text-lg font-bold ${item.tipo === 'PAGAR' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(item.valor)}
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-violet-600"
                          onClick={() => handleExecutar(item)}
                          title="Gerar conta agora"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-amber-600"
                          onClick={() => handleToggleAtivo(item)}
                          title="Desativar"
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-600" 
                          onClick={() => setDeleteId(item.id)}
                        >
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

        {inativos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-slate-400" />
                Inativos ({inativos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inativos.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/50 opacity-60">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold truncate">{item.descricao}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.categoria} • Dia {item.dia_fixo}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <span className="text-lg font-bold">{formatCurrency(item.valor)}</span>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-emerald-600"
                          onClick={() => handleToggleAtivo(item)}
                          title="Ativar"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-600" 
                          onClick={() => setDeleteId(item.id)}
                        >
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

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este agendamento?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
