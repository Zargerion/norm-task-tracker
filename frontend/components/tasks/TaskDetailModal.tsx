'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Edit2, Clock, MessageSquare, Paperclip, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getColor, getTaskComplexity } from '@/lib/colors';
import { api } from '@/lib/api';

interface Props {
  task: any;
  spaceId: string;
  projectId: string;
  user: any;
  role: string;
  onClose: () => void;
  onEdit: () => void;
}

const STATUS_STEPS = ['CREATED', 'ACCEPTED', 'COMPLETED', 'APPROVED'];
const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Создано', ACCEPTED: 'Принято', COMPLETED: 'Завершено', APPROVED: 'Одобрено',
};

function complexityTier(hours: number | null | undefined): number {
  if (!hours || hours <= 3) return 1;
  if (hours <= 5) return 2;
  if (hours <= 8) return 3;
  if (hours <= 20) return 4;
  return 5;
}

export function TaskDetailModal({ task, spaceId, projectId, user, role, onClose, onEdit }: Props) {
  const canManage = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role);
  const complexity = getTaskComplexity(task.estimatedHours);
  const tier = complexityTier(task.estimatedHours);
  const statusIdx = STATUS_STEPS.indexOf(task.status);

  const [additions, setAdditions] = useState<any[]>([]);
  const [newAddition, setNewAddition] = useState('');
  const [timeMs, setTimeMs] = useState<number | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    api.get(`/spaces/${spaceId}/projects/${projectId}/tasks/${task.id}`)
      .then((t) => setAdditions(t.additions ?? []));
    api.get(`/spaces/${spaceId}/projects/${projectId}/tasks/${task.id}/time`)
      .then((t) => setTimeMs(t.ms))
      .catch(() => {});
  }, [task.id]);

  async function submitAddition() {
    if (!newAddition.trim()) return;
    setAddLoading(true);
    try {
      const a = await api.post(
        `/spaces/${spaceId}/projects/${projectId}/tasks/${task.id}/additions`,
        { content: newAddition },
      );
      setAdditions((prev) => [...prev, a]);
      setNewAddition('');
    } finally {
      setAddLoading(false);
    }
  }

  const totalHours = timeMs ? Math.round((timeMs / 3600000) * 100) / 100 : null;

  const topStrip = tier === 5
    ? `linear-gradient(90deg, #C2185B 0%, #956FD4 35%, #C8773B 65%, #C2185B 100%)`
    : tier === 4
    ? `linear-gradient(90deg, #956FD4, #B08FE8 50%, #956FD4)`
    : complexity.hex;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16"
      style={{ backgroundColor: 'rgba(30,25,15,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-panel rounded-2xl shadow-hover border border-card overflow-hidden flex flex-col max-h-[82vh]"
        style={{ borderLeftWidth: '3px', borderLeftColor: complexity.hex }}
      >
        {/* Complexity strip */}
        <div className="h-[3px] w-full flex-shrink-0" style={{ background: topStrip }} />

        {/* Header */}
        <div className="flex items-start gap-3 px-6 py-4 border-b border-card">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                style={{ backgroundColor: complexity.hex }}
              >
                {STATUS_LABELS[task.status]}
              </span>
              {task.estimatedHours && (
                <span className="text-xs font-medium flex items-center gap-1" style={{ color: complexity.hex }}>
                  <Clock size={11} />
                  {task.estimatedHours}ч · {complexity.label}
                </span>
              )}
              {/* Stars */}
              <div className="flex items-center gap-px leading-none">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '11px',
                      color: i < tier ? complexity.hex : '#D1C9B8',
                      lineHeight: 1,
                      textShadow: i < tier ? `0 0 4px ${complexity.hex}70` : 'none',
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <h2
              className="text-xl font-semibold text-primary leading-snug"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              {task.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {canManage && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-black/5 text-secondary"
                title="Редактировать"
              >
                <Edit2 size={13} />
                <span>Изменить</span>
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
              <X size={18} className="text-muted" />
            </button>
          </div>
        </div>

        {/* Status progress */}
        <div className="px-6 py-3 border-b border-card" style={{ background: 'var(--bg-base)' }}>
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex-1 flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 transition-all duration-300"
                    style={{
                      backgroundColor: i <= statusIdx ? complexity.hex : '#D1C9B8',
                      boxShadow: i === statusIdx ? `0 0 8px ${complexity.hex}90` : 'none',
                      transform: i === statusIdx ? 'scale(1.3)' : 'scale(1)',
                    }}
                  />
                  <span
                    className="text-center transition-colors"
                    style={{
                      fontSize: '11px',
                      color: i === statusIdx ? complexity.hex : 'var(--text-muted)',
                      fontWeight: i === statusIdx ? 600 : 400,
                    }}
                  >
                    {STATUS_LABELS[s]}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className="h-px flex-1 mx-1 transition-colors duration-300"
                    style={{ backgroundColor: i < statusIdx ? complexity.hex : '#D1C9B8', marginBottom: '16px' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Time info */}
          {(task.estimatedHours || totalHours !== null) && (
            <div className="flex items-center gap-6 px-6 py-3 border-b border-card">
              {task.estimatedHours && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Clock size={14} style={{ color: complexity.hex }} />
                  <span className="text-muted">Заявлено:</span>
                  <span className="font-semibold" style={{ color: complexity.hex }}>{task.estimatedHours}ч</span>
                </div>
              )}
              {totalHours !== null && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Clock size={14} className="text-green-500" />
                  <span className="text-muted">Реальное:</span>
                  <span className="font-semibold text-green-600">{totalHours}ч</span>
                </div>
              )}
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Description */}
            {task.description ? (
              <div>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Описание</h3>
                <div
                  className="prose prose-sm max-w-none p-4 rounded-xl border border-soft"
                  style={{ background: 'var(--bg-base)' }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-xl font-semibold text-primary mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-semibold text-primary mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-semibold text-primary mb-1.5">{children}</h3>,
                      p: ({ children }) => <p className="text-sm text-secondary leading-relaxed mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="text-sm text-secondary">{children}</li>,
                      code: ({ children, className }) => {
                        const isBlock = className?.includes('language-');
                        return isBlock ? (
                          <code className="block bg-black/5 rounded-lg px-3 py-2 text-xs font-mono text-primary overflow-x-auto">{children}</code>
                        ) : (
                          <code className="bg-black/7 rounded px-1.5 py-0.5 text-xs font-mono text-primary">{children}</code>
                        );
                      },
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 pl-3 italic text-muted my-2" style={{ borderColor: complexity.hex }}>{children}</blockquote>
                      ),
                      strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                      a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: complexity.hex }}>{children}</a>,
                      hr: () => <hr className="border-card my-3" />,
                    }}
                  >
                    {task.description}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted text-sm">Описание не добавлено</div>
            )}

            {/* Assignees + Creator */}
            {(task.assignees?.length > 0 || task.createdBy) && (
              <div className="grid grid-cols-2 gap-4">
                {task.assignees?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">Исполнители</h3>
                    <div className="space-y-1.5">
                      {task.assignees.map((a: any) => {
                        const c = getColor(a.user?.favoriteColor);
                        return (
                          <div key={a.id} className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
                              style={{ backgroundColor: c?.hex ?? '#C8A96E', fontSize: '11px', fontWeight: 600 }}
                            >
                              {a.user?.firstName?.[0]}
                            </div>
                            <span className="text-sm text-secondary truncate">
                              {a.user?.firstName} {a.user?.lastName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {task.createdBy && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">Создал</h3>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const c = getColor(task.createdBy?.favoriteColor);
                        return (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
                            style={{ backgroundColor: c?.hex ?? '#C8A96E', fontSize: '11px', fontWeight: 600 }}
                          >
                            {task.createdBy?.firstName?.[0]}
                          </div>
                        );
                      })()}
                      <span className="text-sm text-secondary">
                        {task.createdBy?.firstName} {task.createdBy?.lastName}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attachments */}
            {task.attachments?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Вложения</h3>
                <div className="flex flex-wrap gap-3">
                  {task.attachments.map((att: any) =>
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
                  )}
                </div>
              </div>
            )}

            {/* Additions / Comments */}
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <MessageSquare size={11} />
                Дополнения
                {additions.length > 0 && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: complexity.hex }}
                  >
                    {additions.length}
                  </span>
                )}
              </h3>

              {additions.length > 0 && (
                <div className="space-y-4 mb-4">
                  {additions.map((a: any) => {
                    const c = getColor(a.user?.favoriteColor);
                    return (
                      <div key={a.id} className="flex gap-3">
                        <div
                          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-medium"
                          style={{ backgroundColor: c?.hex ?? '#C8A96E' }}
                        >
                          {a.user?.firstName?.[0]}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-muted mb-1.5">
                            <span className="font-medium text-secondary">{a.user?.firstName} {a.user?.lastName}</span>
                            {' · '}
                            {new Date(a.createdAt).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="prose prose-sm max-w-none bg-base rounded-xl p-3 border border-soft">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{a.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <textarea
                  value={newAddition}
                  onChange={(e) => setNewAddition(e.target.value)}
                  rows={2}
                  placeholder="Добавить дополнение (Markdown)..."
                  className="flex-1 px-3 py-2 rounded-xl border border-soft bg-base text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitAddition();
                  }}
                />
                <button
                  onClick={submitAddition}
                  disabled={addLoading || !newAddition.trim()}
                  className="self-end p-2.5 rounded-xl text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${complexity.hex} 0%, ${complexity.hex}bb 100%)` }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
