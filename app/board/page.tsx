'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, Plus, Search, Filter, Trash2, X, Bell, User, MessageSquare, HelpCircle, Megaphone, Edit3, ChevronRight, Hash, Clock, FileText } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Post {
  id: string;
  board_type: string;
  title: string;
  content: string;
  author_email: string;
  category: string;
  created_at: string;
}

const BOARDS = [
  { id: 'notice', name: '공지사항', icon: <Megaphone size={18} />, color: 'bg-blue-50 text-blue-600' },
  { id: 'free', name: '자유게시판', icon: <MessageSquare size={18} />, color: 'bg-green-50 text-green-600' },
  { id: 'qna', name: '질의응답', icon: <HelpCircle size={18} />, color: 'bg-purple-50 text-purple-600' },
];

const CATEGORIES = ["전체", "공지", "협조", "긴급", "질문", "정보", "일반"];

export default function BoardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [activeBoard, setActiveBoard] = useState('notice');
  const [activeCategory, setActiveCategory] = useState("전체");

  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: '공지' });
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const isAdmin = user?.email === 'bamnamoo@gmail.com';

  useEffect(() => {
    fetchPosts();
    checkUser();
  }, [activeBoard]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('board_type', activeBoard)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWriteModal = (post?: Post) => {
    if (post) {
      setEditingPostId(post.id);
      setNewPost({ title: post.title, content: post.content, category: post.category });
    } else {
      setEditingPostId(null);
      setNewPost({ title: '', content: '', category: '공지' });
    }
    setShowWriteModal(true);
    setShowViewModal(false);
  };

  const handleOpenViewModal = (post: Post) => {
    setSelectedPost(post);
    setShowViewModal(true);
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('로그인이 필요합니다.');

    try {
      // 권한 체크: 공지사항은 관리자만 작성/수정 가능
      if (activeBoard === 'notice' && !isAdmin) {
        return alert('공지사항은 관리자만 작성하거나 수정할 수 있습니다.');
      }

      if (editingPostId) {
        const { data, error } = await supabase
          .from('posts')
          .update({
            title: newPost.title,
            content: newPost.content,
            category: newPost.category
          })
          .eq('id', editingPostId)
          .select();

        if (error) throw error;
        
        if (!data || data.length === 0) {
          return alert('게시글을 수정할 권한이 없거나 이미 삭제된 게시글입니다.');
        }
      } else {
        const { error } = await supabase.from('posts').insert([{ 
          ...newPost, 
          board_type: activeBoard, 
          author_email: user.email 
        }]);
        if (error) throw error;
      }
      
      setShowWriteModal(false);
      setEditingPostId(null);
      fetchPosts();
      
      if (editingPostId) {
        alert('수정되었습니다.');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`저장 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
    }
  };

  const handleDeletePost = async (id: string, authorEmail: string) => {
    if (!isAdmin && user?.email !== authorEmail) return alert('권한이 없습니다.');
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      setShowViewModal(false);
      fetchPosts();
    } catch (error: any) {
      alert(`삭제 실패: ${error.message}`);
    }
  };

  const filteredPosts = posts.filter(post => 
    (post.title.includes(search) || post.content.includes(search)) &&
    (activeCategory === "전체" || post.category === activeCategory)
  );

  return (
    <div className="min-h-screen bg-md-surface flex pt-16">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-blue-50 hidden md:flex flex-col p-8 fixed h-full shadow-sm">
        <div className="space-y-2 mt-4">
          <p className="text-[10px] font-black text-slate-300 px-4 mb-6 uppercase tracking-widest">Active Channels</p>
          {BOARDS.map(board => (
            <button
              key={board.id}
              onClick={() => setActiveBoard(board.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all group ${
                activeBoard === board.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 translate-x-2' 
                : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                activeBoard === board.id ? 'bg-white/20' : board.color
              }`}>
                {board.icon}
              </div>
              <span className="flex-1 text-left">{board.name}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 p-8 md:p-12">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                Live Board System
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                {BOARDS.find(b => b.id === activeBoard)?.name}
              </h1>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                {activeBoard === 'notice' && '행정지원과의 공식 안내 및 긴급 소식을 공유합니다.'}
                {activeBoard === 'free' && '자유롭게 의견을 나누는 열린 공간입니다.'}
                {activeBoard === 'qna' && '궁금한 점을 묻고 전문가의 답변을 받으세요.'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-full md:w-72 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder="검색어 입력..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="modern-input pl-12 h-12"
                />
              </div>
              {user && (isAdmin || activeBoard !== 'notice') && (
                <button onClick={() => handleOpenWriteModal()} className="btn-primary h-12 px-8 shadow-blue-200">
                  <Plus size={20} />
                  <span>글쓰기</span>
                </button>
              )}
            </div>
          </header>

          {/* Categories */}
          <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar bg-white p-2 rounded-2xl border border-blue-50 shadow-sm">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  activeCategory === cat 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Post List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-20 flex flex-col items-center gap-4 animate-pulse font-black text-blue-600 uppercase text-xs">Loading Posts...</div>
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post, idx) => (
                <div key={post.id} onClick={() => handleOpenViewModal(post)} className="modern-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-400 cursor-pointer group">
                  <div className="flex items-start gap-6 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                      <span className="text-xs font-black opacity-50 group-hover:opacity-100">{filteredPosts.length - idx}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm border ${
                          post.category === '긴급' ? 'bg-red-500 text-white border-red-500' :
                          post.category === '공지' ? 'bg-blue-600 text-white border-blue-600' :
                          'bg-white text-slate-500 border-slate-100'
                        }`}>
                          {post.category}
                        </span>
                        <h4 className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                          {post.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
                        <div className="flex items-center gap-1.5">
                          <User size={12} />
                          <span>{post.author_email.split('@')[0]}님</span>
                        </div>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 transition-all" />
                </div>
              ))
            ) : (
              <div className="text-center py-24 bg-white rounded-[40px] border border-dashed border-blue-100 text-slate-400 font-bold italic opacity-60">등록된 게시글이 없습니다.</div>
            )}
          </div>
        </div>
      </main>

      {/* View Detail Modal */}
      {showViewModal && selectedPost && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] w-full max-w-3xl shadow-2xl border border-white overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                  <FileText size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md uppercase">{selectedPost.category}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{BOARDS.find(b => b.id === selectedPost.board_type)?.name}</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedPost.title}</h2>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-500 rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="p-10">
              <div className="flex items-center gap-6 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 border border-slate-100">
                    <User size={14} />
                  </div>
                  <span className="text-sm font-black text-slate-700">{selectedPost.author_email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={14} />
                  <span className="text-xs font-bold">{new Date(selectedPost.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap min-h-[200px] max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                {selectedPost.content}
              </div>
              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center">
                <button onClick={() => setShowViewModal(false)} className="btn-secondary px-8">닫기</button>
                {(isAdmin || user?.email === selectedPost.author_email) && (
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenWriteModal(selectedPost)} className="btn-primary bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-100 shadow-none px-6">수정하기</button>
                    <button onClick={() => handleDeletePost(selectedPost.id, selectedPost.author_email)} className="btn-primary bg-red-50 text-red-500 hover:bg-red-600 hover:text-white border-red-100 shadow-none px-6">삭제하기</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Write/Edit Modal */}
      {showWriteModal && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] w-full max-w-3xl shadow-2xl border border-white overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-10 py-8 bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-between text-white">
              <h2 className="text-2xl font-black">{editingPostId ? '게시글 수정' : '새 글 작성'}</h2>
              <button onClick={() => setShowWriteModal(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmitPost} className="p-10 space-y-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1">제목</label>
                  <input required type="text" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="modern-input h-14 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1">카테고리</label>
                  <select value={newPost.category} onChange={e => setNewPost({...newPost, category: e.target.value})} className="modern-input h-14 font-bold text-blue-600">
                    {CATEGORIES.slice(1).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1">내용</label>
                <textarea required value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="modern-input h-72 resize-none py-6 leading-relaxed" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowWriteModal(false)} className="btn-secondary flex-1 h-14">취소</button>
                <button type="submit" className="btn-primary flex-[2] h-14 text-lg">게시하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
