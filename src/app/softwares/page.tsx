'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react';
import { fetchWithAuth } from '@/lib/auth/AuthContext';

interface Software {
  id: number;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  ativo: 'S' | 'N';
}

const emptyForm = { nome: '', descricao: '', categoria: '' };

export default function SoftwaresPage() {
  const [softwares, setSoftwares] = useState<Software[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState<Software | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadSoftwares = async () => {
    try {
      const response = await fetchWithAuth('/api/softwares');
      if (response.ok) {
        const data = await response.json();
        setSoftwares(data.softwares || []);
      }
    } catch (error) {
      console.error('Erro ao carregar softwares:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSoftwares(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingSoftware;
      const url = isEdit ? `/api/softwares/${editingSoftware.id}` : '/api/softwares';
      const method = isEdit ? 'PATCH' : 'POST';
      const response = await fetchWithAuth(url, { method, body: JSON.stringify(formData) });
      if (response.ok) {
        setDialogOpen(false);
        setEditingSoftware(null);
        setFormData(emptyForm);
        loadSoftwares();
      }
    } catch (error) {
      console.error('Erro ao salvar software:', error);
    }
  };

  const handleEdit = (sw: Software) => {
    setEditingSoftware(sw);
    setFormData({ nome: sw.nome, descricao: sw.descricao || '', categoria: sw.categoria || '' });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetchWithAuth(`/api/softwares/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    loadSoftwares();
  };

  const categorias = [...new Set(softwares.map(s => s.categoria).filter(Boolean))];
  const filtered = softwares.filter((s) =>
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.categoria || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const catColors: Record<string, string> = {
    ERP: 'bg-blue-500/10 text-blue-600',
    CRM: 'bg-violet-500/10 text-violet-600',
    Segurança: 'bg-red-500/10 text-red-600',
    Financeiro: 'bg-emerald-500/10 text-emerald-600',
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Softwares</h1>
        <p className="text-muted-foreground">Catálogo de softwares com licenças gerenciadas</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) { setEditingSoftware(null); setFormData(emptyForm); }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> Novo Software
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>{editingSoftware ? 'Editar Software' : 'Novo Software'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Software *</Label>
                <Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required placeholder="Ex: Microsoft 365, TOTVS, SAP..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Input id="categoria" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} placeholder="Ex: ERP, CRM, Antivírus, Financeiro..." list="categorias-list" />
                <datalist id="categorias-list">
                  {['ERP', 'CRM', 'Financeiro', 'Segurança', 'Comunicação', 'RH', 'Contabilidade', 'Outro'].map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input id="descricao" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Breve descrição do produto..." />
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                  {editingSoftware ? 'Salvar Alterações' : 'Cadastrar Software'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-3 text-center py-16">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum software cadastrado</p>
            </div>
          ) : (
            filtered.map((sw) => {
              const colorClass = catColors[sw.categoria || ''] || 'bg-cyan-500/10 text-cyan-600';
              return (
                <Card key={sw.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClass}`}>
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(sw)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteId(sw.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="font-bold text-base">{sw.nome}</p>
                    {sw.categoria && (
                      <Badge variant="outline" className={`text-[10px] mt-1 ${colorClass}`}>{sw.categoria}</Badge>
                    )}
                    {sw.descricao && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{sw.descricao}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar software?</AlertDialogTitle>
            <AlertDialogDescription>O software será desativado. As licenças associadas continuarão no sistema.</AlertDialogDescription>
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
