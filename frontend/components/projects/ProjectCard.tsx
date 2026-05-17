'use client';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Calendar, Users } from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getColor } from '@/lib/colors';
import { api } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

const TOOLTIP_W = 360;
const TOOLTIP_H = 420;
const GAP = 10;

interface Props {
  project: any;
  role: string;
  spaceId: string;
  onView: (project: any) => void;
  onEdit: (project: any) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, role, spaceId, onView, onEdit, onDelete }: Props) {
  const { dark } = useTheme();
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const color = getColor(project.color);

  const handleMouseEnter = useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // По горизонтали: центрируем по карточке, но не выходим за края
    let left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    left = Math.max(GAP, Math.min(left, vw - TOOLTIP_W - GAP));

    // По вертикали: сначала пробуем снизу карточки
    let top = rect.bottom + GAP;
    if (top + TOOLTIP_H > vh - GAP) {
      // Не влезает снизу — показываем сверху
      top = rect.top - TOOLTIP_H - GAP;
    }
    // Если и сверху не влезает — прижимаем к видимой области
    top = Math.max(GAP, Math.min(top, vh - TOOLTIP_H - GAP));

    setTooltipPos({ top, left });
    setHovered(true);
  }, []);
  const canManage = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role);
  const canDelete = ['SUPER_ADMIN', 'ADMIN'].includes(role);

  async function handleDelete() {
    if (!confirm(`Удалить проект "${project.name}"?`)) return;
    await api.delete(`/spaces/${spaceId}/projects/${project.id}`);
    onDelete(project.id);
  }

  const milestones = project.milestones ?? [];
  const now = new Date();
  const firstMs = milestones[0];
  const lastMs = milestones[milestones.length - 1];

  const nextMilestone = milestones.find((ms: any) => new Date(ms.date) > now);
  const daysLeft = nextMilestone
    ? Math.ceil((new Date(nextMilestone.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const timelineStart = new Date(project.createdAt).getTime();
  const timelineEnd = lastMs ? new Date(lastMs.date).getTime() : now.getTime();
  const timelineRange = timelineEnd - timelineStart || 1;

  const progressPct = Math.min(Math.max(
    ((now.getTime() - timelineStart) / timelineRange) * 100, 0
  ), 100);

  function msPct(ms: any) {
    return Math.min(Math.max(
      ((new Date(ms.date).getTime() - timelineStart) / timelineRange) * 100, 0
    ), 100);
  }

  return (
    <div
      ref={cardRef}
      className="relative cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onView(project)}
    >
    <div className="genshin-card overflow-hidden group">
      {/* Color strip */}
      {color && (
        <div className="h-1 w-full" style={{ backgroundColor: color.hex }} />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {project.imageUrl ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-card">
              <Image src={project.imageUrl} alt={project.name} width={48} height={48} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-lg font-medium"
              style={{ backgroundColor: color?.hex ?? '#C8A96E' }}>
              {project.name[0]}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-primary truncate">{project.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted">
              <span className="flex items-center gap-1"><Users size={11} />{project.members?.length ?? 0}</span>
              <span className="flex items-center gap-1"><Calendar size={11} />{milestones.length} вех</span>
              {project._count?.tasks != null && <span>{project._count.tasks} задач</span>}
            </div>
          </div>

          {canManage && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                className="p-1.5 rounded-lg hover:bg-black/5 transition-colors text-muted hover:text-secondary"
                title="Редактировать"
              >
                <Edit2 size={14} />
              </button>
              {canDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted hover:text-red-500"
                  title="Удалить"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Timeline */}
        {milestones.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted">{nextMilestone?.title ?? lastMs?.title}</span>
              {daysLeft !== null ? (
                <span className="font-medium tabular-nums" style={{ color: daysLeft <= 3 ? '#C2185B' : daysLeft <= 7 ? '#C8773B' : 'var(--accent-gold)' }}>
                  {daysLeft === 0 ? 'Сегодня' : daysLeft > 0 ? `${daysLeft} дн.` : `+${Math.abs(daysLeft)} дн.`}
                </span>
              ) : (
                <span className="text-muted text-xs">завершено</span>
              )}
            </div>
            <div className="timeline-track relative h-1.5 rounded-full overflow-visible">
              {/* Бегущий свет по всему треку в тёмной теме */}
              {dark && (
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(90deg, transparent 15%, ${color?.hex ?? '#C8A96E'}55 50%, transparent 85%)`,
                    animation: 'timelineShimmer 7s ease-in-out infinite',
                  }} />
                </div>
              )}
              {/* Прогресс */}
              <div
                className="timeline-bar absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: color?.hex ?? '#C8A96E',
                  boxShadow: dark ? `0 0 8px ${color?.hex ?? '#C8A96E'}cc, 0 0 16px ${color?.hex ?? '#C8A96E'}55` : undefined,
                }}
              />
              {/* Точки вех */}
              {milestones.map((ms: any) => {
                const pct = msPct(ms);
                const isPast = new Date(ms.date) <= now;
                return (
                  <div key={ms.id}
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
                    style={{
                      left: `calc(${pct}% - 6px)`,
                      backgroundColor: isPast ? (color?.hex ?? '#C8A96E') : (dark ? '#3a3830' : '#D1C9B8'),
                      borderColor: dark ? (isPast ? color?.hex ?? '#C8A96E' : '#4a4840') : '#fff',
                      boxShadow: dark && isPast ? `0 0 8px ${color?.hex ?? '#C8A96E'}bb` : undefined,
                      zIndex: 2,
                    }}
                    title={`${ms.title} — ${new Date(ms.date).toLocaleDateString('ru')}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Member avatars */}
        {project.members?.length > 0 && (
          <div className="flex -space-x-2">
            {project.members.slice(0, 5).map((m: any) => {
              const mc = getColor(m.user?.favoriteColor);
              return (
                <div key={m.id}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium"
                  style={{ backgroundColor: mc?.hex ?? '#C8A96E' }}
                  title={`${m.user?.firstName} ${m.user?.lastName}`}>
                  {m.user?.firstName?.[0]}
                </div>
              );
            })}
            {project.members.length > 5 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                +{project.members.length - 5}
              </div>
            )}
          </div>
        )}
      </div>

    </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 pointer-events-none"
            style={{ top: tooltipPos.top, left: tooltipPos.left, width: TOOLTIP_W }}
          >
            <div className="glass rounded-2xl shadow-hover overflow-hidden"
              style={{ border: `1px solid ${color?.hex ? `${color.hex}40` : 'var(--border-card)'}` }}>
              {/* Цветная полоска */}
              {color && <div className="h-0.5 w-full" style={{ backgroundColor: color.hex }} />}

              <div className="p-4 space-y-3">
                {/* Заголовок */}
                <div className="flex items-center gap-2">
                  {project.imageUrl ? (
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={project.imageUrl} alt={project.name} width={32} height={32} className="object-cover w-full h-full" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                      style={{ backgroundColor: color?.hex ?? '#C8A96E' }}>
                      {project.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-sm text-primary">{project.name}</div>
                    <div className="text-xs text-muted">
                      {new Date(project.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Описание */}
                {project.description && (
                  <div className="prose prose-sm max-h-24 overflow-hidden text-secondary"
                    style={{ maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.description}</ReactMarkdown>
                  </div>
                )}

                {/* Статистика */}
                <div className="flex gap-3 text-xs">
                  <div className="flex flex-col items-center px-3 py-1.5 rounded-lg" style={{ background: 'rgba(200,169,110,0.1)' }}>
                    <span className="font-semibold text-primary">{project._count?.tasks ?? 0}</span>
                    <span className="text-muted">задач</span>
                  </div>
                  <div className="flex flex-col items-center px-3 py-1.5 rounded-lg" style={{ background: 'rgba(200,169,110,0.1)' }}>
                    <span className="font-semibold text-primary">{milestones.length}</span>
                    <span className="text-muted">вех</span>
                  </div>
                  <div className="flex flex-col items-center px-3 py-1.5 rounded-lg" style={{ background: 'rgba(200,169,110,0.1)' }}>
                    <span className="font-semibold text-primary">{project.members?.length ?? 0}</span>
                    <span className="text-muted">участников</span>
                  </div>
                </div>

                {/* Участники */}
                {project.members?.length > 0 && (
                  <div>
                    <div className="text-xs text-muted mb-1.5">Участники</div>
                    <div className="flex flex-col gap-1">
                      {project.members.slice(0, 4).map((m: any) => {
                        const mc = getColor(m.user?.favoriteColor);
                        return (
                          <div key={m.id} className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-medium flex-shrink-0"
                              style={{ backgroundColor: mc?.hex ?? '#C8A96E' }}>
                              {m.user?.firstName?.[0]}
                            </div>
                            <span className="text-xs text-secondary truncate">{m.user?.firstName} {m.user?.lastName}</span>
                          </div>
                        );
                      })}
                      {project.members.length > 4 && (
                        <span className="text-xs text-muted">+{project.members.length - 4} ещё</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Ближайшая веха */}
                {milestones.length > 0 && (() => {
                  const next = milestones.find((ms: any) => new Date(ms.date) > now);
                  if (!next) return null;
                  return (
                    <div className="flex items-center gap-2 text-xs pt-1 border-t border-card">
                      <Calendar size={11} className="text-muted flex-shrink-0" />
                      <span className="text-muted">Следующая веха:</span>
                      <span className="text-secondary font-medium truncate">{next.title}</span>
                      <span className="text-muted ml-auto flex-shrink-0">
                        {new Date(next.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

