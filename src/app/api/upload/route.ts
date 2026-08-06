import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

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

// POST /api/upload
export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tipo = formData.get('tipo') as string | null; // 'BOLETO' ou 'COMPROVANTE'

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (tipo !== 'BOLETO' && tipo !== 'COMPROVANTE') {
      return NextResponse.json({ error: 'Tipo de anexo inválido' }, { status: 400 });
    }

    // Validar tipo do arquivo (PDF ou imagens)
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Apenas arquivos PDF, JPG, PNG e WEBP são permitidos' }, { status: 400 });
    }

    // Ler bytes do arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Gerar um nome único seguro (UUID + extensão original)
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;
    
    // Definir pasta de destino
    const subfolder = tipo === 'BOLETO' ? 'boletos' : 'comprovantes';
    const relativePath = `/uploads/${subfolder}/${uniqueFileName}`;
    const absolutePath = join(process.cwd(), 'public', 'uploads', subfolder, uniqueFileName);

    // Salvar o arquivo no disco
    await writeFile(absolutePath, buffer);
    console.log(`💾 Arquivo salvo com sucesso: ${absolutePath}`);

    return NextResponse.json({
      success: true,
      url: relativePath,
      name: file.name
    });
  } catch (error) {
    console.error('Erro no upload de arquivos:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 });
  }
}
