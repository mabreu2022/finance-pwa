import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { clientesRepository } from '@/lib/db/repositories';
import { z } from 'zod';

async function authMiddleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return { error: 'Não autorizado', status: 401 };
  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  if (!payload) return { error: 'Token inválido', status: 401 };
  return { user: payload };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authMiddleware(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const cliente = await clientesRepository.getById(Number(params.id), auth.user.tenantId);
    if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    return NextResponse.json({ cliente });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 });
  }
}

const updateSchema = z.object({
  tipo: z.enum(['PF', 'PJ']).optional(),
  nome: z.string().min(2).optional(),
  nome_fantasia: z.string().optional().nullable(),
  cpf_cnpj: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  ativo: z.enum(['S', 'N']).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authMiddleware(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await request.json();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    await clientesRepository.update(Number(params.id), auth.user.tenantId, validation.data as any);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authMiddleware(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    await clientesRepository.delete(Number(params.id), auth.user.tenantId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir cliente' }, { status: 500 });
  }
}
