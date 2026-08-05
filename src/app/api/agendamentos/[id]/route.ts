import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { agendamentosRepository, contasRepository } from '@/lib/db/repositories';

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authMiddleware(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    
    const agendamento = await agendamentosRepository.getById(parseInt(id), auth.user.tenantId);
    if (!agendamento) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
    }

    await agendamentosRepository.update(parseInt(id), auth.user.tenantId, body);

    return NextResponse.json({ success: true, message: 'Agendamento atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authMiddleware(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    
    const agendamento = await agendamentosRepository.getById(parseInt(id), auth.user.tenantId);
    if (!agendamento) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
    }

    await agendamentosRepository.delete(parseInt(id), auth.user.tenantId);

    return NextResponse.json({ success: true, message: 'Agendamento excluído' });
  } catch (error) {
    console.error('Erro ao excluir:', error);
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 });
  }
}

// POST executar agendamento - gerar conta
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authMiddleware(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    
    const agendamento = await agendamentosRepository.getById(parseInt(id), auth.user.tenantId);
    if (!agendamento) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
    }

    // Gerar conta
    const hoje = new Date();
    const dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), agendamento.dia_fixo);
    
    // Se o dia já passou, gerar para próximo mês
    if (dataVencimento < hoje) {
      dataVencimento.setMonth(dataVencimento.getMonth() + 1);
    }

    const contaId = await contasRepository.create({
      tenant_id: auth.user.tenantId,
      usuario_id: auth.user.userId,
      descricao: agendamento.descricao,
      valor: agendamento.valor,
      data_vencimento: dataVencimento.toISOString().split('T')[0],
      data_pagamento: null,
      categoria: agendamento.categoria,
      status: 'PENDENTE',
      tipo: agendamento.tipo,
      observacoes: null
    });

    // Atualizar última execução
    await agendamentosRepository.updateUltimaExecucao(parseInt(id), auth.user.tenantId);

    return NextResponse.json({ 
      success: true, 
      message: 'Conta gerada com sucesso!',
      contaId
    });
  } catch (error) {
    console.error('Erro ao executar:', error);
    return NextResponse.json({ error: 'Erro ao executar' }, { status: 500 });
  }
}
