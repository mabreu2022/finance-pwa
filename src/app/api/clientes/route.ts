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

export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const clientes = await clientesRepository.getAll(auth.user.tenantId);
    return NextResponse.json({ clientes });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return NextResponse.json({ error: 'Erro ao listar clientes' }, { status: 500 });
  }
}

const createSchema = z.object({
  tipo: z.enum(['PF', 'PJ']),
  nome: z.string().min(2),
  nome_fantasia: z.string().optional().nullable(),
  cpf_cnpj: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  telefone: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
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
    const id = await clientesRepository.create({
      tenant_id: auth.user.tenantId,
      tipo: data.tipo,
      nome: data.nome,
      nome_fantasia: data.nome_fantasia || null,
      cpf_cnpj: data.cpf_cnpj || null,
      email: data.email || null,
      telefone: data.telefone || null,
      endereco: data.endereco || null,
      observacoes: data.observacoes || null,
      ativo: 'S',
    });
    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
  }
}
