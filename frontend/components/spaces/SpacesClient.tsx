'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Globe2, Users, Trash2, UserPlus, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

interface Props {
  initialSpaces: any[];
  allUsers: any[];
  isSuperAdmin: boolean;
}

export function SpacesClient({ initialSpaces, allUsers, isSuperAdmin }: Props) {
  const [spaces, setSpaces] = useState(initialSpaces);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [addingMember, setAddingMember] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({ userId: '', role: 'ADMIN' });
  const [loading, setLoading] = useState(false);
  const { setSpace, currentSpaceId } = useAuthStore();

  async function createSpace(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const space = await api.post('/spaces', form);
      setSpaces([...spaces, space]);
      setForm({ name: '', description: '' });
      setCreating(false);
    } finally {
      setLoading(false);
    }
  }

  async function deleteSpace(id: string, name: string) {
    if (!confirm(`Удалить пространство "${name}"? Это удалит все данные.`)) return;
    await api.delete(`/spaces/${id}`);
    setSpaces(spaces.filter((s) => s.id !== id));
  }

  async function addMember(spaceId: string) {
    setLoading(true);
    try {
      await api.post(`/spaces/${spaceId}/members`, memberForm);
      setAddingMember(null);
      setMemberForm({ userId: '', role: 'ADMIN' });
      const updated = await api.get('/spaces');
      setSpaces(updated);
    } finally {
      setLoading(false);
    }
  }

  function switchSpace(id: string) {
    setSpace(id);
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-primary" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Пространства
          </h1>
          <p className="text-muted text-sm mt-0.5">
            {isSuperAdmin ? 'Управление пространствами' : 'Выберите активное пространство'}
          </p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gold-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus size={16} />
            Создать
          </button>
        )}
      </div>

      {/* Create form — super-admin only */}
      <AnimatePresence>
        {creating && isSuperAdmin && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="genshin-card p-6 mb-6">
            <form onSubmit={createSpace} className="space-y-4">
              <h3 className="font-semibold text-primary">Новое пространство</h3>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Название *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Описание</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setCreating(false)}
                  className="flex-1 py-2 rounded-xl border border-card text-secondary text-sm hover:bg-black/5 transition-colors">Отмена</button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2 rounded-xl gold-gradient text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
                  {loading ? '...' : 'Создать'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spaces list */}
      <div className="grid gap-5">
        {spaces.map((space) => {
          const isActive = space.id === currentSpaceId;
          return (
            <motion.div key={space.id} layout className={`genshin-card p-6 ${isActive ? 'ring-1 ring-amber-400/50' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Globe2 size={18} style={{ color: '#C8A96E' }} />
                    <h3 className="font-semibold text-primary text-lg">{space.name}</h3>
                    {isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent-gold)', color: '#fff' }}>
                        Активное
                      </span>
                    )}
                  </div>
                  {space.description && <p className="text-sm text-muted">{space.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-sm text-muted">
                    <Users size={14} />
                    <span>{space._count?.spaceUsers ?? 0} участников</span>
                  </div>

                  {!isActive && (
                    <button onClick={() => switchSpace(space.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-400/50 text-amber-600 hover:bg-amber-50 transition-colors">
                      <Check size={13} />
                      Переключить
                    </button>
                  )}

                  {isSuperAdmin && (
                    <>
                      <button onClick={() => { setAddingMember(space.id); setMemberForm({ userId: '', role: 'ADMIN' }); }}
                        className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" title="Добавить участника">
                        <UserPlus size={16} className="text-secondary" />
                      </button>
                      <button onClick={() => deleteSpace(space.id, space.name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Add member form — super-admin only */}
              <AnimatePresence>
                {addingMember === space.id && isSuperAdmin && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-card">
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-secondary mb-1">Пользователь</label>
                        <select value={memberForm.userId} onChange={(e) => setMemberForm({ ...memberForm, userId: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none">
                          <option value="">Выбрать...</option>
                          {allUsers.map((u: any) => (
                            <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.login})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-secondary mb-1">Роль</label>
                        <select value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                          className="px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none">
                          <option value="ADMIN">Администратор</option>
                          <option value="MANAGER">Менеджер</option>
                          <option value="EMPLOYEE">Сотрудник</option>
                        </select>
                      </div>
                      <button onClick={() => addMember(space.id)} disabled={!memberForm.userId || loading}
                        className="px-4 py-2 rounded-lg gold-gradient text-white text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
                        Добавить
                      </button>
                      <button onClick={() => setAddingMember(null)}
                        className="px-3 py-2 rounded-lg border border-card text-secondary text-sm hover:bg-black/5 transition-colors">
                        Отмена
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {spaces.length === 0 && (
          <div className="text-center py-16 text-muted">
            <Globe2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>{isSuperAdmin ? 'Пространств пока нет' : 'Вы не добавлены ни в одно пространство'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
