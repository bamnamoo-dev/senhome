import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
const pdf = require('pdf-parse');

export async function POST(req: Request) {
  try {
    const { filePath, documentId } = await req.json();

    // 서버 사이드에서 직접 Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // 1. Supabase Storage에서 파일 다운로드
    const { data, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (downloadError) throw downloadError;

    // 2. PDF 텍스트 추출
    const buffer = Buffer.from(await data.arrayBuffer());
    const pdfData = await pdf(buffer);
    const extractedText = pdfData.text;

    // 3. DB의 content 컬럼 업데이트
    const { error: updateError } = await supabase
      .from('documents')
      .update({ content: extractedText })
      .eq('id', documentId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, textLength: extractedText.length });
  } catch (error: any) {
    console.error('PDF Processing Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
