import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { tenantsRepository } from '@/lib/db/repositories';

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
    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('Erro ao buscar tenants:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { nome, cnpj, email_admin, telefone, plano_id } = body;

    if (!nome || !email_admin) {
      return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 });
    }

    const tenantId = tenantsRepository.create({
      nome,
      cnpj: cnpj || null,
      nome_fantasia: nome,
      email_admin,
      telefone: telefone || null,
      endereco: null,
      dominio: null,
      status: 'TRIAL',
      plano_id: plano_id || 1,
      limite_usuarios: 1,
      data_expiracao: null
    });

    return NextResponse.json({ success: true, tenantId }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar tenant:', error);
    return NextResponse.json({ error: 'Erro ao criar' }, { status: 500 });
  }
}
