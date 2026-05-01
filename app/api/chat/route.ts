import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // 1. DB에서 가장 최신 지침 파일의 Google URI 가져오기
    const { data: docData } = await supabase
      .from('documents')
      .select('content')
      .eq('category', '예산지침')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "당신은 제공된 PDF 문서를 완벽하게 분석하여 답변하는 행정 전문 AI 비서입니다. 문서의 내용을 바탕으로 정확한 정보를 제공하세요."
    });

    let result;
    
    if (docData?.content && docData.content.startsWith('https://generativelanguage.googleapis.com')) {
      // 2. NotebookLM 방식: 파일 URI를 포함하여 첫 메시지 전송
      // History가 비어있다면 파일과 함께 전송, 있다면 일반 대화 진행
      if (!history || history.length === 0) {
        result = await model.generateContent([
          {
            fileData: {
              mimeType: "application/pdf",
              fileUri: docData.content
            }
          },
          { text: message }
        ]);
      } else {
        const chat = model.startChat({ history });
        result = await chat.sendMessage(message);
      }
    } else {
      // 파일이 없는 경우 일반 대화
      const chat = model.startChat({ history: history || [] });
      result = await chat.sendMessage(message);
    }

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: `AI 응답 오류: ${error.message}` }, { status: 500 });
  }
}
