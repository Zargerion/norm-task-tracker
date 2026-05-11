'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle, BarChart2, Layers } from 'lucide-react';
import { getColor, getTaskComplexity } from '@/lib/colors';
import { api } from '@/lib/api';

const TYPE_ORDER = ['Реликварная', 'Особая', 'Уникальная', 'Нормальная', 'Обычная'];
const TYPE_COLORS: Record<string, string> = {
  Реликварная: '#C2185B',
  Особая: '#B08FE8',
  Уникальная: '#956FD4',
  Нормальная: '#4E7FC4',
  Обычная: '#9DADA8',
};

interface Props {
  member: any;
  spaceId: string;
  onClose: () => void;
}

export function UserProfileModal({ member, spaceId, onClose }: Props) {
  const [stats, setStats] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'projects' | 'timeline'>('overview');
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const u = member.user;
  const color = getColor(u?.favoriteColor);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/spaces/${spaceId}/users/${member.userId}/stats`),
      api.get(`/spaces/${spaceId}/users/${member.userId}/completed-tasks`),
    ]).then(([s, t]) => {
      setStats(s);
      setTasks(t);
    }).finally(() => setLoading(false));
  }, [spaceId, member.userId]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="genshin-card w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-6 border-b border-card flex-shrink-0">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold ring-2 ring-white shadow-lg flex-shrink-0"
              style={{ backgroundColor: color?.hex ?? '#C8A96E' }}
            >
              {u?.firstName?.[0]}{u?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-primary" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {u?.firstName} {u?.lastName}
              </h2>
              {u?.jobTitle && <p className="text-sm text-muted mt-0.5">{u.jobTitle}</p>}
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs text-white"
                style={{ backgroundColor: color?.hex ?? '#C8A96E' }}>
                {member.role === 'ADMIN' ? '👑' : member.role === 'MANAGER' ? '⚡' : '👤'}
                {member.role === 'ADMIN' ? ' Администратор' : member.role === 'MANAGER' ? ' Менеджер' : ' Сотрудник'}
              </div>
            </div>
            <button onClick={onClose} className="text-muted hover:text-primary transition-colors flex-shrink-0">
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
            {[
              { key: 'overview', label: 'Обзор', icon: BarChart2 },
              { key: 'projects', label: 'По проектам', icon: Layers },
              { key: 'timeline', label: 'Таймлайн', icon: Clock },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  tab === key ? 'text-white' : 'text-muted hover:text-primary'
                }`}
                style={tab === key ? { backgroundColor: color?.hex ?? '#C8A96E' } : {}}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin" />
              </div>
            ) : (
              <>
                {/* Overview tab */}
                {tab === 'overview' && stats && (
                  <div className="space-y-6">
                    {/* Total stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <StatCard
                        label="Закрыто задач"
                        value={stats.total}
                        icon={<CheckCircle size={16} />}
                        color={color?.hex ?? '#C8A96E'}
                      />
                      <StatCard
                        label="Потрачено часов"
                        value={stats.totalHours}
                        suffix="ч"
                        icon={<Clock size={16} />}
                        color={color?.hex ?? '#C8A96E'}
                      />
                      <StatCard
                        label="Типов задач"
                        value={Object.keys(stats.byType).length}
                        icon={<Layers size={16} />}
                        color={color?.hex ?? '#C8A96E'}
                      />
                    </div>

                    {/* By task type */}
                    {Object.keys(stats.byType).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-secondary mb-3">По типу задач</h3>
                        <div className="space-y-2">
                          {TYPE_ORDER.filter((t) => stats.byType[t]).map((type) => {
                            const count = stats.byType[type];
                            const pct = Math.round((count / stats.total) * 100);
                            return (
                              <div key={type} className="flex items-center gap-3">
                                <div className="w-20 text-xs text-muted text-right flex-shrink-0">{type}</div>
                                <div className="flex-1 h-2 rounded-full bg-black/10 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: TYPE_COLORS[type] }}
                                  />
                                </div>
                                <div className="w-8 text-xs font-medium text-primary text-right flex-shrink-0">{count}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {stats.total === 0 && (
                      <p className="text-center text-muted text-sm py-8">Нет завершённых задач в этом пространстве</p>
                    )}
                  </div>
                )}

                {/* Projects tab */}
                {tab === 'projects' && stats && (
                  <div className="space-y-4">
                    {stats.projects.length === 0 ? (
                      <p className="text-center text-muted text-sm py-8">Нет данных по проектам</p>
                    ) : (
                      stats.projects.map((p: any) => {
                        const pc = getColor(p.project.color);
                        return (
                          <div key={p.project.id} className="rounded-xl border border-card p-4" style={{ backgroundColor: 'var(--bg-panel)' }}>
                            <div className="flex items-center gap-2 mb-3">
                              {pc && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: pc.hex }} />}
                              <span className="font-medium text-sm text-primary">{p.project.name}</span>
                              <span className="ml-auto text-xs text-muted">{p.total} задач · {p.hours}ч</span>
                            </div>
                            <div className="space-y-1.5">
                              {TYPE_ORDER.filter((t) => p.byType[t]).map((type) => {
                                const count = p.byType[type];
                                const pct = Math.round((count / p.total) * 100);
                                return (
                                  <div key={type} className="flex items-center gap-2">
                                    <div className="w-16 text-xs text-muted text-right flex-shrink-0">{type}</div>
                                    <div className="flex-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.5 }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: TYPE_COLORS[type] }}
                                      />
                                    </div>
                                    <div className="w-6 text-xs font-medium text-primary text-right flex-shrink-0">{count}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Timeline tab */}
                {tab === 'timeline' && (
                  <div className="relative">
                    {tasks.length === 0 ? (
                      <p className="text-center text-muted text-sm py-8">Нет завершённых задач</p>
                    ) : (
                      <div className="relative pl-6">
                        {/* Vertical line */}
                        <div className="absolute left-2 top-0 bottom-0 w-px" style={{ backgroundColor: 'var(--border-card)' }} />

                        <div className="space-y-4">
                          {tasks.map((task: any) => {
                            const complexity = getTaskComplexity(task.estimatedHours);
                            const pc = getColor(task.project?.color);
                            const completedDate = new Date(task.completedAt);
                            return (
                              <div
                                key={task.id}
                                className="relative"
                                onMouseEnter={() => setHoveredTask(task.id)}
                                onMouseLeave={() => setHoveredTask(null)}
                              >
                                {/* Timeline dot */}
                                <div
                                  className="absolute -left-4 top-3 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                                  style={{ backgroundColor: complexity.hex }}
                                />

                                {/* Task card */}
                                <div
                                  className="rounded-xl border p-3 transition-all duration-200"
                                  style={{
                                    backgroundColor: 'var(--bg-panel)',
                                    borderColor: hoveredTask === task.id ? complexity.hex : 'var(--border-card)',
                                    borderLeftWidth: '3px',
                                    borderLeftColor: complexity.hex,
                                    boxShadow: hoveredTask === task.id ? complexity.glow || 'var(--shadow-hover)' : 'var(--shadow-card)',
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        {pc && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pc.hex }} />}
                                        <span className="text-xs text-muted">{task.project?.name}</span>
                                      </div>
                                      <h4 className="text-sm font-medium text-primary leading-snug">{task.title}</h4>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-xs font-medium" style={{ color: complexity.hex }}>{complexity.label}</div>
                                      <div className="text-xs text-muted mt-0.5">
                                        {completedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Hover details */}
                                  <AnimatePresence>
                                    {hoveredTask === task.id && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-2 pt-2 border-t border-card space-y-1.5">
                                          {task.description && (
                                            <p className="text-xs text-muted leading-relaxed">{task.description}</p>
                                          )}
                                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                                            {task.estimatedHours && (
                                              <span className="flex items-center gap-1">
                                                <Clock size={10} />
                                                {task.estimatedHours}ч оценка
                                              </span>
                                            )}
                                            <span>
                                              Создал: {task.createdBy?.firstName} {task.createdBy?.lastName}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-white text-xs`}
                                              style={{ backgroundColor: task.status === 'APPROVED' ? '#C8773B' : '#42A153' }}>
                                              {task.status === 'APPROVED' ? 'Одобрено' : 'Завершено'}
                                            </span>
                                          </div>
                                          {task.assignees?.length > 0 && (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-xs text-muted">Исполнители:</span>
                                              <div className="flex -space-x-1">
                                                {task.assignees.map((a: any) => {
                                                  const ac = getColor(a.user?.favoriteColor);
                                                  return (
                                                    <div
                                                      key={a.id}
                                                      className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-white"
                                                      style={{ backgroundColor: ac?.hex ?? '#C8A96E', fontSize: '8px' }}
                                                      title={`${a.user?.firstName} ${a.user?.lastName}`}
                                                    >
                                                      {a.user?.firstName?.[0]}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                          {task._count?.additions > 0 && (
                                            <span className="text-xs text-muted">💬 {task._count.additions} комментариев</span>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatCard({ label, value, suffix = '', icon, color }: any) {
  return (
    <div className="rounded-xl border border-card p-3 text-center" style={{ backgroundColor: 'var(--bg-panel)' }}>
      <div className="flex justify-center mb-1.5" style={{ color }}>
        {icon}
      </div>
      <div className="text-2xl font-semibold text-primary">
        {value}{suffix}
      </div>
      <div className="text-xs text-muted mt-0.5">{label}</div>
    </div>
  );
}
