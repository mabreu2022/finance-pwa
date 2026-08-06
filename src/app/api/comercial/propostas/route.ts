import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { propostasRepository } from '@/lib/db/repositories';
import { z } from 'zod';

async function authCheck(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  // Apenas ADMIN e VENDEDOR têm acesso
  if (!payload || (payload.role !== 'ADMIN' && payload.perfil !== 'VENDEDOR')) {
    return null;
  }
  return payload;
}

// GET /api/comercial/propostas
export async function GET(request: NextRequest) {
  const user = await authCheck(request);
  if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const estagio = searchParams.get('estagio') || undefined;
    const usuarioIdStr = searchParams.get('usuarioId');
    const usuarioId = usuarioIdStr ? parseInt(usuarioIdStr) : undefined;

    const propostas = await propostasRepository.getAll(user.tenantId, {
      startDate,
      endDate,
      estagio,
      usuarioId,
    });

    return NextResponse.json({ success: true, propostas });
  } catch (error: any) {
    console.error('Erro ao listar propostas:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

// Schema de validação
const createSchema = z.object({
  cliente_id: z.number(),
  usuario_id: z.number(),
  titulo: z.string().min(3),
  valor: z.number().positive(),
  estagio: z.enum(['PROSPECCAO', 'PROPOSTA', 'NEGOCIACAO', 'GANHA', 'PERDIDA']),
  descricao: z.string().nullable().optional(),
  data_validade: z.string().nullable().optional(),
  data_fechamento: z.string().nullable().optional(),
});

// POST /api/comercial/propostas
export async function POST(request: NextRequest) {
  const user = await authCheck(request);
  if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const body = await request.json();
    const validation = createSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.issues }, { status: 400 });
    }

    const data = validation.data;
    const propostaId = await propostasRepository.create({
      tenant_id: user.tenantId,
      cliente_id: data.cliente_id,
      usuario_id: data.usuario_id,
      titulo: data.titulo,
      valor: data.valor,
      estagio: data.estagio,
      descricao: data.descricao || null,
      data_validade: data.data_validade || null,
      data_fechamento: data.data_fechamento || null,
    });

    return NextResponse.json({ success: true, id: propostaId, message: 'Proposta comercial criada com sucesso' }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar proposta:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
