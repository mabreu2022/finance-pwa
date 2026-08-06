'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { X, Send, Plus, Users, Hash, MessageCircle, Trash2, AtSign, ChevronLeft, Search, Smile } from 'lucide-react';

interface Grupo {
  id: number;
  nome: string;
  tipo: string;
  nao_lidas: number;
  ultima_mensagem: string | null;
  ultima_mensagem_hora: string | null;
}

interface Mensagem {
  id: number;
  usuario_id: number;
  usuario_nome: string;
  conteudo: string;
  mencoes: string | null;
  data_envio: string;
}

interface Usuario {
  id: number;
  nome: string;
  perfil: string;
}

const EMOJIS = ['😊', '👍', '❤️', '😂', '🎉', '🔥', '✅', '⚠️', '💡', '📌', '🚀', '💰'];

function formatHora(dateStr: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString('pt-BR', { weekday: 'short' });
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch { return ''; }
}

function tipoIcon(tipo: string) {
  if (tipo === 'PRIVADO') return <AtSign size={14} />;
  if (tipo === 'PROJETO') return <Hash size={14} />;
  return <Hash size={14} />;
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function getAvatarColor(nome: string) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
  let hash = 0;
  for (const c of nome) hash = c.charCodeAt(0) + (hash << 5) - hash;
  return colors[Math.abs(hash) % colors.length];
}

// Renderiza texto com @menções destacadas
function renderMensagem(texto: string) {
  const parts = texto.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} style={{ color: '#a78bfa', fontWeight: 600 }}>{part}</span>
      : <span key={i}>{part}</span>
  );
}

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}

export default function ChatDrawer({ open, onClose, onUnreadChange }: ChatDrawerProps) {
  const { user, token } = useAuth();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoAtivo, setGrupoAtivo] = useState<Grupo | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showNovo, setShowNovo] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoTipo, setNovoTipo] = useState('PROJETO');
  const [novosMembros, setNovosMembros] = useState<number[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<Usuario[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const headers = useCallback(() => ({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }), [token]);

  // Carregar grupos
  const loadGrupos = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch('/api/chat/grupos', { headers: headers() });
      const data = await r.json();
      if (data.grupos) {
        setGrupos(data.grupos);
        const total = data.grupos.reduce((s: number, g: Grupo) => s + (g.nao_lidas || 0), 0);
        onUnreadChange?.(total);
      }
    } catch {}
  }, [token, headers, onUnreadChange]);

  // Carregar usuários para @menção e criar grupo
  useEffect(() => {
    if (!token) return;
    fetch('/api/configuracoes/usuarios', { headers: headers() })
      .then(r => r.json())
      .then(d => { if (d.usuarios) setUsuarios(d.usuarios); })
      .catch(() => {});
  }, [token, headers]);

  // Polling de grupos
  useEffect(() => {
    if (!open) return;
    loadGrupos();
    pollRef.current = setInterval(loadGrupos, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [open, loadGrupos]);

  // Carregar mensagens do grupo ativo
  const loadMensagens = useCallback(async (grupoId: number) => {
    if (!token) return;
    try {
      const r = await fetch(`/api/chat/grupos/${grupoId}/mensagens`, { headers: headers() });
      const data = await r.json();
      if (data.mensagens) setMensagens(data.mensagens);
    } catch {}
  }, [token, headers]);

  // Polling de mensagens
  useEffect(() => {
    if (!grupoAtivo) return;
    loadMensagens(grupoAtivo.id);
    const interval = setInterval(() => loadMensagens(grupoAtivo.id), 3000);
    return () => clearInterval(interval);
  }, [grupoAtivo, loadMensagens]);

  // Scroll ao fundo quando novas msgs chegam
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Selecionar grupo
  const selecionarGrupo = async (g: Grupo) => {
    setGrupoAtivo(g);
    setMensagens([]);
    await loadMensagens(g.id);
    // Marcar como lido
    try {
      await fetch('/api/chat/marcar-lido', { method: 'POST', headers: headers(), body: JSON.stringify({ grupoId: g.id }) });
      await loadGrupos();
    } catch {}
  };

  // Enviar mensagem
  const enviar = async () => {
    if (!texto.trim() || !grupoAtivo) return;
    // Extrair menções
    const mencoes = (texto.match(/@(\w+)/g) || []).join(',');
    try {
      await fetch(`/api/chat/grupos/${grupoAtivo.id}/mensagens`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ conteudo: texto.trim(), mencoes })
      });
      setTexto('');
      await loadMensagens(grupoAtivo.id);
      await loadGrupos();
    } catch {}
  };

  // Deletar mensagem
  const deletar = async (msgId: number) => {
    if (!grupoAtivo) return;
    try {
      await fetch(`/api/chat/grupos/${grupoAtivo.id}/mensagens?msgId=${msgId}`, { method: 'DELETE', headers: headers() });
      await loadMensagens(grupoAtivo.id);
    } catch {}
  };

  // Criar grupo
  const criarGrupo = async () => {
    if (!novoNome.trim()) return;
    try {
      await fetch('/api/chat/grupos', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ nome: novoNome, tipo: novoTipo, membroIds: novosMembros })
      });
      setNovoNome(''); setNovoTipo('PROJETO'); setNovosMembros([]); setShowNovo(false);
      await loadGrupos();
    } catch {}
  };

  // @menção autocomplete
  const handleTextoChange = (v: string) => {
    setTexto(v);
    const match = v.match(/@(\w*)$/);
    if (match) {
      const q = match[1].toLowerCase();
      const sugs = usuarios.filter(u => u.nome.toLowerCase().includes(q) && u.id !== user?.id);
      setMentionSuggestions(sugs);
      setShowMentions(sugs.length > 0);
    } else {
      setShowMentions(false);
    }
  };

  const inserirMencao = (nome: string) => {
    const novo = texto.replace(/@(\w*)$/, `@${nome.split(' ')[0]} `);
    setTexto(novo);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const gruposFiltrados = grupos.filter(g => g.nome.toLowerCase().includes(filtro.toLowerCase()));
  const totalNaoLidas = grupos.reduce((s, g) => s + (g.nao_lidas || 0), 0);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: open ? 420 : 0,
        background: 'linear-gradient(180deg, #0f0f1a 0%, #12121f 100%)',
        borderLeft: '1px solid rgba(139,92,246,0.2)',
        boxShadow: open ? '-8px 0 40px rgba(139,92,246,0.15)' : 'none',
        zIndex: 1000,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {open && (
          <>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(139,92,246,0.08)',
              display: 'flex', alignItems: 'center', gap: 12,
              flexShrink: 0,
            }}>
              {grupoAtivo ? (
                <>
                  <button onClick={() => setGrupoAtivo(null)} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 6, transition: 'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <ChevronLeft size={20} />
                  </button>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                    {tipoIcon(grupoAtivo.tipo)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{grupoAtivo.nome}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{grupoAtivo.tipo}</div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageCircle size={18} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>Chat Interno</div>
                    {totalNaoLidas > 0 && (
                      <div style={{ fontSize: 11, color: '#a78bfa' }}>{totalNaoLidas} mensagem{totalNaoLidas > 1 ? 'ns' : ''} não lida{totalNaoLidas > 1 ? 's' : ''}</div>
                    )}
                  </div>
                  <button onClick={() => setShowNovo(!showNovo)} title="Novo grupo"
                    style={{ background: showNovo ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', gap: 4, alignItems: 'center', fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }}>
                    <Plus size={14} /> Grupo
                  </button>
                </>
              )}
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex', transition: 'all 0.2s', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
                <X size={16} />
              </button>
            </div>

            {/* Formulário novo grupo */}
            {showNovo && !grupoAtivo && (
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(99,102,241,0.06)', flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Novo Grupo</div>
                <input
                  value={novoNome} onChange={e => setNovoNome(e.target.value)}
                  placeholder="Nome do grupo..." maxLength={80}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, marginBottom: 8, outline: 'none', boxSizing: 'border-box' }}
                />
                <select value={novoTipo} onChange={e => setNovoTipo(e.target.value)}
                  style={{ width: '100%', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}>
                  <option value="PROJETO">Projeto</option>
                  <option value="DEPARTAMENTO">Departamento</option>
                  <option value="PRIVADO">Privado</option>
                </select>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Membros:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {usuarios.filter(u => u.id !== user?.id).map(u => (
                    <button key={u.id} onClick={() => setNovosMembros(prev => prev.includes(u.id) ? prev.filter(x => x !== u.id) : [...prev, u.id])}
                      style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', border: novosMembros.includes(u.id) ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)', background: novosMembros.includes(u.id) ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.04)', color: novosMembros.includes(u.id) ? '#c4b5fd' : 'rgba(255,255,255,0.6)' }}>
                      {u.nome.split(' ')[0]}
                    </button>
                  ))}
                </div>
                <button onClick={criarGrupo}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 8, padding: '8px 0', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Criar Grupo
                </button>
              </div>
            )}

            {/* LISTA DE GRUPOS */}
            {!grupoAtivo && (
              <>
                {/* Busca */}
                <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    <input value={filtro} onChange={e => setFiltro(e.target.value)}
                      placeholder="Buscar grupos..."
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '7px 10px 7px 32px', color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                  {gruposFiltrados.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                      <MessageCircle size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                      <div>Nenhum grupo encontrado</div>
                    </div>
                  )}
                  {gruposFiltrados.map(g => (
                    <div key={g.id} onClick={() => selecionarGrupo(g)}
                      style={{ padding: '12px 20px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', borderRadius: 10, margin: '2px 8px', transition: 'background 0.15s', userSelect: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      {/* Avatar do grupo */}
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, color: '#fff' }}>
                        {g.tipo === 'PRIVADO' ? '🔒' : g.tipo === 'PROJETO' ? '📋' : g.nome[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{g.nome}</div>
                          {g.ultima_mensagem_hora && (
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{formatHora(g.ultima_mensagem_hora)}</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                            {g.ultima_mensagem || <span style={{ fontStyle: 'italic' }}>Nenhuma mensagem</span>}
                          </div>
                          {g.nao_lidas > 0 && (
                            <div style={{ background: '#8b5cf6', borderRadius: 20, padding: '2px 7px', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0, minWidth: 18, textAlign: 'center' }}>
                              {g.nao_lidas > 99 ? '99+' : g.nao_lidas}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ÁREA DE MENSAGENS */}
            {grupoAtivo && (
              <>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {mensagens.length === 0 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                      <MessageCircle size={40} style={{ opacity: 0.2, marginBottom: 10 }} />
                      <div>Nenhuma mensagem ainda</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Seja o primeiro a enviar!</div>
                    </div>
                  )}
                  {mensagens.map((m, idx) => {
                    const isMeu = m.usuario_id === user?.id;
                    const prevMsg = idx > 0 ? mensagens[idx - 1] : null;
                    const showAvatar = !prevMsg || prevMsg.usuario_id !== m.usuario_id;
                    const cor = getAvatarColor(m.usuario_nome);
                    const isMencionado = m.mencoes?.includes(`@${user?.nome?.split(' ')[0]}`);
                    return (
                      <div key={m.id} style={{ display: 'flex', flexDirection: isMeu ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end', marginTop: showAvatar ? 12 : 2, position: 'relative' }}
                        onMouseEnter={e => { const btn = e.currentTarget.querySelector('.del-btn') as HTMLElement; if (btn) btn.style.opacity = '1'; }}
                        onMouseLeave={e => { const btn = e.currentTarget.querySelector('.del-btn') as HTMLElement; if (btn) btn.style.opacity = '0'; }}>
                        {/* Avatar */}
                        {!isMeu && (
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0, opacity: showAvatar ? 1 : 0 }}>
                            {getInitials(m.usuario_nome)}
                          </div>
                        )}
                        <div style={{ maxWidth: '72%' }}>
                          {showAvatar && !isMeu && (
                            <div style={{ fontSize: 10, color: cor, fontWeight: 700, marginBottom: 3, paddingLeft: 4 }}>{m.usuario_nome}</div>
                          )}
                          <div style={{
                            background: isMeu
                              ? 'linear-gradient(135deg, #5b21b6, #6d28d9)'
                              : isMencionado
                                ? 'rgba(245,158,11,0.12)'
                                : 'rgba(255,255,255,0.05)',
                            border: isMencionado ? '1px solid rgba(245,158,11,0.3)' : isMeu ? 'none' : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: isMeu ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            padding: '8px 12px',
                            color: '#fff',
                            fontSize: 13,
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                            position: 'relative',
                          }}>
                            {renderMensagem(m.conteudo)}
                            <div style={{ fontSize: 10, color: isMeu ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: isMeu ? 'right' : 'left' }}>
                              {formatHora(m.data_envio)}
                            </div>
                          </div>
                        </div>
                        {/* Botão deletar */}
                        {isMeu && (
                          <button className="del-btn" onClick={() => deletar(m.id)}
                            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '3px 5px', cursor: 'pointer', color: '#ef4444', opacity: 0, transition: 'opacity 0.15s', display: 'flex', alignSelf: 'center', flexShrink: 0 }}>
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <div ref={msgEndRef} />
                </div>

                {/* Suggestions de @menção */}
                {showMentions && (
                  <div style={{ margin: '0 12px', background: 'rgba(30,27,75,0.98)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                    {mentionSuggestions.slice(0, 5).map(u => (
                      <div key={u.id} onClick={() => inserirMencao(u.nome)}
                        style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 13, color: '#c4b5fd', display: 'flex', gap: 8, alignItems: 'center', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.15)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: getAvatarColor(u.nome), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                          {getInitials(u.nome)}
                        </div>
                        <span style={{ fontWeight: 600 }}>@{u.nome.split(' ')[0]}</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{u.nome}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input de mensagem */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
                  {/* Emojis */}
                  {showEmoji && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, padding: 8, background: 'rgba(30,27,75,0.8)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                      {EMOJIS.map(e => (
                        <button key={e} onClick={() => { setTexto(t => t + e); setShowEmoji(false); }}
                          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 2, borderRadius: 6, transition: 'background 0.15s' }}
                          onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                          onMouseLeave={ev => (ev.currentTarget.style.background = 'none')}>
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <button onClick={() => setShowEmoji(!showEmoji)}
                      style={{ background: showEmoji ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', transition: 'all 0.2s', flexShrink: 0 }}>
                      <Smile size={16} />
                    </button>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <textarea
                        ref={inputRef}
                        value={texto}
                        onChange={e => handleTextoChange(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                        placeholder="Digite uma mensagem... (@nome para mencionar)"
                        rows={1}
                        style={{
                          width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', color: '#fff', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', lineHeight: 1.4, maxHeight: 100, overflow: 'auto', fontFamily: 'inherit'
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                      />
                    </div>
                    <button onClick={enviar} disabled={!texto.trim()}
                      style={{ background: texto.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 10, padding: '9px 12px', color: texto.trim() ? '#fff' : 'rgba(255,255,255,0.2)', cursor: texto.trim() ? 'pointer' : 'default', display: 'flex', transition: 'all 0.2s', flexShrink: 0, boxShadow: texto.trim() ? '0 2px 12px rgba(139,92,246,0.35)' : 'none' }}>
                      <Send size={16} />
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 6, paddingLeft: 4 }}>
                    Enter para enviar • Shift+Enter nova linha • @nome para mencionar
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
