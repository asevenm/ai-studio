'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Phone } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  
  // 邮箱注册状态
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 邮箱注册
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '注册失败');
      }

      // 注册成功后自动登录
      const loginRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        router.push('/auth/login');
      } else {
        router.push('/projects');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-md w-full mx-4">
        {/* 装饰性背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/20">
          <h1 className="text-3xl font-bold mb-2 text-center text-white">邮箱注册</h1>
          <p className="text-gray-400 text-center mb-8">使用邮箱创建您的账户</p>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">昵称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入昵称"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码 (至少6位)"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <><Mail size={18} /> 注 册</>}
            </button>
          </form>

          {/* 手机号登录入口 */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3 text-gray-300">
              <Phone size={20} className="text-purple-400" />
              <div className="flex-1">
                <p className="text-sm font-medium">手机号快捷登录</p>
                <p className="text-xs text-gray-500">验证码登录，新用户自动注册</p>
              </div>
              <Link 
                href="/auth/login" 
                className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 text-white text-sm rounded-lg transition-all"
              >
                前往
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-400">
            已有账户？{' '}
            <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
