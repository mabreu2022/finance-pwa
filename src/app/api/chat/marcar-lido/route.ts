import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { chatRepository } from '@/lib/db/repositories';

async function auth(req: NextRequest) {
  const h = req.headers.get('authorization');
  if (!h?.startsWith('Bearer ')) return null;
  return verifyToken(h.substring(7));
}

// POST /api/chat/marcar-lido { grupoId }
export async function POST(req: NextRequest) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  try {
    const { grupoId } = await req.json();
    if (!grupoId) return NextResponse.json({ error: 'grupoId obrigatório' }, { status: 400 });
    await chatRepository.marcarComoLido(user.userId, grupoId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
