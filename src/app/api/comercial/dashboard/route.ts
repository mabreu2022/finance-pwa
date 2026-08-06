import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { propostasRepository } from '@/lib/db/repositories';

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

// GET /api/comercial/dashboard
export async function GET(request: NextRequest) {
  const user = await authCheck(request);
  if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const usuarioIdStr = searchParams.get('usuarioId');
    const usuarioId = usuarioIdStr ? parseInt(usuarioIdStr) : undefined;

    const stats = await propostasRepository.getStats(user.tenantId, {
      startDate,
      endDate,
      usuarioId,
    });

    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error('Erro no dashboard comercial:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
