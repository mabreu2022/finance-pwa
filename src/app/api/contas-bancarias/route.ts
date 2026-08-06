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

// GET /api/contas-bancarias
export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const contas = await contasBancariasRepository.getAll(auth.user.tenantId);
    return NextResponse.json({ success: true, contas });
  } catch (error) {
    console.error('Erro ao buscar contas bancárias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar contas bancárias' },
      { status: 500 }
    );
  }
}

// POST /api/contas-bancarias
const createSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: z.enum(['CORRENTE', 'POUPANCA', 'INVESTIMENTO', 'DINHEIRO', 'OUTRO']),
  saldo_inicial: z.number().default(0)
});

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const validation = createSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const contaId = await contasBancariasRepository.create({
      tenant_id: auth.user.tenantId,
      nome: data.nome,
      tipo: data.tipo,
      saldo_inicial: data.saldo_inicial,
      saldo_atual: data.saldo_inicial,
      ativo: 'S'
    });

    return NextResponse.json(
      { success: true, id: contaId, message: 'Conta bancária criada com sucesso' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar conta bancária:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conta bancária' },
      { status: 500 }
    );
  }
}
