'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, User } from 'lucide-react';
import { getTaskComplexity, getColor } from '@/lib/colors';
import { api } from '@/lib/api';

const STATUS_STEPS = ['CREATED', 'ACCEPTED', 'COMPLETED', 'APPROVED'];
const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Создано', ACCEPTED: 'Принято', COMPLETED: 'Завершено', APPROVED: 'Одобрено',
};

interface Props {
  task: any;
  role: string;
  spaceId: string;
  projectId: string;
  onClick: () => void;
  onStatusChange: (task: any) => void;
}

export function TaskCard({ task, role, spaceId, projectId, onClick, onStatusChange }: Props) {
  const [hovered, setHovered] = useState(false);
  const complexity = getTaskComplexity(task.estimatedHours);
  const isRelic = (complexity as any).relic;
  const statusIdx = STATUS_STEPS.indexOf(task.status);
  const canManage = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role);

  async function advance(e: React.MouseEvent) {
    e.stopPropagation();
    const next = STATUS_STEPS[statusIdx + 1];
    if (!next) return;
    if (next === 'ACCEPTED' && !canManage) return;
    if (next === 'APPROVED' && !canManage) return;
    const updated = await api.patch(
      `/spaces/${spaceId}/projects/${projectId}/tasks/${task.id}/status`,
      { status: next },
    );
    onStatusChange(updated);
  }

  async function retreat(e: React.MouseEvent) {
    e.stopPropagation();
    if (!canManage) return;
    const prev = STATUS_STEPS[statusIdx - 1];
    if (!prev || prev === 'CREATED') return;
    const updated = await api.patch(
      `/spaces/${spaceId}/projects/${projectId}/tasks/${task.id}/status`,
      { status: prev },
    );
    onStatusChange(updated);
  }

  return (
    <div
      className={`relative rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden select-none ${isRelic ? 'relic-shimmer' : ''}`}
      style={{
        backgroundColor: 'var(--bg-panel)',
        borderColor: complexity.hex,
        borderLeftWidth: '3px',
        boxShadow: hovered ? complexity.glow || 'var(--shadow-hover)' : 'var(--shadow-card)',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Status progress bar on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="px-3 pt-2.5 pb-0"
          >
            <div className="flex items-center gap-1 mb-2">
              {STATUS_STEPS.map((s, i) => (
                <div key={s} className="flex-1 flex items-center">
                  <div
                    className="w-2 h-2 rounded-full transition-colors flex-shrink-0"
                    style={{ backgroundColor: i <= statusIdx ? complexity.hex : '#D1C9B8' }}
                    title={STATUS_LABELS[s]}
                  />
                  {i < STATUS_STEPS.length - 1 && (
                    <div className="h-px flex-1 mx-0.5 transition-colors"
                      style={{ backgroundColor: i < statusIdx ? complexity.hex : '#D1C9B8' }} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-3 py-2.5">
        {/* Time estimate */}
        {task.estimatedHours && (
          <div className="flex items-center gap-1 mb-1.5">
            <Clock size={11} className="flex-shrink-0" style={{ color: complexity.hex }} />
            <span className="text-xs font-medium" style={{ color: complexity.hex }}>
              {task.estimatedHours}ч — {complexity.label}
            </span>
          </div>
        )}

        {/* Title */}
        <h4 className="text-sm font-medium text-primary leading-snug mb-2">{task.title}</h4>

        {/* Creator + Assignees row */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          {/* Assignees */}
          <div className="flex items-center gap-1.5 min-w-0">
            {task.assignees?.length > 0 && (
              <>
                <span className="text-xs text-muted flex-shrink-0">Принял:</span>
                <div className="flex -space-x-1">
                  {task.assignees.slice(0, 3).map((a: any) => {
                    const c = getColor(a.user?.favoriteColor);
                    return (
                      <div key={a.id}
                        className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-white"
                        style={{ backgroundColor: c?.hex ?? '#C8A96E', fontSize: '9px' }}
                        title={`${a.user?.firstName} ${a.user?.lastName}`}>
                        {a.user?.firstName?.[0]}
                      </div>
                    );
                  })}
                </div>
                {task.assignees.length > 3 && (
                  <span className="text-xs text-muted">+{task.assignees.length - 3}</span>
                )}
              </>
            )}
          </div>

          {/* Status action buttons on hover */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex gap-1 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {statusIdx > 1 && canManage && (
                  <button onClick={retreat}
                    className="px-2 py-0.5 text-xs rounded-md border border-card hover:bg-black/5 text-muted transition-colors">
                    ←
                  </button>
                )}
                {statusIdx < STATUS_STEPS.length - 1 && (
                  <button onClick={advance}
                    className="px-2 py-0.5 text-xs rounded-md text-white transition-opacity hover:opacity-80"
                    style={{ backgroundColor: complexity.hex }}>
                    →
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Creator */}
        {task.createdBy && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted">Создал:</span>
            <div className="flex items-center gap-1">
              {(() => {
                const c = getColor(task.createdBy?.favoriteColor);
                return (
                  <div
                    className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: c?.hex ?? '#C8A96E', fontSize: '9px' }}
                  >
                    {task.createdBy?.firstName?.[0]}
                  </div>
                );
              })()}
              <span className="text-xs text-muted truncate">
                {task.createdBy?.firstName} {task.createdBy?.lastName}
              </span>
            </div>
          </div>
        )}

        {task._count?.additions > 0 && (
          <div className="mt-1.5 text-xs text-muted">💬 {task._count.additions}</div>
        )}
      </div>
    </div>
  );
}
