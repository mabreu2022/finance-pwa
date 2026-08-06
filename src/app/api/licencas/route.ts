import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { licencasRepository } from '@/lib/db/repositories';
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
    // Processar automações (renovação automática e geração de cobrança)
    await licencasRepository.processarAutomacoes(auth.user.tenantId, auth.user.userId);
    
    const licencas = await licencasRepository.getAll(auth.user.tenantId);
    return NextResponse.json({ licencas });
  } catch (error) {
    console.error('Erro ao listar licenças:', error);
    return NextResponse.json({ error: 'Erro ao listar licenças' }, { status: 500 });
  }
}

const createSchema = z.object({
  cliente_id: z.number().int().positive(),
  software_id: z.number().int().positive(),
  conta_bancaria_id: z.number().nullable().optional(),
  descricao: z.string().min(3),
  valor: z.number().positive(),
  periodicidade: z.enum(['MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']),
  dia_vencimento: z.number().int().min(1).max(28),
  data_inicio: z.string(),
  data_fim: z.string().nullable().optional(),
  status: z.enum(['ATIVA', 'SUSPENSA', 'CANCELADA']).optional(),
  observacoes: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await request.json();
    const validation = createSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: 'Dados inválidos', details: validation.error.issues }, { status: 400 });
    const data = validation.data;
    const id = await licencasRepository.create({
      tenant_id: auth.user.tenantId,
      cliente_id: data.cliente_id,
      software_id: data.software_id,
      conta_bancaria_id: data.conta_bancaria_id || null,
      descricao: data.descricao,
      valor: data.valor,
      periodicidade: data.periodicidade,
      dia_vencimento: data.dia_vencimento,
      data_inicio: data.data_inicio,
      data_fim: data.data_fim || null,
      status: data.status || 'ATIVA',
      gerar_conta_auto: 'N',
      ultima_geracao: null,
      observacoes: data.observacoes || null,
    });
    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar licença:', error);
    return NextResponse.json({ error: 'Erro ao criar licença' }, { status: 500 });
  }
}
