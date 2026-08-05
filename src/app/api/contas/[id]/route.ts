import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { contasRepository } from '@/lib/db/repositories';
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
    
    const conta = await contasRepository.getById(parseInt(id), auth.user.tenantId);
    if (!conta) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    await contasRepository.update(parseInt(id), auth.user.tenantId, body);

    return NextResponse.json({ success: true, message: 'Conta atualizada' });
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
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
    
    const conta = await contasRepository.getById(parseInt(id), auth.user.tenantId);
    if (!conta) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    await contasRepository.delete(parseInt(id), auth.user.tenantId);

    return NextResponse.json({ success: true, message: 'Conta excluída' });
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 });
  }
}
