'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LogoTooltip } from '@/components/ui/LogoTooltip';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/login', form);
      router.push('/projects');
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #C8A96E 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #956FD4 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md mx-4"
      >
        <div className="flex flex-col items-center mb-8 gap-3">
          <LogoTooltip size="lg" />
          <p className="text-muted text-sm">Войдите в свой аккаунт</p>
        </div>

        <div className="genshin-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">Логин</label>
              <input
                type="text"
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border bg-panel text-primary placeholder-muted focus:outline-none transition-all"
                style={{ borderColor: 'var(--border-card)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(200,169,110,0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.boxShadow = 'none'; }}
                placeholder="Ваш логин"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">Пароль</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border bg-panel text-primary placeholder-muted focus:outline-none transition-all"
                style={{ borderColor: 'var(--border-card)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(200,169,110,0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.boxShadow = 'none'; }}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-sm px-4 py-2.5 rounded-lg border" style={{ color: '#C2185B', background: 'rgba(194,24,91,0.06)', borderColor: 'rgba(194,24,91,0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg gold-gradient text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Входим...' : 'Войти'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-soft text-center">
            <p className="text-sm text-muted mb-3">Ещё нет аккаунта?</p>
            <Link href="/register" className="text-sm font-medium text-secondary hover:text-primary transition-colors"
              style={{ color: '#C8773B' }}>
              Зарегистрироваться →
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
