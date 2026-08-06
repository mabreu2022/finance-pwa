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

export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const softwares = await softwaresRepository.getAll(auth.user.tenantId);
    return NextResponse.json({ softwares });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar softwares' }, { status: 500 });
  }
}

const createSchema = z.object({
  nome: z.string().min(2),
  descricao: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await request.json();
    const validation = createSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    const data = validation.data;
    const id = await softwaresRepository.create({
      tenant_id: auth.user.tenantId,
      nome: data.nome,
      descricao: data.descricao || null,
      categoria: data.categoria || null,
      ativo: 'S',
    });
    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar software' }, { status: 500 });
  }
}
