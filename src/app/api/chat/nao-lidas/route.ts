import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { chatRepository } from '@/lib/db/repositories';

async function auth(req: NextRequest) {
  const h = req.headers.get('authorization');
  if (!h?.startsWith('Bearer ')) return null;
  return verifyToken(h.substring(7));
}

// GET /api/chat/nao-lidas
export async function GET(req: NextRequest) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ total: 0 });
  try {
    const total = await chatRepository.totalNaoLidas(user.tenantId, user.userId);
    return NextResponse.json({ total });
  } catch {
    return NextResponse.json({ total: 0 });
  }
}
