'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Check } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { GENSHIN_COLORS } from '@/lib/colors';

interface Props {
  user: any;
  onClose: () => void;
  onUpdated: (user: any) => void;
}

export function ProfileModal({ user, onClose, onUpdated }: Props) {
  const [form, setForm] = useState({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    jobTitle: user.jobTitle ?? '',
    phone: user.phone ?? '',
    email: user.email ?? '',
    description: user.description ?? '',
    favoriteColor: user.favoriteColor ?? '',
    password: '',
  });
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatarUrl ?? '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await api.upload('/users/me/avatar', form);
      setAvatarUrl(res.avatarUrl);
    } catch (err: any) {
      setError(err.message ?? 'Ошибка загрузки аватара');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const body: any = { ...form };
      if (!body.password) delete body.password;
      const updated = await api.patch('/users/me', body);
      onUpdated({ ...updated, avatarUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message ?? 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  }

  const initials = `${form.firstName[0] ?? ''}${form.lastName[0] ?? ''}`;
  const selectedColor = GENSHIN_COLORS.find(c => c.key === form.favoriteColor);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg mx-4 genshin-card overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-card flex-shrink-0">
            <h2 className="text-lg font-semibold text-primary" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Мой профиль
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
              <X size={18} className="text-muted" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-5">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 flex items-center justify-center"
                    style={{ borderColor: selectedColor?.hex ?? 'var(--accent-gold)' }}>
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="avatar" width={80} height={80} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-2xl font-medium"
                        style={{ backgroundColor: selectedColor?.hex ?? '#C8A96E' }}>
                        {initials}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-card transition-opacity hover:opacity-80"
                    style={{ backgroundColor: selectedColor?.hex ?? '#C8A96E' }}>
                    <Camera size={13} className="text-white" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                    className="hidden" onChange={handleAvatarChange} />
                </div>
                <p className="text-xs text-muted">JPG, PNG или WebP, до 5 МБ</p>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">Имя</label>
                  <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-base text-sm focus:outline-none transition-all"
                    style={{ borderColor: 'var(--border-card)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">Фамилия</label>
                  <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-base text-sm focus:outline-none transition-all"
                    style={{ borderColor: 'var(--border-card)' }} />
                </div>
              </div>

              {/* Job title */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Должность</label>
                <input value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-base text-sm focus:outline-none transition-all"
                  style={{ borderColor: 'var(--border-card)' }} />
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-base text-sm focus:outline-none transition-all"
                    style={{ borderColor: 'var(--border-card)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">Телефон</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-base text-sm focus:outline-none transition-all"
                    style={{ borderColor: 'var(--border-card)' }} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">О себе</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full px-3 py-2 rounded-lg border bg-base text-sm focus:outline-none transition-all resize-none"
                  style={{ borderColor: 'var(--border-card)' }} />
              </div>

              {/* Favorite color */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-2">Цвет профиля</label>
                <div className="flex flex-wrap gap-2">
                  {GENSHIN_COLORS.map(c => (
                    <button key={c.key} type="button" title={c.name}
                      onClick={() => setForm({ ...form, favoriteColor: c.key })}
                      className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                      style={{
                        backgroundColor: c.hex,
                        borderColor: form.favoriteColor === c.key ? '#2C2416' : 'transparent',
                      }}>
                      {form.favoriteColor === c.key && <Check size={12} className="text-white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Новый пароль <span className="text-muted font-normal">(оставьте пустым чтобы не менять)</span></label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border bg-base text-sm focus:outline-none transition-all"
                  style={{ borderColor: 'var(--border-card)' }} />
              </div>

              {error && (
                <div className="text-sm px-3 py-2 rounded-lg border"
                  style={{ color: '#C2185B', background: 'rgba(194,24,91,0.06)', borderColor: 'rgba(194,24,91,0.2)' }}>
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex gap-3 flex-shrink-0">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-card text-secondary text-sm font-medium hover:bg-black/5 transition-colors">
                Отмена
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 rounded-xl gold-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                {saved ? <><Check size={15} /> Сохранено</> : loading ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
