'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Sidebar, MobileNav } from './sidebar';
import ChatDrawer from './ChatDrawer';

// Mapa de rotas permitidas por perfil
const PERFIL_ROUTES: Record<string, string[]> = {
  ADMIN: ['*'], // acesso total
  VENDEDOR: ['/clientes', '/comercial'],
  FINANCEIRO: ['/', '/contas-pagar', '/contas-receber', '/contas-bancarias', '/agendamentos', '/relatorios'],
};

function isRouteAllowed(perfil: string, pathname: string): boolean {
  const allowed = PERFIL_ROUTES[perfil];
  if (!allowed) return false;
  if (allowed.includes('*')) return true;
  return allowed.some(route => pathname === route || pathname.startsWith(route + '/'));
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && mounted) {
      if (!user && pathname !== '/login') { router.push('/login'); return; }
      if (user && pathname === '/login') { router.push('/'); return; }
      if (user && pathname !== '/login') {
        const perfil = user.perfil || (user.role === 'ADMIN' ? 'ADMIN' : 'FINANCEIRO');
        if (!isRouteAllowed(perfil, pathname)) {
          const allowed = PERFIL_ROUTES[perfil];
          const redirectTo = allowed && !allowed.includes('*') ? allowed[0] : '/';
          router.replace(redirectTo);
        }
      }
    }
  }, [user, loading, pathname, router, mounted]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    );
  }

  if (pathname === '/login') return <>{children}</>;
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar onChatClick={() => setChatOpen(true)} chatUnread={chatUnread} />
      <div className="flex-1 flex flex-col">
        <header className="lg:hidden h-16 border-b border-border flex items-center px-4 sticky top-0 bg-background/80 backdrop-blur-md z-50">
          <MobileNav onChatClick={() => setChatOpen(true)} chatUnread={chatUnread} />
          <span className="ml-3 font-bold">Connect Finance</span>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onUnreadChange={setChatUnread}
      />
    </div>
  );
}
