'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { GENSHIN_COLORS } from '@/lib/colors';

type Step = 'form' | 'code';

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('form');
  const [result, setResult] = useState<{ userId: string; code: string; botUrl?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', login: '', password: '',
    jobTitle: '', favoriteColor: '', description: '', phone: '', email: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ userId: string; code: string; botUrl?: string }>('/register', {
        ...form,
        favoriteColor: form.favoriteColor || undefined,
        jobTitle: form.jobTitle || undefined,
        description: form.description || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
      });
      setResult(res);
      setStep('code');
    } catch (err: any) {
      setError(err.message ?? 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  const botUrl = result?.botUrl ?? '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-base py-8">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #C8A96E 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-4"
      >
        {step === 'form' ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-primary" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Регистрация
              </h1>
              <p className="text-muted text-sm mt-1">Создайте аккаунт и подтвердите его через Telegram</p>
            </div>

            <div className="genshin-card p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1">Имя *</label>
                    <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors" placeholder="Олег" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1">Фамилия *</label>
                    <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors" placeholder="Иванов" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1">Логин *</label>
                    <input required value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors" placeholder="mylogin" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1">Пароль *</label>
                    <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors" placeholder="••••••••" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Должность</label>
                  <input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors" placeholder="Разработчик" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Любимый цвет</label>
                  <div className="flex flex-wrap gap-2">
                    {GENSHIN_COLORS.map((c) => (
                      <button type="button" key={c.key}
                        onClick={() => setForm({ ...form, favoriteColor: form.favoriteColor === c.key ? '' : c.key })}
                        className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c.hex,
                          borderColor: form.favoriteColor === c.key ? '#2C2416' : 'transparent',
                        }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Описание</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none" placeholder="Немного о себе..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1">Телефон</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors" placeholder="+7..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors" placeholder="me@example.com" />
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{error}</div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-lg gold-gradient text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-60 mt-2">
                  {loading ? 'Регистрируемся...' : 'Зарегистрироваться'}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-soft text-center">
                <Link href="/login" className="text-sm text-muted hover:text-primary transition-colors">
                  Уже есть аккаунт? Войти
                </Link>
              </div>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="genshin-card p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-semibold text-primary mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Аккаунт создан!
            </h2>
            <p className="text-secondary text-sm mb-6">Подтвердите его через Telegram-бот</p>

            <div className="bg-base rounded-xl p-5 mb-6 border border-soft">
              <p className="text-xs text-muted mb-2">Ваш код подтверждения:</p>
              <code className="text-sm font-mono text-primary break-all select-all">{result?.code}</code>
            </div>

            <div className="space-y-3">
              {botUrl ? (
                <a href={botUrl} target="_blank" rel="noopener noreferrer"
                  className="block w-full py-3 rounded-xl font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #0088cc, #006699)' }}>
                  📱 Открыть Telegram-бот
                </a>
              ) : (
                <p className="text-sm text-secondary px-2">
                  Для кнопки с прямой ссылкой администратору нужно задать <code className="text-xs bg-base px-1 rounded">BOT_USERNAME</code> в окружении бэкенда (username бота без @). Пока откройте вашего бота в Telegram и после <code className="text-xs">/start</code> вставьте код выше.
                </p>
              )}
              <p className="text-xs text-muted">Нажмите Start в боте — он автоматически использует ваш код и пришлёт ссылку для входа</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
