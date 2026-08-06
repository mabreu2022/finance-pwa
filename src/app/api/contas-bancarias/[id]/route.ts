import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { contasBancariasRepository } from '@/lib/db/repositories';
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

// PATCH /api/contas-bancarias/[id]
const updateSchema = z.object({
  nome: z.string().min(1).optional(),
  tipo: z.enum(['CORRENTE', 'POUPANCA', 'INVESTIMENTO', 'DINHEIRO', 'OUTRO']).optional(),
  saldo_inicial: z.number().optional(),
  ativo: z.enum(['S', 'N']).optional()
});

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
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.issues },
        { status: 400 }
      );
    }

    const conta = await contasBancariasRepository.getById(parseInt(id), auth.user.tenantId);
    if (!conta) {
      return NextResponse.json({ error: 'Conta bancária não encontrada' }, { status: 404 });
    }

    await contasBancariasRepository.update(parseInt(id), auth.user.tenantId, validation.data);

    return NextResponse.json({ success: true, message: 'Conta bancária atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar conta bancária:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

// DELETE /api/contas-bancarias/[id]
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
    
    const conta = await contasBancariasRepository.getById(parseInt(id), auth.user.tenantId);
    if (!conta) {
      return NextResponse.json({ error: 'Conta bancária não encontrada' }, { status: 404 });
    }

    await contasBancariasRepository.delete(parseInt(id), auth.user.tenantId);

    return NextResponse.json({ success: true, message: 'Conta bancária excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir conta bancária:', error);
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 });
  }
}
