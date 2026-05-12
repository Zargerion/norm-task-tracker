'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Bell, BellOff, UserPlus } from 'lucide-react';
import { GENSHIN_COLORS } from '@/lib/colors';
import { api } from '@/lib/api';

interface SpaceUser {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  favoriteColor?: string;
}

interface SpaceUserRecord {
  id: string;
  userId: string;
  role: string;
  user: SpaceUser;
}

interface MemberState {
  userId: string;
  notificationsEnabled: boolean;
}

interface Props {
  project: any | null;
  spaceId: string;
  onClose: () => void;
  onSaved: (p: any) => void;
}

export function ProjectModal({ project, spaceId, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: project?.name ?? '',
    description: project?.description ?? '',
    color: project?.color ?? '',
  });
  const [milestones, setMilestones] = useState<{ title: string; description: string; date: string }[]>(
    project?.milestones?.map((m: any) => ({
      title: m.title,
      description: m.description ?? '',
      date: m.date.split('T')[0],
    })) ?? []
  );
  const [members, setMembers] = useState<MemberState[]>(
    project?.members?.map((m: any) => ({
      userId: m.userId,
      notificationsEnabled: m.notificationsEnabled ?? true,
    })) ?? []
  );
  const [spaceUsers, setSpaceUsers] = useState<SpaceUser[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<SpaceUserRecord[]>(`/spaces/${spaceId}/users`)
      .then((records) => setSpaceUsers(records.map((r) => r.user)))
      .catch(() => {});
  }, [spaceId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let imageUrl = project?.imageUrl;
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        const up = await api.upload<{ url: string }>('/upload', fd);
        imageUrl = up.url;
      }

      const payload = { ...form, color: form.color || undefined, imageUrl, milestones };
      const saved = project
        ? await api.patch(`/spaces/${spaceId}/projects/${project.id}`, payload)
        : await api.post(`/spaces/${spaceId}/projects`, payload);

      await syncMembers(saved.id);

      const updated = await api.get(`/spaces/${spaceId}/projects/${saved.id}`);
      onSaved(updated);
    } catch (err: any) {
      setError(err.message ?? 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  }

  async function syncMembers(projectId: string) {
    const existing: MemberState[] = project?.members?.map((m: any) => ({
      userId: m.userId,
      notificationsEnabled: m.notificationsEnabled ?? true,
    })) ?? [];

    const toRemove = existing.filter((e) => !members.find((m) => m.userId === e.userId));
    const toAdd = members.filter((m) => !existing.find((e) => e.userId === m.userId));
    const toUpdate = members.filter((m) => {
      const ex = existing.find((e) => e.userId === m.userId);
      return ex && ex.notificationsEnabled !== m.notificationsEnabled;
    });

    await Promise.all([
      ...toRemove.map((m) =>
        api.delete(`/spaces/${spaceId}/projects/${projectId}/members/${m.userId}`)
      ),
      ...toAdd.map((m) =>
        api.post(`/spaces/${spaceId}/projects/${projectId}/members`, {
          userId: m.userId,
          notificationsEnabled: m.notificationsEnabled,
        })
      ),
      ...toUpdate.map((m) =>
        api.patch(`/spaces/${spaceId}/projects/${projectId}/members/${m.userId}`, {
          notificationsEnabled: m.notificationsEnabled,
        })
      ),
    ]);
  }

  function addMilestone() {
    setMilestones([...milestones, { title: '', description: '', date: '' }]);
  }

  function removeMilestone(i: number) {
    setMilestones(milestones.filter((_, idx) => idx !== i));
  }

  function updateMilestone(i: number, field: string, val: string) {
    const next = [...milestones];
    next[i] = { ...next[i], [field]: val };
    setMilestones(next);
  }

  function addMember(userId: string) {
    if (members.find((m) => m.userId === userId)) return;
    setMembers([...members, { userId, notificationsEnabled: true }]);
  }

  function removeMember(userId: string) {
    setMembers(members.filter((m) => m.userId !== userId));
  }

  function toggleNotifications(userId: string) {
    setMembers(members.map((m) =>
      m.userId === userId ? { ...m, notificationsEnabled: !m.notificationsEnabled } : m
    ));
  }

  const availableToAdd = spaceUsers.filter((u) => !members.find((m) => m.userId === u.id));

  function getUserInitials(u: SpaceUser) {
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  }

  function getMemberUser(userId: string) {
    return spaceUsers.find((u) => u.id === userId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(30,25,15,0.6)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl bg-panel rounded-2xl shadow-hover border border-card overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-card">
          <h2 className="text-xl font-semibold text-primary" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {project ? 'Редактировать проект' : 'Новый проект'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
            <X size={18} className="text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Название *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Описание (Markdown)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none font-mono" />
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Иконка</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="text-sm text-muted file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-black/5 file:text-secondary hover:file:bg-black/10 cursor-pointer" />
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Цвет</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setForm({ ...form, color: '' })}
                className="w-7 h-7 rounded-full border-2 bg-white transition-transform hover:scale-110"
                style={{ borderColor: !form.color ? '#2C2416' : 'transparent' }}
                title="Без цвета" />
              {GENSHIN_COLORS.map((c) => (
                <button type="button" key={c.key} onClick={() => setForm({ ...form, color: c.key })}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: c.hex, borderColor: form.color === c.key ? '#2C2416' : 'transparent' }}
                  title={c.name} />
              ))}
            </div>
          </div>

          {/* Участники */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-secondary">Участники проекта</label>
              <span className="text-xs text-muted">{members.length} чел.</span>
            </div>

            {members.length > 0 && (
              <div className="space-y-2 mb-3">
                {members.map((m) => {
                  const u = getMemberUser(m.userId);
                  if (!u) return null;
                  const color = GENSHIN_COLORS.find((c) => c.key === u.favoriteColor);
                  return (
                    <div key={m.userId} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-base border border-soft">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: color?.hex ?? '#9DADA8' }}>
                        {getUserInitials(u)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-primary truncate">{u.firstName} {u.lastName}</div>
                        {u.jobTitle && <div className="text-xs text-muted truncate">{u.jobTitle}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNotifications(m.userId)}
                        title={m.notificationsEnabled ? 'Уведомления включены' : 'Уведомления выключены'}
                        className="p-1.5 rounded-lg transition-colors hover:bg-black/5 flex-shrink-0"
                      >
                        {m.notificationsEnabled
                          ? <Bell size={14} style={{ color: '#C8A96E' }} />
                          : <BellOff size={14} className="text-muted" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMember(m.userId)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {availableToAdd.length > 0 && (
              <div className="rounded-xl border border-soft bg-base overflow-hidden">
                <div className="px-3 py-2 border-b border-soft flex items-center gap-1.5 text-xs text-muted">
                  <UserPlus size={12} />
                  <span>Добавить участника</span>
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-soft">
                  {availableToAdd.map((u) => {
                    const color = GENSHIN_COLORS.find((c) => c.key === u.favoriteColor);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => addMember(u.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-black/5 transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                          style={{ backgroundColor: color?.hex ?? '#9DADA8' }}>
                          {getUserInitials(u)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-primary truncate">{u.firstName} {u.lastName}</div>
                          {u.jobTitle && <div className="text-xs text-muted truncate">{u.jobTitle}</div>}
                        </div>
                        <Plus size={14} className="text-muted flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Вехи */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-secondary">Вехи (Timeline)</label>
              <button type="button" onClick={addMilestone}
                className="text-xs flex items-center gap-1 text-secondary hover:text-primary transition-colors">
                <Plus size={12} /> Добавить
              </button>
            </div>
            <div className="space-y-3">
              {milestones.map((ms, i) => (
                <div key={i} className="p-3 rounded-xl bg-base border border-soft space-y-2">
                  <div className="flex gap-2">
                    <input value={ms.title} onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                      placeholder="Название вехи"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-soft bg-panel text-sm focus:outline-none focus:border-amber-400 transition-colors" />
                    <input type="date" value={ms.date} onChange={(e) => updateMilestone(i, 'date', e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-soft bg-panel text-sm focus:outline-none focus:border-amber-400 transition-colors" />
                    <button type="button" onClick={() => removeMilestone(i)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input value={ms.description} onChange={(e) => updateMilestone(i, 'description', e.target.value)}
                    placeholder="Описание (необязательно)"
                    className="w-full px-3 py-1.5 rounded-lg border border-soft bg-panel text-xs focus:outline-none focus:border-amber-400 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-card text-secondary text-sm font-medium hover:bg-black/5 transition-colors">
              Отмена
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl gold-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
              {loading ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
