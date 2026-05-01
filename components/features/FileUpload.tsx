'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2, CheckCircle2, X, FilePlus, Files } from 'lucide-react';

const CATEGORIES = ['예산지침', '인사/급여', '회계/지출', '매뉴얼', '기타'];

export default function FileUpload({ onUploadSuccess, defaultCategory = '기타' }: { onUploadSuccess?: () => void, defaultCategory?: string }) {
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(defaultCategory === '전체 자료' ? '기타' : defaultCategory);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) return alert('파일을 선택해주세요.');

    try {
      setUploading(true);
      setStatus('idle');

      const filesArray = Array.from(selectedFiles);
      
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        const fileExt = file.name.split('.').pop();
        const randomName = `${Math.random().toString(36).substring(7)}_${Date.now()}.${fileExt}`;
        const filePath = `${randomName}`;

        // 1. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Insert metadata into Database
        // 파일이 여러 개일 경우 제목 뒤에 번호를 붙임
        const displayTitle = filesArray.length > 1 && title 
          ? `${title}_${i + 1}` 
          : (title || file.name);

        const { error: dbError } = await supabase
          .from('documents')
          .insert([
            { 
              file_name: displayTitle, 
              file_path: filePath, 
              file_size: file.size,
              category: category
            }
          ]);

        if (dbError) throw dbError;
      }

      setStatus('success');
      setTimeout(() => {
        setShowModal(false);
        setStatus('idle');
        setTitle('');
        setSelectedFiles(null);
        if (onUploadSuccess) onUploadSuccess();
      }, 1500);

    } catch (error: any) {
      console.error('Upload Error:', error);
      alert(`업로드 실패: ${error.message}`);
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Upload Trigger Button */}
      <button 
        onClick={() => setShowModal(true)}
        className="btn-primary h-12 px-8 shadow-blue-200"
      >
        <Upload size={20} />
        <span>자료 업로드</span>
      </button>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-md z-[300] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl border border-white overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-10 py-8 bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-between text-white">
              <div>
                <h2 className="text-2xl font-black">자료 일괄 업로드</h2>
                <p className="text-blue-100 text-[10px] font-bold mt-1 uppercase tracking-widest">Multi-File Archive System</p>
              </div>
              <button 
                onClick={() => !uploading && setShowModal(false)} 
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1">자료 제목 (공통)</label>
                  <input 
                    type="text" 
                    placeholder="파일의 통합 제목을 입력하세요 (미입력 시 원래 파일명 사용)"
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="modern-input h-14 font-bold" 
                    disabled={uploading}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1">자료 분야</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    className="modern-input h-14 font-bold text-blue-600"
                    disabled={uploading}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1">파일 선택 (여러 개 가능)</label>
                  <label className={`flex items-center justify-center gap-2 h-14 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                    selectedFiles ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-400 hover:border-blue-400'
                  }`}>
                    {selectedFiles ? <Files size={20} /> : <FilePlus size={20} />}
                    <span className="text-xs font-black">
                      {selectedFiles ? `${selectedFiles.length}개의 파일 선택됨` : '파일 찾기...'}
                    </span>
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleFileChange} 
                      className="hidden" 
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="btn-secondary flex-1 h-14"
                  disabled={uploading}
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className={`btn-primary flex-[2] h-14 text-lg ${status === 'success' ? 'bg-green-500 shadow-green-100' : ''}`}
                  disabled={uploading || !selectedFiles}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={24} />
                      <span>업로드 중...</span>
                    </>
                  ) : status === 'success' ? (
                    <>
                      <CheckCircle2 className="mr-2" size={24} />
                      <span>업로드 완료</span>
                    </>
                  ) : (
                    <span>자료 업로드 시작</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
