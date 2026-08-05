import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { contasRepository } from '@/lib/db/repositories';

export async function GET(request: NextRequest) {
  try {
    // Verificar token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const tenantId = payload.tenantId;

    // Buscar dados
    const totalPagar = await contasRepository.getTotalPendente(tenantId, 'PAGAR');
    const totalReceber = await contasRepository.getTotalPendente(tenantId, 'RECEBER');
    const contasPendentes = (await contasRepository.getPendentes(tenantId)).length;
    const contasAtrasadas = (await contasRepository.getAtrasadas(tenantId)).length;

    return NextResponse.json({
      totalPagar,
      totalReceber,
      saldo: totalReceber - totalPagar,
      contasPendentes,
      contasAtrasadas
    });

  } catch (error) {
    console.error('Erro no dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dashboard' },
      { status: 500 }
    );
  }
}
