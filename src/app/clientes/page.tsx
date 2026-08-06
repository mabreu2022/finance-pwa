'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Pencil, Trash2, Users, Building2, User } from 'lucide-react';
import { fetchWithAuth } from '@/lib/auth/AuthContext';

interface Cliente {
  id: number;
  tipo: 'PF' | 'PJ';
  nome: string;
  nome_fantasia: string | null;
  cpf_cnpj: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  observacoes: string | null;
  ativo: 'S' | 'N';
}

const emptyForm = {
  tipo: 'PJ' as 'PF' | 'PJ',
  nome: '',
  nome_fantasia: '',
  cpf_cnpj: '',
  email: '',
  telefone: '',
  endereco: '',
  observacoes: '',
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadClientes = async () => {
    try {
      const response = await fetchWithAuth('/api/clientes');
      if (response.ok) {
        const data = await response.json();
        setClientes(data.clientes || []);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClientes(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingCliente;
      const url = isEdit ? `/api/clientes/${editingCliente.id}` : '/api/clientes';
      const method = isEdit ? 'PATCH' : 'POST';
      const response = await fetchWithAuth(url, { method, body: JSON.stringify(formData) });
      if (response.ok) {
        setDialogOpen(false);
        setEditingCliente(null);
        setFormData(emptyForm);
        loadClientes();
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  };

  const handleEdit = (c: Cliente) => {
    setEditingCliente(c);
    setFormData({
      tipo: c.tipo,
      nome: c.nome,
      nome_fantasia: c.nome_fantasia || '',
      cpf_cnpj: c.cpf_cnpj || '',
      email: c.email || '',
      telefone: c.telefone || '',
      endereco: c.endereco || '',
      observacoes: c.observacoes || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetchWithAuth(`/api/clientes/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    loadClientes();
  };

  const filteredClientes = clientes.filter((c) =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cpf_cnpj || '').includes(searchTerm) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPJ = clientes.filter(c => c.tipo === 'PJ').length;
  const totalPF = clientes.filter(c => c.tipo === 'PF').length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Gerencie seus clientes PF e PJ</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{clientes.length}</p>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPJ}</p>
              <p className="text-sm text-muted-foreground">Pessoas Jurídicas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <User className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPF}</p>
              <p className="text-sm text-muted-foreground">Pessoas Físicas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) { setEditingCliente(null); setFormData(emptyForm); }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Pessoa</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v as 'PF' | 'PJ' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PJ">Pessoa Jurídica (PJ)</SelectItem>
                    <SelectItem value="PF">Pessoa Física (PF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="nome">{formData.tipo === 'PJ' ? 'Razão Social' : 'Nome Completo'} *</Label>
                  <Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required />
                </div>
                {formData.tipo === 'PJ' && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                    <Input id="nome_fantasia" value={formData.nome_fantasia} onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj">{formData.tipo === 'PJ' ? 'CNPJ' : 'CPF'}</Label>
                  <Input id="cpf_cnpj" value={formData.cpf_cnpj} onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })} placeholder={formData.tipo === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                  <Input id="telefone" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input id="endereco" value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Input id="observacoes" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                  {editingCliente ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando clientes...</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {filteredClientes.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum cliente encontrado</p>
                <p className="text-sm text-muted-foreground">Adicione seu primeiro cliente clicando em "Novo Cliente"</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredClientes.map((cliente) => (
                  <div key={cliente.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cliente.tipo === 'PJ' ? 'bg-violet-500/10' : 'bg-emerald-500/10'}`}>
                        {cliente.tipo === 'PJ' ? <Building2 className="w-5 h-5 text-violet-600" /> : <User className="w-5 h-5 text-emerald-600" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{cliente.nome}</p>
                          <Badge variant="outline" className={`text-[10px] ${cliente.tipo === 'PJ' ? 'border-violet-300 text-violet-600' : 'border-emerald-300 text-emerald-600'}`}>
                            {cliente.tipo}
                          </Badge>
                          {cliente.ativo === 'N' && <Badge variant="outline" className="text-[10px] border-red-300 text-red-600">Inativo</Badge>}
                        </div>
                        {cliente.nome_fantasia && <p className="text-xs text-muted-foreground">{cliente.nome_fantasia}</p>}
                        <div className="flex items-center gap-3 mt-0.5">
                          {cliente.cpf_cnpj && <p className="text-xs text-muted-foreground">{cliente.cpf_cnpj}</p>}
                          {cliente.email && <p className="text-xs text-muted-foreground">{cliente.email}</p>}
                          {cliente.telefone && <p className="text-xs text-muted-foreground">{cliente.telefone}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cliente)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => setDeleteId(cliente.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar cliente?</AlertDialogTitle>
            <AlertDialogDescription>O cliente será desativado. As licenças vinculadas continuarão no sistema.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">Desativar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
