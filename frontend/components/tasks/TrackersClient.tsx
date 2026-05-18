'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown } from 'lucide-react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { getColor } from '@/lib/colors';
import { api } from '@/lib/api';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { useTaskSocket } from '@/hooks/useTaskSocket';

const COLUMNS = [
  { status: 'CREATED',   label: 'Создано',   color: '#9DADA8' },
  { status: 'ACCEPTED',  label: 'Принято',   color: '#4E7FC4' },
  { status: 'COMPLETED', label: 'Завершено', color: '#42A153' },
  { status: 'APPROVED',  label: 'Одобрено',  color: '#C8773B' },
];

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} className="flex-1 overflow-y-auto pb-4 px-0.5">{children}</div>;
}

function SortableTaskCard({ task, isDragging, role, spaceId, projectId, onClick, onEdit, onStatusChange }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        role={role}
        spaceId={spaceId}
        projectId={projectId}
        onClick={onClick}
        onEdit={onEdit}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}

interface Props {
  spaceId: string;
  initialProjects: any[];
  user: any;
}

export function TrackersClient({ spaceId, initialProjects, user }: Props) {
  const [projects] = useState(initialProjects);
  const [selectedProject, setSelectedProject] = useState<any>(projects[0] ?? null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<any>(null);
  const [projectSelectOpen, setProjectSelectOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<any>(null);

  const dragStartTaskRef = useRef<any>(null);

  const role = user.isSuperAdmin ? 'SUPER_ADMIN' : user.spaceUsers?.[0]?.role ?? 'EMPLOYEE';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    if (!selectedProject || !spaceId) return;
    setLoading(true);
    api.get(`/spaces/${spaceId}/projects/${selectedProject.id}/tasks`)
      .then(setTasks)
      .finally(() => setLoading(false));
  }, [selectedProject, spaceId]);

  const upsertTask = useCallback((task: any) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === task.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = task; return next; }
      return [...prev, task];
    });
    setSelectedTask((cur: any) => cur?.id === task.id ? task : cur);
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedTask((cur: any) => cur?.id === id ? null : cur);
  }, []);

  useTaskSocket(selectedProject?.id ?? null, {
    onCreated: upsertTask,
    onUpdated: upsertTask,
    onStatus: upsertTask,
    onDeleted: ({ id }) => removeTask(id),
  });

  function onTaskSaved(task: any) { upsertTask(task); setModalOpen(false); setSelectedTask(null); }
  function onTaskDeleted(id: string) { removeTask(id); setModalOpen(false); setSelectedTask(null); }
  function openDetail(task: any) { setDetailTask(task); setDetailOpen(true); }
  function openEdit(task: any) { setSelectedTask(task); setModalOpen(true); }

  function getColumnOfTask(taskId: string) {
    const t = tasks.find((x) => x.id === taskId);
    return t?.status ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
    dragStartTaskRef.current = task ?? null;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const originalStatus = dragStartTaskRef.current?.status;
    const overColStatus = COLUMNS.find((c) => c.status === overId)?.status
      ?? getColumnOfTask(overId);

    if (!originalStatus || !overColStatus || originalStatus === overColStatus) return;

    const originalIdx = COLUMNS.findIndex((c) => c.status === originalStatus);
    const overIdx = COLUMNS.findIndex((c) => c.status === overColStatus);
    if (Math.abs(overIdx - originalIdx) > 1) return;

    setTasks((prev) => prev.map((t) =>
      t.id === activeId ? { ...t, status: overColStatus } : t,
    ));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    console.log('[DnD] dragEnd', { activeId: active.id, overId: over?.id });

    if (!over || !dragStartTaskRef.current) {
      console.log('[DnD] early return — no over or no dragStartTask');
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    const originalStatus = dragStartTaskRef.current.status;
    dragStartTaskRef.current = null;

    const movedTask = tasks.find((t) => t.id === activeId);
    if (!movedTask) return;

    const currentStatus = movedTask.status;
    const statusChanged = originalStatus !== currentStatus;

    // Reorder within target column (must be sorted same as visual render)
    const colTasks = tasks
      .filter((t) => t.status === currentStatus)
      .sort((a, b) => a.position - b.position);
    const overTask = tasks.find((t) => t.id === overId);
    const overIsInSameCol = overTask?.status === currentStatus;

    console.log('[DnD] colTasks (sorted):', colTasks.map(t => ({ id: t.id.slice(0,6), title: t.title, position: t.position })));
    console.log('[DnD] overId:', overId, '| overTask:', overTask ? { id: overTask.id.slice(0,6), status: overTask.status } : null, '| overIsInSameCol:', overIsInSameCol);

    let reorderedCol = colTasks;
    if (overIsInSameCol && activeId !== overId) {
      const oldIdx = colTasks.findIndex((t) => t.id === activeId);
      const newIdx = colTasks.findIndex((t) => t.id === overId);
      console.log('[DnD] arrayMove oldIdx:', oldIdx, '→ newIdx:', newIdx);
      if (oldIdx !== -1 && newIdx !== -1) {
        reorderedCol = arrayMove(colTasks, oldIdx, newIdx);
      }
    } else {
      console.log('[DnD] skipping arrayMove — overIsInSameCol:', overIsInSameCol, 'activeId===overId:', activeId === overId);
    }

    // Assign new positions
    const positionedCol = reorderedCol.map((t, i) => ({ ...t, position: i }));
    setTasks((prev) => {
      const others = prev.filter((t) => t.status !== currentStatus);
      return [...others, ...positionedCol];
    });

    try {
      if (statusChanged) {
        await api.patch(
          `/spaces/${spaceId}/projects/${selectedProject.id}/tasks/${activeId}/status`,
          { status: currentStatus },
        );
      }

      await api.patch(
        `/spaces/${spaceId}/projects/${selectedProject.id}/tasks/reorder`,
        { updates: positionedCol.map((t) => ({ id: t.id, position: t.position })) },
      );
    } catch {
      // rollback on error
      api.get(`/spaces/${spaceId}/projects/${selectedProject.id}/tasks`).then(setTasks);
    }
  }

  const projColor = getColor(selectedProject?.color);

  return (
    <div className="h-full flex flex-col">
      {/* Project selector */}
      <div className="px-6 pt-6 pb-4 border-b border-card">
        <div className="flex items-center justify-between gap-4">
          <div className="relative">
            <button
              onClick={() => setProjectSelectOpen(!projectSelectOpen)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-card bg-panel hover:border-amber-300 transition-colors min-w-52"
            >
              {projColor && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: projColor.hex }} />}
              {selectedProject?.imageUrl && !projColor && (
                <img src={selectedProject.imageUrl} className="w-5 h-5 rounded object-cover" alt="" />
              )}
              <span className="text-sm font-medium text-primary truncate">
                {selectedProject?.name ?? 'Выберите проект'}
              </span>
              <ChevronDown size={14} className={`text-muted ml-auto transition-transform ${projectSelectOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {projectSelectOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-1 left-0 z-20 w-64 bg-panel border border-card rounded-xl shadow-hover overflow-hidden"
                >
                  {projects.map((p) => {
                    const c = getColor(p.color);
                    return (
                      <button key={p.id}
                        onClick={() => { setSelectedProject(p); setProjectSelectOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 transition-colors text-left"
                      >
                        {c && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.hex }} />}
                        <span className="text-sm text-primary truncate">{p.name}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedProject && (
            <button
              onClick={() => { setSelectedTask(null); setModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl gold-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={15} />
              <span>Задача</span>
            </button>
          )}
        </div>
      </div>

      {/* Kanban board */}
      {!selectedProject ? (
        <div className="flex-1 flex items-center justify-center text-muted">Выберите проект</div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-3 border-amber-300 border-t-amber-600 animate-spin" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto p-6">
            <div className="flex gap-4 h-full min-w-max">
              {COLUMNS.map((col) => {
                const colTasks = tasks
                  .filter((t) => t.status === col.status)
                  .sort((a, b) => a.position - b.position);

                return (
                  <div key={col.status} className="flex flex-col w-72 flex-shrink-0">
                    {/* Column header */}
                    <div
                      className="flex items-center gap-2 mb-3 px-3 py-2.5 rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${col.color}14 0%, ${col.color}08 100%)`,
                        border: `1px solid ${col.color}30`,
                      }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: col.color, boxShadow: `0 0 6px ${col.color}80` }}
                      />
                      <span className="text-sm font-semibold" style={{ color: col.color }}>
                        {col.label}
                      </span>
                      <motion.span
                        key={colTasks.length}
                        initial={{ scale: 1.4, opacity: 0.6 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.25 }}
                        className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${col.color}20`,
                          color: col.color,
                          border: `1px solid ${col.color}35`,
                        }}
                      >
                        {colTasks.length}
                      </motion.span>
                    </div>

                    {/* Cards */}
                    <SortableContext
                      items={colTasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <DroppableColumn id={col.status}>
                        <div className="space-y-3">
                          {colTasks.map((task) => (
                            <SortableTaskCard
                              key={task.id}
                              task={task}
                              isDragging={activeTask?.id === task.id}
                              role={role}
                              spaceId={spaceId}
                              projectId={selectedProject.id}
                              onClick={() => openDetail(task)}
                              onEdit={() => openEdit(task)}
                              onStatusChange={(updated: any) => onTaskSaved(updated)}
                            />
                          ))}
                          {colTasks.length === 0 && (
                            <div
                              className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed"
                              style={{ borderColor: `${col.color}25`, color: `${col.color}60` }}
                            >
                              <div className="text-2xl mb-1 opacity-50">○</div>
                              <span className="text-xs font-medium">Нет задач</span>
                            </div>
                          )}
                        </div>
                      </DroppableColumn>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
          </div>

          <DragOverlay>
            {activeTask && (
              <div style={{ transform: 'rotate(2deg)', opacity: 0.95 }}>
                <TaskCard
                  task={activeTask}
                  role={role}
                  spaceId={spaceId}
                  projectId={selectedProject.id}
                  onClick={() => {}}
                  onEdit={() => {}}
                  onStatusChange={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <AnimatePresence>
        {detailOpen && detailTask && selectedProject && (
          <TaskDetailModal
            task={detailTask}
            spaceId={spaceId}
            projectId={selectedProject.id}
            user={user}
            role={role}
            onClose={() => { setDetailOpen(false); setDetailTask(null); }}
            onEdit={() => {
              setDetailOpen(false);
              setSelectedTask(detailTask);
              setDetailTask(null);
              setModalOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && selectedProject && (
          <TaskModal
            task={selectedTask}
            spaceId={spaceId}
            projectId={selectedProject.id}
            user={user}
            role={role}
            onClose={() => { setModalOpen(false); setSelectedTask(null); }}
            onSaved={onTaskSaved}
            onDeleted={onTaskDeleted}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
