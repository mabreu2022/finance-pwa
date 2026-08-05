import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { agendamentosRepository, contasRepository } from '@/lib/db/repositories';
import { z } from 'zod';

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

// GET /api/agendamentos
export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo');
    
    let agendamentos;
    if (ativo === 'true') {
      agendamentos = await agendamentosRepository.getAtivos(auth.user.tenantId);
    } else {
      agendamentos = await agendamentosRepository.getAll(auth.user.tenantId);
    }

    return NextResponse.json({ success: true, agendamentos });

  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return NextResponse.json({ error: 'Erro ao buscar' }, { status: 500 });
  }
}

// POST /api/agendamentos
const createSchema = z.object({
  descricao: z.string().min(3),
  valor: z.number().positive(),
  dia_fixo: z.number().min(1).max(31),
  categoria: z.string(),
  tipo: z.enum(['PAGAR', 'RECEBER']),
  recorrente: z.boolean(),
  ativo: z.boolean().optional()
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
    
    // Calcular próxima execução
    const hoje = new Date();
    const proximaExecucao = new Date(hoje.getFullYear(), hoje.getMonth(), data.dia_fixo);
    if (proximaExecucao < hoje) {
      proximaExecucao.setMonth(proximaExecucao.getMonth() + 1);
    }

    const agendamentoId = await agendamentosRepository.create({
      tenant_id: auth.user.tenantId,
      usuario_id: auth.user.userId,
      descricao: data.descricao,
      valor: data.valor,
      dia_fixo: data.dia_fixo,
      categoria: data.categoria,
      tipo: data.tipo,
      recorrente: data.recorrente ? 'S' : 'N',
      ativo: data.ativo !== false ? 'S' : 'N',
      ultima_execucao: null
    });

    // Se não for recorrente, gerar conta imediatamente
    if (!data.recorrente) {
      await contasRepository.create({
        tenant_id: auth.user.tenantId,
        usuario_id: auth.user.userId,
        descricao: data.descricao,
        valor: data.valor,
        data_vencimento: proximaExecucao.toISOString().split('T')[0],
        data_pagamento: null,
        categoria: data.categoria,
        status: 'PENDENTE',
        tipo: data.tipo,
        observacoes: null
      });
    }

    return NextResponse.json(
      { success: true, id: agendamentoId, message: data.recorrente ? 'Agendamento criado com sucesso!' : 'Conta gerada com sucesso!' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json({ error: 'Erro ao criar' }, { status: 500 });
  }
}
