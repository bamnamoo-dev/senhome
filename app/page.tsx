import Link from 'next/link';
import { LayoutDashboard, FileText, MessageSquare, Zap, Bell, ChevronRight, Activity, Calendar } from 'lucide-react';

export default function Home() {
  const QUICK_MENUS = [
    { name: '업무 게시판', href: '/board', desc: '공지 및 업무 공유', icon: <LayoutDashboard size={32} />, color: 'bg-blue-50 text-blue-600' },
    { name: '행정 자료실', href: '/archive', desc: '서식 및 공문 보관', icon: <FileText size={32} />, color: 'bg-indigo-50 text-indigo-600' },
    { name: '미니 프로그램', href: '/tools', desc: '업무 자동화 도구', icon: <Zap size={32} />, color: 'bg-amber-50 text-amber-600' },
    { name: 'AI 지침 챗봇 (구글 ID 필요)', href: '/chatbot', desc: '24시간 지침 안내', icon: <MessageSquare size={32} />, color: 'bg-emerald-50 text-emerald-600' },
    { name: '준비 중', href: '#', desc: '신규 업데이트 예정', icon: <Bell size={32} />, color: 'bg-slate-50 text-slate-300' },
  ];

  return (
    <div className="min-h-screen bg-md-surface relative flex flex-col items-center pt-0">
      {/* Background Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[400px] bg-gradient-to-b from-blue-50/50 to-transparent -z-10 rounded-full blur-3xl"></div>
      
      <main className="max-w-[900px] w-full px-6 flex flex-col gap-6 -mt-8">
        {/* Balanced & High Header */}
        <header className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-blue-100 rounded-full shadow-sm mb-3">
            <Activity size={14} className="text-blue-600 animate-pulse" />
            <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">I-SENSE CONTROL</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            안녕하세요, <span className="text-blue-600">교육행정 공유 사이트</span>입니다.
          </h1>
          <p className="text-slate-400 font-medium text-sm mt-1">원하시는 업무 메뉴를 선택하세요.</p>
        </header>

        {/* Restored Premium Grid Layout */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top 3 Menus */}
            {QUICK_MENUS.slice(0, 3).map((menu, idx) => (
              <Link 
                key={idx} 
                href={menu.href}
                className="group bg-white border border-blue-50 p-8 flex flex-col items-center text-center gap-4 rounded-[32px] hover:scale-[1.05] hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-300 shadow-xl shadow-blue-100/10"
              >
                <div className={`w-20 h-20 ${menu.color} rounded-[24px] flex items-center justify-center transition-transform group-hover:rotate-6`}>
                  {menu.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{menu.name}</h3>
                  <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{menu.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom 2 Menus - Centered */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[600px] mx-auto w-full">
            {QUICK_MENUS.slice(3, 5).map((menu, idx) => (
              <Link 
                key={idx} 
                href={menu.href}
                className={`group bg-white border border-blue-50 p-6 flex flex-col items-center text-center gap-4 rounded-[32px] hover:scale-[1.05] hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-300 shadow-xl shadow-blue-100/10 ${menu.name.includes('준비 중') ? 'opacity-60 grayscale' : ''}`}
              >
                <div className={`w-20 h-20 ${menu.color} rounded-[24px] flex items-center justify-center transition-transform group-hover:rotate-6`}>
                  {menu.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                    {menu.name.split(' (')[0]}
                  </h3>
                  {menu.name.includes('(') && (
                    <p className="text-[10px] font-bold text-blue-500 mt-0.5 tracking-tight">
                      ({menu.name.split('(')[1]}
                    </p>
                  )}
                  <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{menu.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Minimal Footer */}
        <footer className="mt-4 flex flex-col items-center gap-2 opacity-30">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">I-SENSE STORE</span>
        </footer>
      </main>
    </div>
  );
}
