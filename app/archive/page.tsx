'use client';

import { useEffect, useState } from 'react';
import { FileText, Download, Search, Trash2, ChevronRight, Hash, FolderOpen, ArrowUpRight, Share2, FileDown, Edit3, X, Upload } from 'lucide-react';
import FileUpload from '@/components/features/FileUpload';
import { supabase } from '@/lib/supabase';

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  category: string;
  created_at: string;
}

const CATEGORIES = ['전체 자료', '예산지침', '인사/급여', '회계/지출', '매뉴얼', '기타'];

export default function ArchivePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체 자료");
  const [isEditDragging, setIsEditDragging] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [editForm, setEditForm] = useState<{file_name: string, category: string, file: File | null}>({ 
    file_name: '', 
    category: '', 
    file: null 
  });

  useEffect(() => {
    checkAdmin();
    fetchDocuments();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAdmin(session?.user?.email === 'bamnamoo@gmail.com');
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (doc: Document) => {
    setEditingDoc(doc);
    setEditForm({ 
      file_name: doc.file_name, 
      category: doc.category || '기타',
      file: null
    });
    setShowEditModal(true);
  };

  const handleUpdateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    
    setLoading(true);
    try {
      let updatePayload: any = { 
        file_name: editForm.file_name, 
        category: editForm.category 
      };

      // 1. 새 파일이 선택된 경우 처리
      if (editForm.file) {
        const file = editForm.file;
        const fileExt = file.name.split('.').pop();
        const randomName = `${Math.random().toString(36).substring(7)}_${Date.now()}.${fileExt}`;
        const newFilePath = `${randomName}`;

        // 새 파일 업로드
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(newFilePath, file);

        if (uploadError) throw uploadError;

        // 기존 파일 삭제
        await supabase.storage.from('documents').remove([editingDoc.file_path]);

        // 업데이트 정보에 파일 경로와 크기 추가
        updatePayload.file_path = newFilePath;
        updatePayload.file_size = file.size;
      }

      // 2. DB 정보 업데이트
      const { data, error } = await supabase
        .from('documents')
        .update(updatePayload)
        .eq('id', editingDoc.id)
        .select();
      
      if (error) throw error;

      if (!data || data.length === 0) {
        return alert('자료 정보를 수정할 권한이 없습니다.');
      }

      setShowEditModal(false);
      fetchDocuments();
      alert('자료 정보가 수정되었습니다.');
    } catch (error: any) {
      console.error('Update error:', error);
      alert(`수정 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, path: string) => {
    if (!isAdmin) return alert('삭제 권한이 없습니다.');
    if (!confirm('정말로 이 지침서를 삭제하시겠습니까? 관련 AI 학습 데이터도 함께 삭제됩니다.')) return;

    try {
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
      await supabase.storage.from('documents').remove([path]);
      fetchDocuments();
      alert('지침서가 삭제되었습니다.');
    } catch (error: any) {
      alert(`삭제 중 오류 발생: ${error.message}`);
    }
  };

  const handleDownload = async (path: string, name: string) => {
    const { data, error } = await supabase.storage.from('documents').download(path);
    if (error) {
      alert('파일 다운로드 실패');
      return;
    }
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', name);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleEditDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsEditDragging(true);
    } else if (e.type === 'dragleave') {
      setIsEditDragging(false);
    }
  };

  const handleEditDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setEditForm({ ...editForm, file: e.dataTransfer.files[0] });
    }
  };

  const filteredDocs = documents.filter(doc => {
    const titleMatch = doc.file_name.toLowerCase().includes(search.toLowerCase());
    const docCat = (doc.category || "").normalize('NFC').trim();
    const activeCat = activeCategory.normalize('NFC').trim();
    const categoryMatch = activeCategory === "전체 자료" || docCat === activeCat;
    return titleMatch && categoryMatch;
  });

  return (
    <div className="min-h-screen bg-md-surface flex pt-16">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-blue-50 hidden md:flex flex-col p-8 fixed h-full shadow-sm">
        <div className="space-y-2 mt-4">
          <p className="text-[10px] font-black text-slate-300 px-4 mb-6 uppercase tracking-widest">Library Navigator</p>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all group ${
                activeCategory === cat 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 translate-x-2' 
                : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                activeCategory === cat ? 'bg-white/20' : 'bg-blue-50 text-blue-400'
              }`}>
                <Hash size={16} />
              </div>
              <span className="flex-1 text-left">{cat}</span>
              {activeCategory === cat && <ChevronRight size={14} className="opacity-50" />}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 p-8 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                Digital Archive System
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                {activeCategory}
              </h1>
              <p className="text-sm text-slate-500 mt-2 font-medium">서울 교육 행정의 다양한 지침과 서식을 신속하게 공유합니다.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-full md:w-72 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder="지침서 명칭 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="modern-input pl-12 h-12 shadow-blue-50"
                />
              </div>
              {isAdmin && (
                <FileUpload onUploadSuccess={fetchDocuments} defaultCategory={activeCategory} />
              )}
            </div>
          </header>

          {/* Document List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-20 flex flex-col items-center gap-4 animate-pulse">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black text-blue-600 tracking-widest uppercase">Syncing Archive...</p>
              </div>
            ) : filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <div key={doc.id} className="modern-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-100 group">
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner shrink-0">
                      <FileText size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                          {doc.file_name}
                        </h3>
                        <span className="text-[9px] font-black px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md uppercase tracking-wider">
                          {doc.category || '미분류'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <span className="uppercase tracking-widest">{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenEditModal(doc)}
                          className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                          title="수정"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id, doc.file_path)}
                          className="p-3 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"
                          title="삭제"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => handleDownload(doc.file_path, doc.file_name)}
                      className="btn-secondary h-12 px-8 text-xs font-black border-blue-100 hover:border-blue-600 hover:shadow-lg transition-all group-hover:bg-blue-600 group-hover:text-white whitespace-nowrap"
                    >
                      <span>파일 다운로드</span>
                      <FileDown size={18} className="ml-2" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-24 bg-white rounded-[40px] border border-dashed border-blue-100">
                <p className="text-slate-400 font-black italic opacity-60">등록된 자료가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modern Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl border border-white overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-10 py-8 bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">지침 자료 정보 수정</h2>
                <p className="text-blue-100 text-xs font-bold mt-1 uppercase tracking-widest">Document Meta Management</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateDoc} className="p-10 space-y-8 text-sm">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-3 px-1 uppercase tracking-widest">파일 명칭</label>
                <input required type="text" value={editForm.file_name} onChange={e => setEditForm({...editForm, file_name: e.target.value})} className="modern-input h-14 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-3 px-1 uppercase tracking-widest">카테고리 분류</label>
                <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="modern-input h-14 appearance-none font-bold text-blue-600">
                  {CATEGORIES.slice(1).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-3 px-1 uppercase tracking-widest">파일 교체 (선택사항)</label>
                <div className="flex flex-col gap-2">
                  <label 
                    onDragEnter={handleEditDrag}
                    onDragOver={handleEditDrag}
                    onDragLeave={handleEditDrag}
                    onDrop={handleEditDrop}
                    className={`flex items-center justify-center gap-3 h-14 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                      isEditDragging ? 'border-blue-600 bg-blue-50 scale-[1.02]' :
                      editForm.file ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-400 hover:border-blue-400'
                    }`}
                  >
                    <Upload size={20} />
                    <span className="text-xs font-black">
                      {isEditDragging ? '여기에 놓으세요!' : editForm.file ? `${editForm.file.name} 선택됨` : '교체할 새 파일 선택 또는 드래그...'}
                    </span>
                    <input 
                      type="file" 
                      onChange={e => setEditForm({...editForm, file: e.target.files?.[0] || null})} 
                      className="hidden" 
                    />
                  </label>
                  {!editForm.file && (
                    <p className="text-[10px] text-slate-400 px-1 italic">* 기존 파일을 유지하려면 비워두세요.</p>
                  )}
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary flex-1 h-14" disabled={loading}>취소하기</button>
                <button type="submit" className="btn-primary flex-[2] h-14 text-lg" disabled={loading}>
                  {loading ? '처리 중...' : '자료 정보 업데이트'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
