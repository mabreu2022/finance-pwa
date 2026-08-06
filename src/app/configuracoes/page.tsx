'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { fetchWithAuth } from '@/lib/auth/AuthContext';
import {
  Settings,
  Users,
  Image,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Upload,
  RefreshCw,
  Shield,
  ShoppingBag,
  BarChart2,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────
type Perfil = 'ADMIN' | 'VENDEDOR' | 'FINANCEIRO';
type Status = 'ATIVO' | 'INATIVO';

interface UsuarioForm {
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
  fone: string;
  comissao_percentual: string;
}

interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: string;
  perfil: Perfil;
  status: Status;
  fone: string | null;
  ultimo_acesso: string | null;
  data_cadastro: string;
  comissao_percentual: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PERFIL_INFO: Record<Perfil, { label: string; description: string; features: string[]; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  ADMIN: {
    label: 'Administrador',
    description: 'Acesso total e irrestrito a todas as áreas e configurações do sistema.',
    features: [
      'Visualizar Dashboard e Relatórios completos',
      'Lançar e liquidar Contas a Pagar/Receber',
      'Gerenciar Clientes, Softwares e Licenças',
      'Cadastrar novos usuários e gerenciar permissões',
      'Alterar a logo e identidade visual do sistema'
    ],
    icon: <Shield className="w-4 h-4" />,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
  },
  VENDEDOR: {
    label: 'Vendedor',
    description: 'Acesso exclusivo para visualização e cadastro de clientes.',
    features: [
      'Visualizar e cadastrar novos Clientes',
      'Sem acesso ao módulo financeiro (Contas, Dashboard, etc.)',
      'Sem acesso ao módulo de Licenças ou Softwares',
      'Sem acesso ao painel de Configurações'
    ],
    icon: <ShoppingBag className="w-4 h-4" />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  FINANCEIRO: {
    label: 'Financeiro',
    description: 'Acesso completo ao fluxo de caixa e movimentações financeiras.',
    features: [
      'Visualizar Dashboard e Relatórios de fluxo de caixa',
      'Lançar e liquidar Contas a Pagar e Contas a Receber',
      'Gerenciar Contas Bancárias e Agendamentos recorrentes',
      'Sem acesso ao cadastro de Clientes, Licenças ou Softwares',
      'Sem acesso ao painel de Configurações'
    ],
    icon: <BarChart2 className="w-4 h-4" />,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
};

const EMPTY_FORM: UsuarioForm = { nome: '', email: '', senha: '', perfil: 'FINANCEIRO', fone: '', comissao_percentual: '' };

// ─── Component ────────────────────────────────────────────────────────────────
export default function ConfiguracoesPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'usuarios' | 'aparencia'>('usuarios');

  // ── Usuários ──────────────────────────────────────────────────────────────
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UsuarioForm>(EMPTY_FORM);
  const [showSenha, setShowSenha] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // ── Logo ──────────────────────────────────────────────────────────────────
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [logoSuccess, setLogoSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Configurações Gerais ──────────────────────────────────────────────────
  const [comissaoPadrao, setComissaoPadrao] = useState<string>('5.00');
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState('');
  const [configError, setConfigError] = useState('');

  // Guard: somente ADMIN
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [user, router]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadUsuarios();
      loadLogo();
      loadConfigs();
    }
  }, [user]);

  async function loadConfigs() {
    try {
      const res = await fetchWithAuth('/api/configuracoes/geral');
      if (res.ok) {
        const data = await res.json();
        if (data.configs && data.configs.COMISSAO_PADRAO) {
          setComissaoPadrao(data.configs.COMISSAO_PADRAO);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar configurações gerais:', e);
    }
  }

  async function saveConfig() {
    setSavingConfig(true);
    setConfigError('');
    setConfigSuccess('');
    try {
      const res = await fetchWithAuth('/api/configuracoes/geral', {
        method: 'POST',
        body: JSON.stringify({
          chave: 'COMISSAO_PADRAO',
          valor: parseFloat(comissaoPadrao).toFixed(2)
        })
      });
      if (res.ok) {
        setConfigSuccess('Configurações salvas!');
        setTimeout(() => setConfigSuccess(''), 3000);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar configurações');
      }
    } catch (e: any) {
      setConfigError(e.message);
    } finally {
      setSavingConfig(false);
    }
  }

  // ── Usuários — funções ───────────────────────────────────────────────────
  async function loadUsuarios() {
    setLoadingUsuarios(true);
    try {
      const res = await fetchWithAuth('/api/configuracoes/usuarios');
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch {
      setUsuarios([]);
    } finally {
      setLoadingUsuarios(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setShowSenha(false);
    setUserError('');
    setModalOpen(true);
  }

  function openEdit(u: Usuario) {
    setEditingId(u.id);
    setFormData({
      nome: u.nome,
      email: u.email,
      senha: '',
      perfil: u.perfil,
      fone: u.fone || '',
      comissao_percentual: u.comissao_percentual !== null && u.comissao_percentual !== undefined ? u.comissao_percentual.toString() : ''
    });
    setShowSenha(false);
    setUserError('');
    setModalOpen(true);
  }

  async function saveUser() {
    if (!formData.nome || !formData.email || !formData.perfil) {
      setUserError('Preencha nome, e-mail e perfil.');
      return;
    }
    if (!editingId && !formData.senha) {
      setUserError('Senha obrigatória para novo usuário.');
      return;
    }
    setSavingUser(true);
    setUserError('');
    try {
      const body: any = {
        nome: formData.nome,
        email: formData.email,
        perfil: formData.perfil,
        fone: formData.fone || null,
        comissao_percentual: formData.perfil === 'VENDEDOR' && formData.comissao_percentual !== '' ? parseFloat(formData.comissao_percentual) : null
      };
      if (formData.senha) body.senha = formData.senha;

      let res;
      if (editingId) {
        res = await fetchWithAuth(`/api/configuracoes/usuarios/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } else {
        res = await fetchWithAuth('/api/configuracoes/usuarios', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar');

      setModalOpen(false);
      setUserSuccess(editingId ? 'Usuário atualizado!' : 'Usuário criado com sucesso!');
      setTimeout(() => setUserSuccess(''), 3000);
      await loadUsuarios();
    } catch (e: any) {
      setUserError(e.message);
    } finally {
      setSavingUser(false);
    }
  }

  async function deleteUser(id: number) {
    setDeletingId(id);
    try {
      const res = await fetchWithAuth(`/api/configuracoes/usuarios/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao inativar');
      setUserSuccess('Usuário inativado.');
      setTimeout(() => setUserSuccess(''), 3000);
      await loadUsuarios();
    } catch (e: any) {
      setUserError(e.message);
      setTimeout(() => setUserError(''), 4000);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  // ── Logo — funções ───────────────────────────────────────────────────────
  async function loadLogo() {
    try {
      const res = await fetch('/api/configuracoes/logo');
      const data = await res.json();
      setCurrentLogo(data.logoUrl || null);
    } catch { /* silently ignore */ }
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const url = URL.createObjectURL(file);
    setPreviewLogo(url);
    setLogoError('');
  }

  async function uploadLogo() {
    if (!logoFile) return;
    setUploadingLogo(true);
    setLogoError('');
    try {
      const fd = new FormData();
      fd.append('logo', logoFile);
      const res = await fetchWithAuth('/api/configuracoes/logo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentLogo(data.logoUrl + '?t=' + Date.now());
      setPreviewLogo(null);
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setLogoSuccess('Logo atualizada com sucesso!');
      setTimeout(() => setLogoSuccess(''), 3000);
      // Forçar atualização do sidebar via evento
      window.dispatchEvent(new CustomEvent('logo-updated', { detail: { url: data.logoUrl } }));
    } catch (e: any) {
      setLogoError(e.message);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function removeLogo() {
    try {
      const res = await fetchWithAuth('/api/configuracoes/logo', { method: 'DELETE' });
      if (res.ok) {
        setCurrentLogo(null);
        setPreviewLogo(null);
        setLogoFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setLogoSuccess('Logo removida. Usando padrão do sistema.');
        setTimeout(() => setLogoSuccess(''), 3000);
        window.dispatchEvent(new CustomEvent('logo-updated', { detail: { url: null } }));
      }
    } catch { /* ignore */ }
  }

  if (!user || user.role !== 'ADMIN') return null;

  const perfilInfo = editingId === null ? PERFIL_INFO : PERFIL_INFO;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie usuários e personalização do sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'usuarios'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          Usuários
        </button>
        <button
          onClick={() => setActiveTab('aparencia')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'aparencia'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Image className="w-4 h-4" />
          Aparência & Geral
        </button>
      </div>

      {/* ── Tab: Usuários ───────────────────────────────────────────────────── */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Perfis de Usuários</h2>
              <p className="text-sm text-muted-foreground">
                {usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''} cadastrado{usuarios.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadUsuarios}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button size="sm" onClick={openCreate} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0">
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
          </div>

          {/* Feedback */}
          {userSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm">
              <Check className="w-4 h-4 shrink-0" />
              {userSuccess}
            </div>
          )}
          {userError && !modalOpen && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {userError}
            </div>
          )}

          {/* Perfis Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(Object.entries(PERFIL_INFO) as [Perfil, typeof PERFIL_INFO[Perfil]][]).map(([key, info]) => (
              <div key={key} className={`p-5 rounded-xl border flex flex-col justify-between ${info.bg} ${info.border} shadow-sm`}>
                <div>
                  <div className={`flex items-center gap-2 font-bold text-sm mb-2 ${info.color}`}>
                    {info.icon}
                    {info.label}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 font-medium leading-relaxed">{info.description}</p>
                  <ul className="space-y-1.5 pl-1 mb-4">
                    {info.features.map((feature, i) => (
                      <li key={i} className="text-[11px] text-muted-foreground/80 flex items-start gap-1.5 leading-tight">
                        <span className="text-cyan-500 font-bold">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto text-xs font-semibold text-muted-foreground border-t border-border/25 pt-3.5 flex items-center justify-between">
                  <span>Usuários cadastrados:</span>
                  <span className={`${info.color} bg-background dark:bg-card px-2.5 py-0.5 rounded-full border border-border/40 text-[11px] font-bold`}>
                    {usuarios.filter(u => u.perfil === key).length}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Tabela de usuários */}
          <div className="rounded-2xl border border-border overflow-hidden">
            {loadingUsuarios ? (
              <div className="flex items-center justify-center p-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
              </div>
            ) : usuarios.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Nenhum usuário cadastrado</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">E-mail</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Perfil</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u, idx) => {
                    const pInfo = PERFIL_INFO[u.perfil] || PERFIL_INFO.FINANCEIRO;
                    return (
                      <tr
                        key={u.id}
                        className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${pInfo.bg} ${pInfo.border} border flex items-center justify-center ${pInfo.color} font-bold text-xs shrink-0`}>
                              {u.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{u.nome}</div>
                              <div className="text-xs text-muted-foreground md:hidden">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${pInfo.bg} ${pInfo.border} ${pInfo.color}`}>
                            {pInfo.icon}
                            {pInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.status === 'ATIVO'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ATIVO' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(u)}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              title="Editar usuário"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {confirmDeleteId === u.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => deleteUser(u.id)}
                                  disabled={deletingId === u.id}
                                  className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors text-xs font-medium"
                                >
                                  {deletingId === u.id ? '...' : 'Confirmar'}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(u.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                                title="Inativar usuário"
                                disabled={u.id === user?.id}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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

      {/* ── Tab: Aparência & Geral ─────────────────────────────────────────── */}
      {activeTab === 'aparencia' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Logo */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Logomarca do Sistema</h2>
              <p className="text-sm text-muted-foreground">
                A logomarca aparece no topo do menu lateral. Formatos aceitos: PNG, JPG, WebP, SVG (máx. 2MB).
              </p>
            </div>

            {/* Preview da logo atual */}
            <div className="rounded-2xl border border-border p-6 space-y-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Logo Atual</p>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden">
                  {currentLogo ? (
                    <img
                      src={currentLogo}
                      alt="Logo atual"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Image className="w-8 h-8 opacity-30" />
                      <span className="text-[10px]">Padrão</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  {currentLogo ? (
                    <div className="space-y-2">
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">✓ Logo personalizada ativa</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removeLogo}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover e usar padrão
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Usando a logomarca padrão do Connect Finance.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Upload de nova logo */}
            <div className="rounded-2xl border border-border p-6 space-y-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Nova Logo</p>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-cyan-400 rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-cyan-50/20 dark:hover:bg-cyan-900/10 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoSelect}
                />
                <Upload className="w-8 h-8 text-muted-foreground/40 group-hover:text-cyan-500 mx-auto mb-2 transition-colors" />
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Clique para selecionar uma imagem
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, WebP ou SVG • Máximo 2MB</p>
              </div>

              {/* Preview da nova logo */}
              {previewLogo && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                  <div className="w-16 h-16 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                    <img src={previewLogo} alt="Preview" className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{logoFile?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {logoFile ? (logoFile.size / 1024).toFixed(1) + ' KB' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => { setPreviewLogo(null); setLogoFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {logoError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {logoError}
                </div>
              )}
              {logoSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm">
                  <Check className="w-4 h-4 shrink-0" />
                  {logoSuccess}
                </div>
              )}

              <Button
                onClick={uploadLogo}
                disabled={!logoFile || uploadingLogo}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 disabled:opacity-50"
              >
                {uploadingLogo ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Salvar Nova Logo
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Coluna Configurações Gerais */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Configurações Gerais</h2>
              <p className="text-sm text-muted-foreground">
                Parâmetros globais de funcionamento do sistema.
              </p>
            </div>

            <div className="rounded-2xl border border-border p-6 space-y-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Comissões de Vendas</p>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Comissão Padrão do Sistema (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={comissaoPadrao}
                    onChange={e => setComissaoPadrao(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm font-bold"
                    placeholder="5.00"
                  />
                  <span className="absolute right-4 top-3 text-xs text-muted-foreground font-semibold">%</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Taxa aplicada para vendedores que não possuem comissão individual configurada.
                </p>
              </div>

              {configError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {configError}
                </div>
              )}
              {configSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                  <Check className="w-4 h-4 shrink-0" />
                  {configSuccess}
                </div>
              )}

              <Button
                onClick={saveConfig}
                disabled={savingConfig}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
              >
                {savingConfig ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Criar/Editar Usuário ─────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold">
                {editingId ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {userError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {userError}
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Nome <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={e => setFormData(f => ({ ...f, nome: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                  placeholder="Nome completo"
                />
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-sm font-medium mb-1.5">E-mail <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                  placeholder="email@exemplo.com"
                />
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Senha {!editingId && <span className="text-red-500">*</span>}
                  {editingId && <span className="text-muted-foreground font-normal text-xs ml-1">(deixe em branco para manter)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    value={formData.senha}
                    onChange={e => setFormData(f => ({ ...f, senha: e.target.value }))}
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                    placeholder={editingId ? 'Nova senha (opcional)' : 'Mínimo 6 caracteres'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Telefone</label>
                <input
                  type="tel"
                  value={formData.fone}
                  onChange={e => setFormData(f => ({ ...f, fone: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                  placeholder="(11) 99999-9999"
                />
              </div>

              {/* Comissão Individual — somente se perfil for Vendedor */}
              {formData.perfil === 'VENDEDOR' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Comissão Individual (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.comissao_percentual}
                      onChange={e => setFormData(f => ({ ...f, comissao_percentual: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm font-bold animate-fade-in"
                      placeholder="Deixe em branco para usar a comissão padrão"
                    />
                    <span className="absolute right-4 top-3 text-xs text-muted-foreground font-semibold">%</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Se vazio, assume a comissão padrão do sistema (atualmente {comissaoPadrao}%).
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Perfil de Acesso <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.entries(PERFIL_INFO) as [Perfil, typeof PERFIL_INFO[Perfil]][]).map(([key, info]) => (
                    <label
                      key={key}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.perfil === key
                          ? `${info.bg} ${info.border}`
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="perfil"
                        value={key}
                        checked={formData.perfil === key}
                        onChange={() => setFormData(f => ({ ...f, perfil: key }))}
                        className="mt-1 accent-cyan-500 shrink-0"
                      />
                      <div className="flex-1">
                        <div className={`flex items-center gap-1.5 font-bold text-sm ${formData.perfil === key ? info.color : ''}`}>
                          {info.icon}
                          {info.label}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">{info.description}</p>
                        {formData.perfil === key && (
                          <ul className="mt-3 space-y-1.5 pl-1 border-t border-border/20 pt-2.5">
                            {info.features.map((feature, i) => (
                              <li key={i} className="text-[11px] text-muted-foreground/90 flex items-start gap-1.5 leading-tight">
                                <span className="text-cyan-500 font-bold">•</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
                onClick={saveUser}
                disabled={savingUser}
              >
                {savingUser ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {editingId ? 'Salvar' : 'Criar Usuário'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
