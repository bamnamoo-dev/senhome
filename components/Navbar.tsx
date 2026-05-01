'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Zap, MessageSquare, Bell, LogIn, User, Circle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const NAV_ITEMS = [
  { name: '업무 게시판', href: '/board', icon: <LayoutDashboard size={22} /> },
  { name: '행정 자료실', href: '/archive', icon: <FileText size={22} /> },
  { name: '미니 프로그램', href: '/tools', icon: <Zap size={22} /> },
  { name: 'AI 지침 챗봇 (구글 ID 필요)', href: '/chatbot', icon: <MessageSquare size={22} /> },
];

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();
  }, []);

  return (
    <nav className="glass-nav h-16">
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Brand Logo - Compact Style */}
        <Link href="/" className="flex items-center gap-2 mr-6 group shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
            <span className="text-white font-black text-lg italic">I</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-tighter text-blue-900 leading-none">아이센스토어</span>
            <span className="text-[9px] font-bold text-blue-500 tracking-widest mt-0.5 uppercase">Admin</span>
          </div>
        </Link>

        {/* Navigation Links - Compact Symmetrical Style */}
        <div className="flex items-center gap-2 no-scrollbar overflow-hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[15px] font-black transition-all whitespace-nowrap ${
                  isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                  : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4 ml-8 shrink-0">
          {user ? (
            <div className="flex items-center gap-3 pl-2 py-1 group cursor-pointer">
              <div className="flex flex-col items-end hidden lg:block">
                <span className="text-xs font-black text-slate-800">{user.email.split('@')[0]}님</span>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Verified Member</span>
              </div>
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                <User size={20} />
              </div>
            </div>
          ) : (
            <Link href="/login" className="btn-primary py-2 px-5 text-xs">
              <LogIn size={16} />
              <span>로그인</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
