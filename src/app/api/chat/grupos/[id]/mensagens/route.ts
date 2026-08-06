import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { chatRepository } from '@/lib/db/repositories';

async function auth(req: NextRequest) {
  const h = req.headers.get('authorization');
  if (!h?.startsWith('Bearer ')) return null;
  return verifyToken(h.substring(7));
}

// GET /api/chat/grupos/[id]/mensagens
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  try {
    const grupoId = parseInt(params.id);
    const mensagens = await chatRepository.getMensagens(grupoId, user.tenantId);
    return NextResponse.json({ success: true, mensagens });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/chat/grupos/[id]/mensagens
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  try {
    const grupoId = parseInt(params.id);
    const { conteudo, mencoes } = await req.json();
    if (!conteudo?.trim()) return NextResponse.json({ error: 'Conteúdo obrigatório' }, { status: 400 });
    const msg = await chatRepository.enviarMensagem(user.tenantId, grupoId, user.userId, conteudo, mencoes || '');
    return NextResponse.json({ success: true, mensagem: msg });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/chat/grupos/[id]/mensagens?msgId=X
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const msgId = parseInt(searchParams.get('msgId') || '0');
    if (!msgId) return NextResponse.json({ error: 'msgId obrigatório' }, { status: 400 });
    await chatRepository.deletarMensagem(msgId, user.userId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
