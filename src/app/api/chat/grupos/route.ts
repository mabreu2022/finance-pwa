import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { chatRepository } from '@/lib/db/repositories';

async function auth(req: NextRequest) {
  const h = req.headers.get('authorization');
  if (!h?.startsWith('Bearer ')) return null;
  return verifyToken(h.substring(7));
}

// GET /api/chat/grupos
export async function GET(req: NextRequest) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  try {
    const grupos = await chatRepository.getGrupos(user.tenantId, user.userId);
    return NextResponse.json({ success: true, grupos });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/chat/grupos
export async function POST(req: NextRequest) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  try {
    const { nome, tipo, membroIds } = await req.json();
    if (!nome || !tipo) return NextResponse.json({ error: 'Nome e tipo obrigatórios' }, { status: 400 });
    const grupo = await chatRepository.criarGrupo(user.tenantId, user.userId, nome, tipo, membroIds || []);
    return NextResponse.json({ success: true, grupo });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
