'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Phone } from 'lucide-react';

type LoginMode = 'email' | 'phone';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>('phone');
  
  // 邮箱登录状态
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 手机登录状态
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '发送失败');
      }

      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
    } finally {
      setSendingCode(false);
    }
  };

  // 邮箱登录
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('邮箱或密码错误');
      } else {
        router.push('/projects');
        router.refresh();
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 手机验证码登录
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('phone', {
        phone,
        code,
        redirect: false,
      });

      if (res?.error) {
        setError('验证码错误或已过期');
      } else {
        router.push('/projects');
        router.refresh();
      }
    } catch {
      setError('登录失败，请稍后重试');
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
          <h1 className="text-3xl font-bold mb-2 text-center text-white">登录 / 注册</h1>
          <p className="text-gray-400 text-center mb-8">手机验证码登录，新用户自动注册</p>

          {/* 登录方式切换 */}
          <div className="flex mb-6 bg-white/5 rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setMode('phone'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'phone'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Phone size={16} />
              手机登录
            </button>
            <button
              type="button"
              onClick={() => { setMode('email'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'email'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Mail size={16} />
              邮箱登录
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {mode === 'phone' ? (
            <form onSubmit={handlePhoneLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">手机号</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  required
                  maxLength={11}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">验证码</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="请输入验证码"
                    required
                    maxLength={6}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={countdown > 0 || sendingCode}
                    className="px-4 py-3 bg-purple-600/80 text-white rounded-xl font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap min-w-[100px]"
                  >
                    {sendingCode ? (
                      <Loader2 size={16} className="animate-spin mx-auto" />
                    ) : countdown > 0 ? (
                      `${countdown}s`
                    ) : (
                      '获取验证码'
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : '登 录'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
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
                  placeholder="请输入密码"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : '登 录'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center text-sm text-gray-400">
            使用邮箱注册？{' '}
            <Link href="/auth/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              邮箱注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
