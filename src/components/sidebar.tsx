'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Menu,
  Moon,
  Sun,
  Wallet,
  Calendar,
  LogOut,
  Landmark,
  Users,
  Package,
  Key,
  Settings,
  Briefcase,
  MessageCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// ─── Itens por perfil ────────────────────────────────────────────────────────
const financeiroItems = [
  { icon: LayoutDashboard, label: 'Dashboard',        href: '/' },
  { icon: ArrowDownCircle, label: 'Contas a Pagar',   href: '/contas-pagar' },
  { icon: ArrowUpCircle,   label: 'Contas a Receber', href: '/contas-receber' },
  { icon: Landmark,        label: 'Contas Bancárias', href: '/contas-bancarias' },
  { icon: Calendar,        label: 'Agendamentos',     href: '/agendamentos' },
  { icon: BarChart3,       label: 'Relatórios',       href: '/relatorios' },
];

const licencaItems = [
  { icon: Users,   label: 'Clientes',  href: '/clientes' },
  { icon: Package, label: 'Softwares', href: '/softwares' },
  { icon: Key,     label: 'Licenças',  href: '/licencas' },
];

// ─── Helper: logo com fallback ────────────────────────────────────────────────
function LogoSection() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Buscar logo atual
    fetch('/api/configuracoes/logo')
      .then(r => r.json())
      .then(d => setLogoUrl(d.logoUrl || null))
      .catch(() => {});

    // Ouvir updates em tempo real
    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      setLogoUrl(custom.detail?.url || null);
    };
    window.addEventListener('logo-updated', handler);
    return () => window.removeEventListener('logo-updated', handler);
  }, []);

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Logo"
        className="h-10 w-auto max-w-[140px] object-contain"
      />
    );
  }

  return (
    <>
      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
        <Wallet className="w-5 h-5 text-white" />
      </div>
      <div>
        <h1 className="font-bold text-lg leading-tight">Connect</h1>
        <p className="text-xs text-muted-foreground">Finance</p>
      </div>
    </>
  );
}

// ─── NavItem ─────────────────────────────────────────────────────────────────
function NavItem({ item, isActive, accentClass, dotClass, onClick }: {
  item: { icon: React.ElementType; label: string; href: string };
  isActive: boolean;
  accentClass: string;
  dotClass: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        isActive
          ? `${accentClass} border`
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? dotClass : ''}`} />
      <span className="font-medium">{item.label}</span>
      {isActive && <div className={`ml-auto w-1.5 h-1.5 rounded-full ${dotClass}`} />}
    </Link>
  );
}

// ─── Sidebar (desktop) ───────────────────────────────────────────────────────
export function Sidebar({ onChatClick, chatUnread = 0 }: { onChatClick?: () => void; chatUnread?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);

  const perfil = user?.perfil || (user?.role === 'ADMIN' ? 'ADMIN' : 'FINANCEIRO');
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDark(darkMode);
    if (darkMode) document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    localStorage.setItem('darkMode', String(newMode));
    document.documentElement.classList.toggle('dark', newMode);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Quais seções mostrar
  const showFinanceiro = perfil === 'ADMIN' || perfil === 'FINANCEIRO';
  const showClientes   = perfil === 'ADMIN' || perfil === 'VENDEDOR';
  const showLicencas   = perfil === 'ADMIN';

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <LogoSection />
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Financeiro */}
        {showFinanceiro && financeiroItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            accentClass="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20"
            dotClass="text-cyan-600 dark:text-cyan-400"
          />
        ))}

        {/* Clientes & Licenças */}
        {(showClientes || showLicencas) && (
          <>
            <div className="pt-3 pb-1">
              <p className="px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {showClientes && showLicencas ? 'Clientes & Licenças' : showClientes ? 'Clientes' : 'Licenças'}
              </p>
            </div>
            {showClientes && (
              <NavItem
                item={{ icon: Users, label: 'Clientes', href: '/clientes' }}
                isActive={pathname === '/clientes'}
                accentClass="bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                dotClass="text-violet-600 dark:text-violet-400"
              />
            )}
            {showLicencas && (
              <>
                <NavItem
                  item={{ icon: Package, label: 'Softwares', href: '/softwares' }}
                  isActive={pathname === '/softwares'}
                  accentClass="bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                  dotClass="text-violet-600 dark:text-violet-400"
                />
                <NavItem
                  item={{ icon: Key, label: 'Licenças', href: '/licencas' }}
                  isActive={pathname === '/licencas'}
                  accentClass="bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                  dotClass="text-violet-600 dark:text-violet-400"
                />
              </>
            )}
          </>
        )}

        {/* Comercial — ADMIN e VENDEDOR */}
        {showClientes && (
          <>
            <div className="pt-3 pb-1">
              <p className="px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Comercial</p>
            </div>
            <NavItem
              item={{ icon: Briefcase, label: 'Painel Comercial', href: '/comercial' }}
              isActive={pathname === '/comercial'}
              accentClass="bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              dotClass="text-amber-600 dark:text-amber-400"
            />
          </>
        )}

        {/* Configurações — somente ADMIN */}
        {isAdmin && (
          <>
            <div className="pt-3 pb-1">
              <p className="px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Sistema</p>
            </div>
            <NavItem
              item={{ icon: Settings, label: 'Configurações', href: '/configuracoes' }}
              isActive={pathname === '/configuracoes'}
              accentClass="bg-gradient-to-r from-slate-500/10 to-gray-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
              dotClass="text-slate-600 dark:text-slate-400"
            />
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        {/* Info do usuário */}
        {user && (
          <div className="px-4 py-2 rounded-xl bg-muted/40 mb-2">
            <p className="text-xs font-semibold truncate">{user.nome}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {perfil === 'ADMIN' ? '🛡 Administrador' : perfil === 'VENDEDOR' ? '🛍 Vendedor' : '📊 Financeiro'}
            </p>
          </div>
        )}
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={toggleDarkMode}>
          {isDark ? <><Sun className="w-5 h-5" /><span>Modo Claro</span></> : <><Moon className="w-5 h-5" /><span>Modo Escuro</span></>}
        </Button>
        {/* Botão Chat com Badge */}
        <button
          onClick={onChatClick}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
            borderRadius: 12, background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted-foreground)', fontSize: 14, fontWeight: 500,
            transition: 'all 0.2s', position: 'relative'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; e.currentTarget.style.color = '#8b5cf6'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
        >
          <div style={{ position: 'relative' }}>
            <MessageCircle size={20} />
            {chatUnread > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: '#8b5cf6', color: '#fff',
                borderRadius: 20, fontSize: 9, fontWeight: 800,
                padding: '1px 5px', minWidth: 16, textAlign: 'center',
                boxShadow: '0 0 0 2px var(--background)',
                animation: 'pulse 2s infinite'
              }}>
                {chatUnread > 99 ? '99+' : chatUnread}
              </span>
            )}
          </div>
          <span>Chat Interno</span>
          {chatUnread > 0 && (
            <span style={{ marginLeft: 'auto', background: 'rgba(139,92,246,0.15)', color: '#a78bfa', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '2px 7px' }}>
              {chatUnread}
            </span>
          )}
        </button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </Button>
      </div>
    </aside>
  );
}

// ─── MobileNav ───────────────────────────────────────────────────────────────
export function MobileNav({ onChatClick, chatUnread = 0 }: { onChatClick?: () => void; chatUnread?: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);

  const perfil = user?.perfil || (user?.role === 'ADMIN' ? 'ADMIN' : 'FINANCEIRO');
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDark(darkMode);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    localStorage.setItem('darkMode', String(newMode));
    document.documentElement.classList.toggle('dark', newMode);
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
    router.push('/login');
  };

  const showFinanceiro = perfil === 'ADMIN' || perfil === 'FINANCEIRO';
  const showClientes   = perfil === 'ADMIN' || perfil === 'VENDEDOR';
  const showLicencas   = perfil === 'ADMIN';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="lg:hidden">
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <LogoSection />
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {showFinanceiro && financeiroItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              accentClass="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20"
              dotClass="text-cyan-600 dark:text-cyan-400"
              onClick={() => setOpen(false)}
            />
          ))}

          {(showClientes || showLicencas) && (
            <>
              <div className="pt-3 pb-1">
                <p className="px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {showClientes && showLicencas ? 'Clientes & Licenças' : showClientes ? 'Clientes' : 'Licenças'}
                </p>
              </div>
              {showClientes && (
                <NavItem
                  item={{ icon: Users, label: 'Clientes', href: '/clientes' }}
                  isActive={pathname === '/clientes'}
                  accentClass="bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                  dotClass="text-violet-600 dark:text-violet-400"
                  onClick={() => setOpen(false)}
                />
              )}
              {showLicencas && (
                <>
                  <NavItem
                    item={{ icon: Package, label: 'Softwares', href: '/softwares' }}
                    isActive={pathname === '/softwares'}
                    accentClass="bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                    dotClass="text-violet-600 dark:text-violet-400"
                    onClick={() => setOpen(false)}
                  />
                  <NavItem
                    item={{ icon: Key, label: 'Licenças', href: '/licencas' }}
                    isActive={pathname === '/licencas'}
                    accentClass="bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                    dotClass="text-violet-600 dark:text-violet-400"
                    onClick={() => setOpen(false)}
                  />
                </>
              )}
            </>
          )}

          {/* Comercial — Mobile */}
          {showClientes && (
            <>
              <div className="pt-3 pb-1">
                <p className="px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Comercial</p>
              </div>
              <NavItem
                item={{ icon: Briefcase, label: 'Painel Comercial', href: '/comercial' }}
                isActive={pathname === '/comercial'}
                accentClass="bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                dotClass="text-amber-600 dark:text-amber-400"
                onClick={() => setOpen(false)}
              />
            </>
          )}

          {isAdmin && (
            <>
              <div className="pt-3 pb-1">
                <p className="px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Sistema</p>
              </div>
              <NavItem
                item={{ icon: Settings, label: 'Configurações', href: '/configuracoes' }}
                isActive={pathname === '/configuracoes'}
                accentClass="bg-gradient-to-r from-slate-500/10 to-gray-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                dotClass="text-slate-600 dark:text-slate-400"
                onClick={() => setOpen(false)}
              />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          {user && (
            <div className="px-4 py-2 rounded-xl bg-muted/40 mb-2">
              <p className="text-xs font-semibold truncate">{user.nome}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={toggleDarkMode}>
            {isDark ? <><Sun className="w-5 h-5" /><span>Modo Claro</span></> : <><Moon className="w-5 h-5" /><span>Modo Escuro</span></>}
          </Button>
          {/* Botão Chat Mobile com Badge */}
          <button
            onClick={() => { onChatClick?.(); setOpen(false); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: 14, fontWeight: 500 }}
          >
            <div style={{ position: 'relative' }}>
              <MessageCircle size={20} />
              {chatUnread > 0 && (
                <span style={{ position: 'absolute', top: -5, right: -5, background: '#8b5cf6', color: '#fff', borderRadius: 20, fontSize: 9, fontWeight: 800, padding: '1px 4px' }}>
                  {chatUnread > 99 ? '99+' : chatUnread}
                </span>
              )}
            </div>
            <span>Chat Interno</span>
            {chatUnread > 0 && <span style={{ marginLeft: 'auto', background: 'rgba(139,92,246,0.15)', color: '#a78bfa', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '2px 7px' }}>{chatUnread}</span>}
          </button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
