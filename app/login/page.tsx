'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LogIn, Loader2, UserPlus, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      // 회원가입 로직
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('회원가입이 완료되었습니다! 이메일 인증을 확인하거나 바로 로그인해 보세요.');
        setIsSignUp(false); // 가입 후 로그인 모드로 전환
      }
    } else {
      // 로그인 로직
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/');
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-md-surface px-6 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-md-primary/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-md-secondary/5 rounded-full blur-3xl -ml-48 -mb-48"></div>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-md-primary rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-md-primary/20">
            <span className="text-white font-bold text-2xl tracking-tighter italic">SEH</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-md-on-surface">서울 교육 허브</h1>
          <p className="text-md-on-surface-variant mt-2 font-medium">
            {isSignUp ? '시스템 관리자 계정 생성' : '행정 업무 시스템 로그인'}
          </p>
        </div>
        
        <div className="md-card p-8 border border-white/50 shadow-2xl backdrop-blur-sm bg-white/80">
          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-xs font-bold mb-2 text-md-outline px-1 uppercase tracking-wider">이메일 주소</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="office@sen.go.kr"
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-md-surface border border-md-outline/20 focus:border-md-primary focus:ring-4 focus:ring-md-primary/10 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-md-outline px-1 uppercase tracking-wider">비밀번호</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-md-surface border border-md-outline/20 focus:border-md-primary focus:ring-4 focus:ring-md-primary/10 outline-none transition-all"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-xs font-medium">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-xs font-medium">
                {message}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full md-btn-primary py-4 flex items-center justify-center gap-3 mt-4 disabled:opacity-50 shadow-lg"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />
              )}
              <span className="font-bold">{loading ? '처리 중...' : (isSignUp ? '계정 만들기' : '로그인하기')}</span>
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-md-outline/10 text-center">
            {isSignUp ? (
              <button 
                onClick={() => setIsSignUp(false)}
                className="text-sm text-md-on-surface-variant hover:text-md-primary flex items-center justify-center gap-2 mx-auto font-medium transition-colors"
              >
                <ArrowLeft size={16} />
                이미 계정이 있으신가요? 로그인
              </button>
            ) : (
              <p className="text-sm text-md-on-surface-variant font-medium">
                계정이 없으신가요? {' '}
                <button 
                  onClick={() => setIsSignUp(true)}
                  className="text-md-primary font-bold hover:underline"
                >
                  지금 가입 신청
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="mt-10 text-center text-[10px] text-md-outline font-medium">
          © 2026 Seoul Education Hub. All rights reserved.
        </p>
      </div>
    </div>
  );
}
