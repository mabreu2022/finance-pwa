'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Sidebar, MobileNav } from './sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && mounted) {
      // Se não estiver autenticado e não estiver na página de login, redireciona
      if (!user && pathname !== '/login') {
        router.push('/login');
      }
      // Se estiver autenticado e estiver na página de login, redireciona para home
      if (user && pathname === '/login') {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router, mounted]);

  // Não renderiza nada durante o loading inicial para evitar flash
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    );
  }

  // Se estiver na página de login, renderiza sem o layout
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Se não estiver autenticado, não renderiza nada (vai redirecionar)
  if (!user) {
    return null;
  }

  // Layout autenticado
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="lg:hidden h-16 border-b border-border flex items-center px-4 sticky top-0 bg-background/80 backdrop-blur-md z-50">
          <MobileNav />
          <span className="ml-3 font-bold">Connect Finance</span>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
