import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { licencasRepository, contasRepository } from '@/lib/db/repositories';
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
  cliente_id: z.number().optional(),
  software_id: z.number().optional(),
  conta_bancaria_id: z.number().nullable().optional(),
  descricao: z.string().optional(),
  valor: z.number().optional(),
  periodicidade: z.enum(['MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']).optional(),
  dia_vencimento: z.number().int().min(1).max(28).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().nullable().optional(),
  status: z.enum(['ATIVA', 'SUSPENSA', 'CANCELADA']).optional(),
  observacoes: z.string().nullable().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authMiddleware(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await request.json();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    await licencasRepository.update(Number(params.id), auth.user.tenantId, validation.data as any);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar licença' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authMiddleware(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    await licencasRepository.update(Number(params.id), auth.user.tenantId, { status: 'CANCELADA' });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao cancelar licença' }, { status: 500 });
  }
}
