'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MessageSquare, Edit2, UserCheck } from 'lucide-react';
import { getTaskComplexity, getColor } from '@/lib/colors';
import { api } from '@/lib/api';

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

interface Props {
  task: any;
  role: string;
  spaceId: string;
  projectId: string;
  onClick: () => void;
  onEdit: () => void;
  onStatusChange: (task: any) => void;
}

export function TaskCard({ task, role, spaceId, projectId, onClick, onEdit, onStatusChange }: Props) {
  const [hovered, setHovered] = useState(false);
  const complexity = getTaskComplexity(task.estimatedHours);
  const tier = complexityTier(task.estimatedHours);
  const isRelic = tier === 5;
  const isLegendary = tier === 4;
  const isUnique = tier === 3;
  const statusIdx = STATUS_STEPS.indexOf(task.status);
  const canManage = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role);

  async function advance(e: React.MouseEvent) {
    e.stopPropagation();
    const next = STATUS_STEPS[statusIdx + 1];
    if (!next) return;
    if ((next === 'ACCEPTED' || next === 'APPROVED') && !canManage) return;
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

  const shimmerClass = isRelic ? 'relic-shimmer task-glow-relic' : isLegendary ? 'legendary-shimmer task-glow-legendary' : isUnique ? 'epic-shimmer' : '';

  // Top strip gradient
  const topStrip = isRelic
    ? `linear-gradient(90deg, #C2185B 0%, #956FD4 35%, #C8773B 65%, #C2185B 100%)`
    : isLegendary
    ? `linear-gradient(90deg, #C8773B 0%, #FFB13C 40%, #E8920A 60%, #C8773B 100%)`
    : complexity.hex;

  return (
    <div
      className={`relative rounded-xl cursor-pointer select-none overflow-hidden transition-all duration-200 ${shimmerClass}`}
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: `1px solid ${complexity.hex}45`,
        boxShadow: hovered
          ? `${complexity.glow || 'var(--shadow-hover)'}, inset 0 0 0 1px ${complexity.hex}20`
          : 'var(--shadow-card)',
        transform: hovered ? 'translateY(-2px) scale(1.008)' : 'none',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top complexity strip */}
      <div className="h-[3px] w-full flex-shrink-0" style={{ background: topStrip }} />

      {/* Ambient tint for unique/epic/relic */}
      {tier >= 3 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${complexity.hex}07 0%, transparent 65%)`,
          }}
        />
      )}

      {/* Expanded status tracker on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3 pt-2.5">
              {/* Dots + line */}
              <div className="flex items-center gap-0 mb-1">
                {STATUS_STEPS.map((s, i) => (
                  <div key={s} className="flex-1 flex items-center">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-300"
                      style={{
                        backgroundColor: i <= statusIdx ? complexity.hex : '#D1C9B8',
                        boxShadow: i === statusIdx ? `0 0 7px ${complexity.hex}90` : 'none',
                        transform: i === statusIdx ? 'scale(1.35)' : 'scale(1)',
                      }}
                    />
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className="h-px flex-1 mx-0.5 transition-colors duration-300"
                        style={{ backgroundColor: i < statusIdx ? complexity.hex : '#D1C9B8' }}
                      />
                    )}
                  </div>
                ))}
              </div>
              {/* Labels */}
              <div className="flex mb-1.5">
                {STATUS_STEPS.map((s, i) => (
                  <span
                    key={s}
                    className="flex-1 text-center transition-colors"
                    style={{
                      fontSize: '11px',
                      color: i === statusIdx ? complexity.hex : 'var(--text-muted)',
                      fontWeight: i === statusIdx ? 600 : 400,
                    }}
                  >
                    {STATUS_LABELS[s]}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-3 py-2.5 pb-3.5">
        {/* Time + star rating */}
        {task.estimatedHours != null && (
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="flex-shrink-0" style={{ color: complexity.hex }} />
              <span className="text-xs font-semibold tabular-nums" style={{ color: complexity.hex }}>
                {task.estimatedHours}ч
              </span>
              <span className="text-xs" style={{ color: `${complexity.hex}90` }}>
                — {complexity.label}
              </span>
            </div>
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
        )}

        {/* Title */}
        <h4 className="text-sm font-semibold text-primary leading-snug mb-1.5">{task.title}</h4>

        {/* Description preview */}
        {task.description && (
          <p
            className="text-xs leading-relaxed mb-2 line-clamp-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            {task.description}
          </p>
        )}

        {/* Bottom row: assignees + actions */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-center gap-2 min-w-0">
            {/* Assignees */}
            {task.assignees?.length > 0 && (
              <div className="flex items-center gap-1" title="Исполнители">
                <UserCheck size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <div className="flex -space-x-1.5">
                  {task.assignees.slice(0, 4).map((a: any) => {
                    const c = getColor(a.user?.favoriteColor);
                    return (
                      <div
                        key={a.id}
                        className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white"
                        style={{ backgroundColor: c?.hex ?? '#C8A96E', fontSize: '10px', fontWeight: 600 }}
                        title={`${a.user?.firstName} ${a.user?.lastName}`}
                      >
                        {a.user?.firstName?.[0]}
                      </div>
                    );
                  })}
                </div>
                {task.assignees.length > 4 && (
                  <span className="text-xs text-muted">+{task.assignees.length - 4}</span>
                )}
              </div>
            )}

            {/* Comment count */}
            {task._count?.additions > 0 && (
              <div className="flex items-center gap-0.5">
                <MessageSquare size={10} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs text-muted">{task._count.additions}</span>
              </div>
            )}
          </div>

          {/* Action buttons on hover */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.15 }}
                className="flex gap-1 flex-shrink-0 items-center"
                onClick={(e) => e.stopPropagation()}
              >
                {canManage && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="p-1 rounded-md hover:bg-black/5 transition-colors"
                    title="Редактировать"
                  >
                    <Edit2 size={12} style={{ color: complexity.hex }} />
                  </button>
                )}
                {statusIdx > 1 && canManage && (
                  <button
                    onClick={retreat}
                    className="px-2 py-0.5 text-xs rounded-md border border-card hover:bg-black/5 text-muted transition-colors"
                  >
                    ←
                  </button>
                )}
                {statusIdx < STATUS_STEPS.length - 1 && (
                  <button
                    onClick={advance}
                    className="px-2.5 py-0.5 text-xs rounded-md text-white transition-all hover:scale-105 hover:brightness-110 font-medium"
                    style={{
                      background: `linear-gradient(135deg, ${complexity.hex} 0%, ${complexity.hex}bb 100%)`,
                      boxShadow: `0 2px 8px ${complexity.hex}40`,
                    }}
                  >
                    →
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Creator */}
        {task.createdBy && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {(() => {
              const c = getColor(task.createdBy?.favoriteColor);
              return (
                <div
                  className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: c?.hex ?? '#C8A96E', fontSize: '10px' }}
                >
                  {task.createdBy?.firstName?.[0]}
                </div>
              );
            })()}
            <span className="text-xs text-muted truncate">
              {task.createdBy?.firstName} {task.createdBy?.lastName}
            </span>
          </div>
        )}
      </div>

      {/* Bottom thin progress strip (always visible) */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 flex overflow-hidden rounded-b-xl">
        {STATUS_STEPS.map((s, i) => (
          <div
            key={s}
            className="flex-1 transition-colors duration-300"
            style={{
              backgroundColor: i <= statusIdx ? `${complexity.hex}70` : `${complexity.hex}18`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
