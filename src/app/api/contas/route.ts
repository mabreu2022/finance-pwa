import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { contasRepository } from '@/lib/db/repositories';
import { z } from 'zod';

// Middleware para verificar autenticação
async function authMiddleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Não autorizado', status: 401 };
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  
  if (!payload) {
    return { error: 'Token inválido', status: 401 };
  }

  return { user: payload };
}

// GET /api/contas?tipo=PAGAR|RECEBER
export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const status = searchParams.get('status');

    let contas;
    if (tipo) {
      contas = await contasRepository.getByTipo(auth.user.tenantId, tipo);
    } else if (status) {
      contas = await contasRepository.getByStatus(auth.user.tenantId, status);
    } else {
      contas = await contasRepository.getAll(auth.user.tenantId);
    }

    return NextResponse.json({ success: true, contas });

  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar contas' },
      { status: 500 }
    );
  }
}

// POST /api/contas
const createSchema = z.object({
  descricao: z.string().min(3),
  valor: z.number().positive(),
  data_vencimento: z.string(),
  categoria: z.string(),
  tipo: z.enum(['PAGAR', 'RECEBER']),
  observacoes: z.string().optional()
});

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const validation = createSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const contaId = await contasRepository.create({
      tenant_id: auth.user.tenantId,
      usuario_id: auth.user.userId,
      descricao: data.descricao,
      valor: data.valor,
      data_vencimento: data.data_vencimento,
      data_pagamento: null,
      categoria: data.categoria,
      status: 'PENDENTE',
      tipo: data.tipo,
      observacoes: data.observacoes || null
    });

    return NextResponse.json(
      { success: true, id: contaId, message: 'Conta criada com sucesso' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erro ao criar conta:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
}
