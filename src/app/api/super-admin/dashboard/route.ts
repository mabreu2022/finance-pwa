import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { tenantsRepository, usuariosRepository, contasRepository } from '@/lib/db/repositories';

const JWT_SECRET = new TextEncoder().encode('connect-finance-secret-key-2024');

async function authMiddleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Não autorizado', status: 401 };
  }

  const token = authHeader.substring(7);
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.tipo !== 'super-admin') {
      return { error: 'Acesso restrito', status: 403 };
    }
    return { user: payload };
  } catch {
    return { error: 'Token inválido', status: 401 };
  }
}

export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const tenants = tenantsRepository.getAll();
    const usuarios = usuariosRepository.getAll();
    const todasContas = (await Promise.all(
      tenants.map((t: any) => contasRepository.getAll(t.id))
    )).flat();

    return NextResponse.json({
      totalTenants: tenants.length,
      tenantsAtivos: tenants.filter((t: any) => t.status === 'ATIVO').length,
      totalUsuarios: usuarios.length,
      totalContas: todasContas.length
    });
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
