'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Send, Paperclip, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GENSHIN_COLORS, getColor, getTaskComplexity } from '@/lib/colors';
import { api } from '@/lib/api';

interface Props {
  task: any | null;
  spaceId: string;
  projectId: string;
  user: any;
  role: string;
  onClose: () => void;
  onSaved: (t: any) => void;
  onDeleted: (id: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Создано', ACCEPTED: 'Принято', COMPLETED: 'Завершено', APPROVED: 'Одобрено',
};

export function TaskModal({ task, spaceId, projectId, user, role, onClose, onSaved, onDeleted }: Props) {
  const isEditing = !!task;
  const canManage = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role);
  const canDelete = ['SUPER_ADMIN', 'ADMIN'].includes(role);

  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    estimatedHours: task?.estimatedHours ?? '',
  });
  const [additions, setAdditions] = useState<any[]>([]);
  const [newAddition, setNewAddition] = useState('');
  const [timeMs, setTimeMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    if (task?.id) {
      api.get(`/spaces/${spaceId}/projects/${projectId}/tasks/${task.id}`)
        .then((t) => setAdditions(t.additions ?? []));
      api.get(`/spaces/${spaceId}/projects/${projectId}/tasks/${task.id}/time`)
        .then((t) => setTimeMs(t.ms));
    }
  }, [task?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined };
      const result = task
        ? await api.patch(`/spaces/${spaceId}/projects/${projectId}/tasks/${task.id}`, payload)
        : await api.post(`/spaces/${spaceId}/projects/${projectId}/tasks`, payload);
      onSaved(result);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Удалить задачу?')) return;
    await api.delete(`/spaces/${spaceId}/projects/${projectId}/tasks/${task.id}`);
    onDeleted(task.id);
  }

  async function submitAddition() {
    if (!newAddition.trim() || !task?.id) return;
    setAddLoading(true);
    try {
      const a = await api.post(`/spaces/${spaceId}/projects/${projectId}/tasks/${task.id}/additions`, { content: newAddition });
      setAdditions((prev) => [...prev, a]);
      setNewAddition('');
    } finally {
      setAddLoading(false);
    }
  }

  const complexity = getTaskComplexity(task?.estimatedHours);
  const formComplexity = getTaskComplexity(Number(form.estimatedHours) || null);
  const totalHours = timeMs ? Math.round((timeMs / 3600000) * 100) / 100 : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16" style={{ backgroundColor: 'rgba(30,25,15,0.65)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        className="w-full max-w-2xl bg-panel rounded-2xl shadow-hover border border-card overflow-hidden"
        style={task ? { borderLeftWidth: '4px', borderLeftColor: complexity.hex } : {}}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-card">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-primary" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {task ? task.title : 'Новая задача'}
            </h2>
            {task && (
              <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: complexity.hex }}>
                {STATUS_LABELS[task.status]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {task && canDelete && (
              <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
              <X size={18} className="text-muted" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[75vh]">
          {/* Time info */}
          {task && (task.estimatedHours || totalHours) && (
            <div className="flex items-center gap-4 px-6 py-3 bg-base border-b border-card">
              {task.estimatedHours && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Clock size={14} style={{ color: complexity.hex }} />
                  <span className="text-muted">Заявлено:</span>
                  <span className="font-medium" style={{ color: complexity.hex }}>{task.estimatedHours}ч</span>
                </div>
              )}
              {totalHours !== null && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Clock size={14} className="text-green-500" />
                  <span className="text-muted">Реальное:</span>
                  <span className="font-medium text-green-600">{totalHours}ч</span>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Название *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                disabled={isEditing && !canManage}
                className="w-full px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors disabled:opacity-70" />
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Описание (Markdown)</label>
              {isEditing && !canManage ? (
                <div className="prose prose-sm max-w-none p-3 rounded-lg border border-soft bg-base min-h-24">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.description ?? ''}</ReactMarkdown>
                </div>
              ) : (
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none font-mono" />
              )}
            </div>

            {!isEditing || canManage ? (
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">
                  Ориентировочное время (часов)
                  {form.estimatedHours && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: formComplexity.hex }}>
                      {formComplexity.label}
                    </span>
                  )}
                </label>
                <input type="number" min={0.5} step={0.5} value={form.estimatedHours}
                  onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  placeholder="Например: 4" />
              </div>
            ) : null}

            {(!isEditing || canManage) && (
              <div className="flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-card text-secondary text-sm font-medium hover:bg-black/5 transition-colors">
                  Отмена
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 rounded-xl gold-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
                  {loading ? 'Сохраняем...' : 'Сохранить'}
                </button>
              </div>
            )}
          </form>

          {/* Attachments */}
          {task?.attachments?.length > 0 && (
            <div className="px-6 pb-4">
              <h3 className="text-xs font-semibold text-secondary mb-3 uppercase tracking-wide">Вложения</h3>
              <div className="flex flex-wrap gap-3">
                {task.attachments.map((att: any) => (
                  att.isImage ? (
                    <img key={att.id} src={att.url} alt={att.filename}
                      className="w-24 h-24 object-cover rounded-xl border border-card" />
                  ) : (
                    <a key={att.id} href={att.url} download
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-card hover:bg-black/5 transition-colors text-sm text-secondary">
                      <Paperclip size={13} />
                      {att.filename}
                    </a>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Additions / Comments */}
          {task && (
            <div className="px-6 pb-6 border-t border-card pt-5">
              <h3 className="text-xs font-semibold text-secondary mb-4 uppercase tracking-wide">Дополнения</h3>
              <div className="space-y-4 mb-4">
                {additions.map((a: any) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: '#C8A96E' }}>
                      {a.user?.firstName?.[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-muted mb-1">
                        {a.user?.firstName} {a.user?.lastName} · {new Date(a.createdAt).toLocaleString('ru')}
                      </div>
                      <div className="prose prose-sm max-w-none bg-base rounded-xl p-3 border border-soft">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{a.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea value={newAddition} onChange={(e) => setNewAddition(e.target.value)}
                  rows={2}
                  placeholder="Добавить дополнение (Markdown)..."
                  className="flex-1 px-3 py-2 rounded-xl border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none" />
                <button onClick={submitAddition} disabled={addLoading || !newAddition.trim()}
                  className="self-end p-2.5 rounded-xl gold-gradient text-white disabled:opacity-50 transition-opacity hover:opacity-90">
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
