import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { licencasRepository, contasRepository } from '@/lib/db/repositories';

async function authMiddleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return { error: 'Não autorizado', status: 401 };
  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  if (!payload) return { error: 'Token inválido', status: 401 };
  return { user: payload };
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authMiddleware(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const licenca = await licencasRepository.getById(Number(params.id), auth.user.tenantId);
    if (!licenca) return NextResponse.json({ error: 'Licença não encontrada' }, { status: 404 });
    if (licenca.status !== 'ATIVA') return NextResponse.json({ error: 'Só é possível gerar cobrança para licenças ativas' }, { status: 400 });

    // Calcular próximo vencimento
    const dataVencimento = await licencasRepository.gerarProximoVencimento(licenca);
    const mesesMap: Record<string, string> = {
      MENSAL: 'Mensal', BIMESTRAL: 'Bimestral', TRIMESTRAL: 'Trimestral', SEMESTRAL: 'Semestral', ANUAL: 'Anual'
    };

    // Gerar a conta a receber
    const contaId = await contasRepository.create({
      tenant_id: auth.user.tenantId,
      usuario_id: auth.user.userId,
      conta_bancaria_id: licenca.conta_bancaria_id,
      descricao: `${licenca.software_nome} – ${licenca.cliente_nome} (${mesesMap[licenca.periodicidade] || licenca.periodicidade})`,
      valor: licenca.valor,
      data_vencimento: dataVencimento,
      data_pagamento: null,
      categoria: 'Licença de Software',
      status: 'PENDENTE',
      tipo: 'RECEBER',
      observacoes: licenca.descricao,
      arquivo_boleto: null,
      arquivo_comprovante: null,
    });

    // Atualizar ultima_geracao na licença
    await licencasRepository.update(licenca.id, auth.user.tenantId, {
      ultima_geracao: new Date().toISOString().split('T')[0],
    });

    return NextResponse.json({
      success: true,
      conta_id: contaId,
      data_vencimento: dataVencimento,
      message: 'Cobrança gerada com sucesso e adicionada às Contas a Receber!'
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao gerar cobrança:', error);
    return NextResponse.json({ error: 'Erro ao gerar cobrança' }, { status: 500 });
  }
}
