import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { softwaresRepository } from '@/lib/db/repositories';
import { z } from 'zod';

async function authMiddleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return { error: 'Não autorizado', status: 401 };
  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  if (!payload) return { error: 'Token inválido', status: 401 };
  return { user: payload };
}

const updateSchema = z.object({
  nome: z.string().min(2).optional(),
  descricao: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
  ativo: z.enum(['S', 'N']).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authMiddleware(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await request.json();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    await softwaresRepository.update(Number(params.id), auth.user.tenantId, validation.data as any);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar software' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authMiddleware(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    await softwaresRepository.delete(Number(params.id), auth.user.tenantId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir software' }, { status: 500 });
  }
}
