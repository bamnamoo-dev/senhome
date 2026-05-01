'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, ExternalLink, Bot, ChevronRight, Hash, ArrowUpRight, Sparkles, Edit3, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AIBot {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  icon_type: string;
}

const CATEGORIES = ["전체", "예산지침", "계약", "인사", "급여", "회계", "지출", "매뉴얼", "기타"];

export default function ChatbotPage() {
  const [bots, setBots] = useState<AIBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBotId, setEditingBotId] = useState<string | null>(null);
  const [newBot, setNewBot] = useState({
    title: '',
    description: '',
    url: '',
    category: '예산지침',
    icon_type: 'Bot'
  });

  useEffect(() => {
    checkAdmin();
    fetchBots();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAdmin(session?.user?.email === 'bamnamoo@gmail.com');
  };

  const fetchBots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_bots')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBots(data || []);
    } catch (error) {
      console.error('Error fetching bots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = (bot?: AIBot) => {
    if (bot) {
      setEditingBotId(bot.id);
      setNewBot({
        title: bot.title,
        description: bot.description,
        url: bot.url,
        category: bot.category,
        icon_type: bot.icon_type
      });
    } else {
      setEditingBotId(null);
      setNewBot({
        title: '',
        description: '',
        url: '',
        category: '예산지침',
        icon_type: 'Bot'
      });
    }
    setShowAddModal(true);
  };

  const handleSubmitBot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBotId) {
        const { error } = await supabase.from('ai_bots').update(newBot).eq('id', editingBotId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ai_bots').insert([newBot]);
        if (error) throw error;
      }
      setShowAddModal(false);
      setEditingBotId(null);
      fetchBots();
    } catch (error: any) {
      alert(`실패: ${error.message}`);
    }
  };

  const handleDeleteBot = async (id: string) => {
    if (!confirm('지침을 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('ai_bots').delete().eq('id', id);
      if (error) throw error;
      fetchBots();
    } catch (error: any) {
      alert(`삭제 실패: ${error.message}`);
    }
  };

  const filteredBots = bots.filter(bot => {
    const titleMatch = bot.title.toLowerCase().includes(search.toLowerCase()) || 
                       bot.description.toLowerCase().includes(search.toLowerCase());
    
    // Normalize Korean characters to prevent NFC/NFD mismatch
    const botCat = (bot.category || "").normalize('NFC').trim();
    const activeCat = activeCategory.normalize('NFC').trim();
    
    const categoryMatch = activeCategory === "전체" || botCat === activeCat;
    
    return titleMatch && categoryMatch;
  });

  return (
    <div className="h-screen bg-md-surface flex pt-16 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-blue-50 hidden md:flex flex-col p-8 fixed top-16 bottom-0 shadow-sm overflow-y-auto">
        <div className="space-y-2 mt-0">
          <p className="text-[10px] font-black text-slate-300 px-4 mb-6 uppercase tracking-widest">AI Intelligence Hub</p>
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
      <main className="flex-1 md:ml-72 p-6 md:p-8 overflow-y-auto h-full">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                Next-Gen AI Assistance
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                {activeCategory === '전체' ? '모든 지침 챗봇' : `${activeCategory} 전용 챗봇`} <span className="text-blue-600 text-2xl">(구글 ID 필요)</span>
              </h1>
              <p className="text-sm text-slate-500 mt-2 font-medium">행정 지침을 완벽하게 학습한 AI 챗봇 리스트입니다.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-full md:w-72 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder="챗봇 이름 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="modern-input pl-12 h-12 shadow-blue-50"
                />
              </div>
              {isAdmin && (
                <button onClick={() => handleOpenAddModal()} className="btn-primary h-12 px-8 shadow-blue-200">
                  <Plus size={20} />
                  <span>새 챗봇 추가</span>
                </button>
              )}
            </div>
          </header>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-20 animate-pulse text-xs font-black text-blue-600 tracking-widest uppercase">Connecting...</div>
            ) : filteredBots.length > 0 ? (
              filteredBots.map(bot => (
                <div key={bot.id} className="modern-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-100 group">
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                      <Bot size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">{bot.title}</h3>
                        <span className="text-[9px] font-black px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md uppercase tracking-wider">{bot.category}</span>
                      </div>
                      <p className="text-sm text-slate-400 font-medium line-clamp-1 italic">"{bot.description}"</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenAddModal(bot)} className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm" title="수정">
                          <Edit3 size={18} />
                        </button>
                        <button onClick={() => handleDeleteBot(bot.id)} className="p-3 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm" title="삭제">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                    <a href={bot.url} target="_blank" rel="noopener noreferrer" className="btn-secondary h-12 px-8 text-xs font-black border-blue-100 hover:border-blue-600 hover:shadow-lg transition-all group-hover:bg-blue-600 group-hover:text-white whitespace-nowrap">
                      <span>챗봇 시작하기</span>
                      <ArrowUpRight size={16} />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-24 bg-white rounded-[40px] border border-dashed border-blue-100">
                <p className="text-slate-400 font-black italic opacity-60">등록된 AI 챗봇이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modern Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl border border-white overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-10 py-8 bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">
                  {editingBotId ? '지침 챗봇 정보 수정' : '새 지침 챗봇 추가'}
                </h2>
                <p className="text-blue-100 text-xs font-bold mt-1 uppercase tracking-widest">NotebookLM AI Registration</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmitBot} className="p-10 space-y-8 text-sm">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-3 px-1 uppercase tracking-widest">지침 제목</label>
                  <input required type="text" placeholder="예: 2026 예산편성 기본지침" value={newBot.title} onChange={e => setNewBot({...newBot, title: e.target.value})} className="modern-input h-14 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-3 px-1 uppercase tracking-widest">카테고리 분류</label>
                  <select value={newBot.category} onChange={e => setNewBot({...newBot, category: e.target.value})} className="modern-input h-14 appearance-none font-bold text-blue-600">
                    {CATEGORIES.slice(1).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-3 px-1 uppercase tracking-widest">한 줄 설명</label>
                <input required type="text" placeholder="챗봇이 어떤 지침을 담당하나요?" value={newBot.description} onChange={e => setNewBot({...newBot, description: e.target.value})} className="modern-input h-14 font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-3 px-1 uppercase tracking-widest">NotebookLM 공유 URL</label>
                <input required type="url" placeholder="https://..." value={newBot.url} onChange={e => setNewBot({...newBot, url: e.target.value})} className="modern-input h-14 font-medium" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1 h-14">취소하기</button>
                <button type="submit" className="btn-primary flex-[2] h-14 text-lg">
                  {editingBotId ? '정보 업데이트' : 'AI 챗봇 등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
