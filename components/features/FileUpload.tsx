'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';

export default function FileUpload({ onUploadSuccess, category = '기타' }: { onUploadSuccess?: () => void, category?: string }) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setStatus('idle');

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('파일을 선택해주세요.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Insert metadata into Database
      const { data: dbData, error: dbError } = await supabase
        .from('documents')
        .insert([
          { 
            file_name: file.name, 
            file_path: filePath, 
            file_size: file.size,
            category: category === '전체 자료' ? '기타' : category
          }
        ])
        .select();

      if (dbError) throw dbError;

      // 3. Trigger PDF Processing (Extract text for RAG)
      if (dbData && dbData[0]) {
        await fetch('/api/process-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: filePath,
            documentId: dbData[0].id
          })
        });
      }

      setStatus('success');
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${
        status === 'success' ? 'bg-green-100 text-green-700' : 'bg-md-primary text-white hover:bg-md-primary/90'
      }`}>
        {uploading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : status === 'success' ? (
          <CheckCircle2 size={18} />
        ) : (
          <Upload size={18} />
        )}
        <span>{uploading ? '업로드 중...' : status === 'success' ? '완료' : '지침서 PDF 업로드'}</span>
        <input 
          type="file" 
          accept=".pdf" 
          onChange={handleUpload} 
          disabled={uploading} 
          className="hidden" 
        />
      </label>
      {status === 'error' && <p className="text-[10px] text-red-500 mt-1">업로드 실패. 다시 시도해주세요.</p>}
    </div>
  );
}
