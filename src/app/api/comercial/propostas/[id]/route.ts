import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { propostasRepository } from '@/lib/db/repositories';
import { z } from 'zod';

async function authCheck(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'ADMIN' && payload.perfil !== 'VENDEDOR')) {
    return null;
  }
  return payload;
}

// GET /api/comercial/propostas/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authCheck(request);
  if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const id = parseInt(params.id);
    const proposta = await propostasRepository.getById(id, user.tenantId);

    if (!proposta) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, proposta });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

// Schema de validação
const updateSchema = z.object({
  cliente_id: z.number().optional(),
  usuario_id: z.number().optional(),
  titulo: z.string().min(3).optional(),
  valor: z.number().positive().optional(),
  estagio: z.enum(['PROSPECCAO', 'PROPOSTA', 'NEGOCIACAO', 'GANHA', 'PERDIDA']).optional(),
  descricao: z.string().nullable().optional(),
  data_validade: z.string().nullable().optional(),
  data_fechamento: z.string().nullable().optional(),
});

// PUT /api/comercial/propostas/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authCheck(request);
  if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const id = parseInt(params.id);
    const proposta = await propostasRepository.getById(id, user.tenantId);

    if (!proposta) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.issues }, { status: 400 });
    }

    const data = validation.data;
    await propostasRepository.update(id, user.tenantId, {
      cliente_id: data.cliente_id,
      usuario_id: data.usuario_id,
      titulo: data.titulo,
      valor: data.valor,
      estagio: data.estagio,
      descricao: data.descricao,
      data_validade: data.data_validade,
      data_fechamento: data.data_fechamento,
    });

    return NextResponse.json({ success: true, message: 'Proposta atualizada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao atualizar proposta:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

// DELETE /api/comercial/propostas/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authCheck(request);
  if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const id = parseInt(params.id);
    const proposta = await propostasRepository.getById(id, user.tenantId);

    if (!proposta) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    await propostasRepository.delete(id, user.tenantId);
    return NextResponse.json({ success: true, message: 'Proposta removida com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir proposta:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
