'use client';

import { useEffect, useState } from 'react';
import { FileText, Download, Search, Trash2, ChevronRight, Hash, FolderOpen, ArrowUpRight, Share2, FileDown, Edit3, X, Upload } from 'lucide-react';
import FileUpload from '@/components/features/FileUpload';
import { supabase } from '@/lib/supabase';

interface Document {
  id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  category: string;
  created_at: string;
  group_id: string;
}

interface GroupedDocument {
  group_id: string;
  file_name: string;
  category: string;
  created_at: string;
  files: { id: string; file_name: string; original_name: string; file_path: string; file_size: number }[];
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
  const [editForm, setEditForm] = useState<{file_name: string, category: string, files: FileList | null}>({ 
    file_name: '', 
    category: '', 
    files: null 
  });

  // Download Modal State
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadGroup, setDownloadGroup] = useState<GroupedDocument | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

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
      files: null
    });
    setShowEditModal(true);
  };

  const handleDeleteGroup = async (group: GroupedDocument) => {
    if (!isAdmin) return alert('삭제 권한이 없습니다.');
    if (!confirm(`이 그룹에 포함된 모든 파일(${group.files.length}개)이 삭제됩니다. 정말 삭제하시겠습니까?`)) return;
    
    try {
      const filePaths = group.files.map(f => f.file_path);
      const { error: storageError } = await supabase.storage.from('documents').remove(filePaths);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('group_id', group.group_id);
      
      if (dbError) throw dbError;

      fetchDocuments();
      alert('자료 그룹이 삭제되었습니다.');
    } catch (error: any) {
      alert(`삭제 실패: ${error.message}`);
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    
    setLoading(true);
    try {
      if (editForm.files && editForm.files.length > 0) {
        const filesArray = Array.from(editForm.files);
        const { data: oldFiles } = await supabase.from('documents').select('file_path').eq('group_id', editingDoc.group_id);
        
        if (oldFiles && oldFiles.length > 0) {
          await supabase.storage.from('documents').remove(oldFiles.map(f => f.file_path));
        }
        
        await supabase.from('documents').delete().eq('group_id', editingDoc.group_id);

        for (let i = 0; i < filesArray.length; i++) {
          const file = filesArray[i];
          const fileExt = file.name.split('.').pop();
          const randomName = `${Math.random().toString(36).substring(7)}_${Date.now()}.${fileExt}`;
          const newFilePath = `${randomName}`;
          await supabase.storage.from('documents').upload(newFilePath, file);
          await supabase.from('documents').insert([{
            file_name: i === 0 ? editForm.file_name : file.name,
            original_name: file.name,
            category: editForm.category,
            file_path: newFilePath,
            file_size: file.size,
            group_id: editingDoc.group_id
          }]);
        }
      } else {
        await supabase
          .from('documents')
          .update({ 
            file_name: editForm.file_name, 
            category: editForm.category 
          })
          .eq('group_id', editingDoc.group_id);
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
      setEditForm({ ...editForm, files: e.dataTransfer.files });
    }
  };

  const handleOpenDownloadModal = (group: GroupedDocument) => {
    setDownloadGroup(group);
    setSelectedFileIds(new Set(group.files.map(f => f.id))); // 기본으로 전체 선택
    setShowDownloadModal(true);
  };

  const toggleFileSelection = (fileId: string) => {
    const newSet = new Set(selectedFileIds);
    if (newSet.has(fileId)) newSet.delete(fileId);
    else newSet.add(fileId);
    setSelectedFileIds(newSet);
  };

  const handleDownloadBatch = async () => {
    if (!downloadGroup || selectedFileIds.size === 0) return;
    
    const filesToDownload = downloadGroup.files.filter(f => selectedFileIds.has(f.id));
    
    for (const file of filesToDownload) {
      await handleDownload(file.file_path, file.file_name);
      // 브라우저 차단 방지를 위해 아주 짧은 간격 부여
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    setShowDownloadModal(false);
  };

  const getGroupedDocs = () => {
    const groups: { [key: string]: GroupedDocument } = {};
    documents.forEach(doc => {
      const gid = doc.group_id || doc.id;
      if (!groups[gid]) {
        groups[gid] = {
          group_id: gid,
          file_name: doc.file_name,
          category: doc.category || '기타',
          created_at: doc.created_at,
          files: []
        };
      }
      groups[gid].files.push({
        id: doc.id,
        file_name: doc.file_name,
        original_name: doc.original_name || doc.file_name,
        file_path: doc.file_path,
        file_size: doc.file_size
      });
    });
    return Object.values(groups).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const filteredGroups = getGroupedDocs().filter(group => {
    const titleMatch = group.file_name.toLowerCase().includes(search.toLowerCase());
    const groupCat = (group.category || "").normalize('NFC').trim();
    const activeCat = activeCategory.normalize('NFC').trim();
    const categoryMatch = activeCategory === "전체 자료" || groupCat === activeCat;
    return titleMatch && categoryMatch;
  });

  return (
    <div className="min-h-screen bg-md-surface flex pt-8">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-blue-50 hidden md:flex flex-col p-8 fixed h-full shadow-sm">
        <div className="space-y-2 mt-0">
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
      <main className="flex-1 md:ml-72 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
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
            ) : filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <div key={group.group_id} className="modern-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-100 group">
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner shrink-0">
                      {group.files.length > 1 ? <FolderOpen size={28} /> : <FileText size={28} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                          {group.file_name}
                        </h3>
                        <span className="text-[9px] font-black px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md uppercase tracking-wider">
                          {group.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
                        <span>{new Date(group.created_at).toLocaleDateString()}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <span className="uppercase tracking-widest">
                          총 {group.files.length}개 ({(group.files.reduce((acc, f) => acc + f.file_size, 0) / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      
                      {/* 파일 목록 강조 표시 */}
                      <div className="flex flex-col gap-2 mt-4">
                        {group.files.map(file => (
                          <div key={file.id} className="flex items-center gap-3 px-4 py-2.5 bg-blue-50/50 text-slate-700 rounded-xl border border-blue-100/50 group/file transition-colors hover:bg-blue-100/50">
                            <FileDown size={16} className="text-blue-500" />
                            <span className="text-[13px] font-black leading-tight">{file.original_name}</span>
                            <span className="text-[10px] font-bold text-slate-400 ml-auto uppercase tracking-tighter">{(file.file_size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => group.files.length === 1 
                        ? handleDownload(group.files[0].file_path, group.files[0].file_name)
                        : handleOpenDownloadModal(group)
                      }
                      className={`h-12 px-6 text-xs font-black border transition-all rounded-xl flex items-center gap-2 ${
                        group.files.length === 1 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 hover:scale-105' 
                        : 'bg-white text-blue-600 border-blue-100 hover:border-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <span>{group.files.length === 1 ? '바로 다운로드' : '다운로드 선택'}</span>
                      {group.files.length === 1 ? <FileDown size={18} /> : <Download size={18} />}
                    </button>

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenEditModal({
                            id: group.files[0].id,
                            file_name: group.file_name,
                            category: group.category,
                            file_path: group.files[0].file_path,
                            file_size: group.files[0].file_size,
                            created_at: group.created_at,
                            group_id: group.group_id
                          } as any)}
                          className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                          title="수정"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteGroup(group)}
                          className="p-3 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"
                          title="삭제"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
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
            <form onSubmit={handleUpdateGroup} className="p-10 space-y-8 text-sm">
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
                      editForm.files ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-400 hover:border-blue-400'
                    }`}
                  >
                    <Upload size={20} />
                    <span className="text-xs font-black">
                      {isEditDragging ? '여기에 놓으세요!' : editForm.files ? `${editForm.files.length}개의 파일 선택됨` : '교체할 새 파일 선택 또는 드래그...'}
                    </span>
                    <input 
                      type="file" 
                      multiple
                      onChange={e => setEditForm({...editForm, files: e.target.files})} 
                      className="hidden" 
                    />
                  </label>
                  {!editForm.files && (
                    <p className="text-[10px] text-slate-400 px-1 italic">* 기존 파일을 유지하려면 비워두세요.</p>
                  )}
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary flex-1 h-14" disabled={loading}>취소하기</button>
                <button type="submit" onClick={handleUpdateGroup} className="btn-primary flex-[2] h-14 text-lg" disabled={loading}>
                  {loading ? '처리 중...' : '자료 정보 업데이트'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Download Selection Modal */}
      {showDownloadModal && downloadGroup && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl border border-white overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-10 py-8 bg-blue-600 flex items-center justify-between text-white">
              <div>
                <h2 className="text-xl font-black">다운로드 파일 선택</h2>
                <p className="text-blue-100 text-[10px] font-bold mt-1 uppercase tracking-widest">{downloadGroup.file_name}</p>
              </div>
              <button onClick={() => setShowDownloadModal(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl">
                <X size={24} />
              </button>
            </div>
            <div className="p-8">
              <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-3">
                  {downloadGroup.files.map(file => (
                    <div 
                      key={file.id}
                      onClick={() => toggleFileSelection(file.id)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        selectedFileIds.has(file.id) ? 'border-blue-600 bg-blue-50' : 'border-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        selectedFileIds.has(file.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200'
                      }`}>
                        {selectedFileIds.has(file.id) && <ArrowUpRight size={14} className="rotate-90" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black text-slate-800 truncate">{file.original_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setShowDownloadModal(false)} className="btn-secondary flex-1 h-14">취소</button>
                <button 
                  onClick={handleDownloadBatch}
                  disabled={selectedFileIds.size === 0}
                  className="btn-primary flex-[2] h-14 text-lg shadow-blue-200 disabled:opacity-50"
                >
                  {selectedFileIds.size}개 파일 다운로드
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
