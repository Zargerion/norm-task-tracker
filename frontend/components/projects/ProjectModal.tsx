'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import { GENSHIN_COLORS } from '@/lib/colors';
import { api } from '@/lib/api';

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const result = project
        ? await api.patch(`/spaces/${spaceId}/projects/${project.id}`, payload)
        : await api.post(`/spaces/${spaceId}/projects`, payload);
      onSaved(result);
    } catch (err: any) {
      setError(err.message ?? 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
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
