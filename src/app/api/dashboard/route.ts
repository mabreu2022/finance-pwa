import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { contasRepository, contasBancariasRepository, licencasRepository } from '@/lib/db/repositories';

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
    const userId = payload.userId;

    // Processar automações de licenças (cobranças automáticas e renovações)
    await licencasRepository.processarAutomacoes(tenantId, userId);

    // Obter parâmetros de período
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // Buscar dados
    const totalPagar = await contasRepository.getTotalPendente(tenantId, 'PAGAR', startDate, endDate);
    const totalReceber = await contasRepository.getTotalPendente(tenantId, 'RECEBER', startDate, endDate);
    const contasPendentes = (await contasRepository.getPendentes(tenantId, startDate, endDate)).length;
    const contasAtrasadas = (await contasRepository.getAtrasadas(tenantId, startDate, endDate)).length;
    const contasBancarias = await contasBancariasRepository.getAll(tenantId);
    const contasPeriodo = await contasRepository.getPeriodo(tenantId, startDate, endDate);

    return NextResponse.json({
      totalPagar,
      totalReceber,
      saldo: totalReceber - totalPagar,
      contasPendentes,
      contasAtrasadas,
      contasBancarias,
      contasPeriodo
    });

  } catch (error) {
    console.error('Erro no dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dashboard' },
      { status: 500 }
    );
  }
}
