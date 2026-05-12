'use client';
import { motion } from 'framer-motion';
import { X, Edit2, Calendar, Users, Flag } from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getColor } from '@/lib/colors';

interface Props {
  project: any;
  role: string;
  onClose: () => void;
  onEdit: () => void;
}

const STATUS_STEPS_LABELS = ['Создано', 'Принято', 'Завершено', 'Одобрено'];

export function ProjectDetailModal({ project, role, onClose, onEdit }: Props) {
  const color = getColor(project.color);
  const canManage = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role);
  const milestones: any[] = project.milestones ?? [];
  const now = new Date();

  const timelineStart = new Date(project.createdAt).getTime();
  const lastMs = milestones[milestones.length - 1];
  const timelineEnd = lastMs ? new Date(lastMs.date).getTime() : now.getTime();
  const timelineRange = timelineEnd - timelineStart || 1;
  const progressPct = Math.min(Math.max(((now.getTime() - timelineStart) / timelineRange) * 100, 0), 100);

  function msPct(ms: any) {
    return Math.min(Math.max(((new Date(ms.date).getTime() - timelineStart) / timelineRange) * 100, 0), 100);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(30,25,15,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-panel rounded-2xl shadow-hover border border-card overflow-hidden flex flex-col max-h-[90vh]"
        style={color ? { borderTopWidth: '3px', borderTopColor: color.hex } : {}}
      >
        {/* Header */}
        <div className="flex items-start gap-4 px-6 py-5 border-b border-card">
          {project.imageUrl ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-card shadow-card">
              <Image src={project.imageUrl} alt={project.name} width={56} height={56} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-2xl font-semibold shadow-card"
              style={{ backgroundColor: color?.hex ?? '#C8A96E', fontFamily: 'Cormorant Garamond, serif' }}
            >
              {project.name[0]}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h2
              className="text-2xl font-semibold text-primary leading-tight"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              {project.name}
            </h2>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {new Date(project.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Users size={11} />
                {project.members?.length ?? 0} участников
              </span>
              <span className="flex items-center gap-1">
                <Flag size={11} />
                {milestones.length} вех
              </span>
              {project._count?.tasks != null && (
                <span>{project._count.tasks} задач</span>
              )}
            </div>
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

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Задач', value: project._count?.tasks ?? 0 },
              { label: 'Вех', value: milestones.length },
              { label: 'Участников', value: project.members?.length ?? 0 },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center py-3 rounded-xl border border-card"
                style={{ background: color ? `${color.hex}08` : 'rgba(200,169,110,0.06)' }}
              >
                <span
                  className="text-xl font-semibold"
                  style={{ color: color?.hex ?? 'var(--accent-gold)', fontFamily: 'Cormorant Garamond, serif' }}
                >
                  {value}
                </span>
                <span className="text-xs text-muted mt-0.5">{label}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          {project.description ? (
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
                      <blockquote className="border-l-2 pl-3 italic text-muted my-2" style={{ borderColor: color?.hex ?? 'var(--accent-gold)' }}>{children}</blockquote>
                    ),
                    strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                    a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: color?.hex ?? 'var(--accent-gold)' }}>{children}</a>,
                    hr: () => <hr className="border-card my-3" />,
                  }}
                >
                  {project.description}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted text-sm">Описание не добавлено</div>
          )}

          {/* Timeline */}
          {milestones.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Вехи</h3>
              <div className="space-y-3">
                {/* Progress bar */}
                <div className="relative h-2 bg-black/8 rounded-full overflow-visible mb-4">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${progressPct}%`, backgroundColor: color?.hex ?? '#C8A96E' }}
                  />
                  {milestones.map((ms: any) => {
                    const pct = msPct(ms);
                    const isPast = new Date(ms.date) <= now;
                    return (
                      <div
                        key={ms.id}
                        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white"
                        style={{
                          left: `calc(${pct}% - 7px)`,
                          backgroundColor: isPast ? (color?.hex ?? '#C8A96E') : '#D1C9B8',
                          zIndex: 1,
                        }}
                        title={`${ms.title} — ${new Date(ms.date).toLocaleDateString('ru')}`}
                      />
                    );
                  })}
                </div>

                {milestones.map((ms: any) => {
                  const isPast = new Date(ms.date) <= now;
                  const isNext = !isPast && milestones.find((m: any) => new Date(m.date) > now)?.id === ms.id;
                  return (
                    <div
                      key={ms.id}
                      className="flex items-start gap-3 px-4 py-3 rounded-xl border"
                      style={{
                        borderColor: isNext ? `${color?.hex ?? '#C8A96E'}50` : 'var(--border-soft)',
                        background: isNext ? `${color?.hex ?? '#C8A96E'}06` : 'transparent',
                      }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: isPast ? (color?.hex ?? '#C8A96E') : '#D1C9B8' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${isPast ? 'text-muted line-through' : 'text-primary'}`}>
                            {ms.title}
                          </span>
                          {isNext && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: color?.hex ?? '#C8A96E' }}>
                              следующая
                            </span>
                          )}
                        </div>
                        {ms.description && <p className="text-xs text-muted mt-0.5">{ms.description}</p>}
                      </div>
                      <span className="text-xs text-muted flex-shrink-0 mt-0.5">
                        {new Date(ms.date).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Members */}
          {project.members?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Участники</h3>
              <div className="grid grid-cols-2 gap-2">
                {project.members.map((m: any) => {
                  const mc = getColor(m.user?.favoriteColor);
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-soft bg-base">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                        style={{ backgroundColor: mc?.hex ?? '#C8A96E' }}
                      >
                        {m.user?.firstName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-primary truncate">
                          {m.user?.firstName} {m.user?.lastName}
                        </div>
                        {m.user?.jobTitle && (
                          <div className="text-xs text-muted truncate">{m.user.jobTitle}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
