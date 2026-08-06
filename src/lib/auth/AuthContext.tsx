'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  nome: string;
  email: string;
  role: 'ADMIN' | 'USER';
  perfil: 'ADMIN' | 'VENDEDOR' | 'FINANCEIRO';
  tenantId: number;
  tenantNome: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  register: (data: {
    nome: string;
    email: string;
    senha: string;
    nomeAdmin: string;
  }) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar token no localStorage ao iniciar
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, senha: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao fazer login');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const register = async (data: {
    nome: string;
    email: string;
    senha: string;
    nomeAdmin: string;
  }) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        nomeAdmin: data.nomeAdmin,
        planoId: 1 // Plano FREE
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao criar conta');
    }

    setToken(result.token);
    setUser(result.user);
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      loading,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper para fazer requisições autenticadas
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Verificar se está no browser
  if (typeof window === 'undefined') {
    return fetch(url, options);
  }
  
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('Token não encontrado no localStorage');
    window.location.href = '/login';
    throw new Error('Não autenticado');
  }
  
  const headers: Record<string, string> = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  } as any;

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });
  
  // Se o token for inválido ou expirado, redirecionar para login
  if (response.status === 401) {
    console.error('Token inválido ou expirado');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }
  
  return response;
}
