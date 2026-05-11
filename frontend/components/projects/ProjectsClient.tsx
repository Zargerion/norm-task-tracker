'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Building2 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { ProjectCard } from './ProjectCard';
import { ProjectModal } from './ProjectModal';

interface Props {
  user: any;
}

export function ProjectsClient({ user }: Props) {
  const { currentSpaceId, currentRole } = useAuthStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const role = currentRole() ?? 'EMPLOYEE';
  const canCreate = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role);

  useEffect(() => {
    if (!currentSpaceId) {
      setProjects([]);
      return;
    }
    setLoading(true);
    api.get(`/spaces/${currentSpaceId}/projects`)
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [currentSpaceId]);

  function onSaved(project: any) {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === project.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = project; return next; }
      return [project, ...prev];
    });
    setModalOpen(false);
    setEditing(null);
  }

  function onDelete(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  if (!currentSpaceId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 text-center px-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(200,169,110,0.12)' }}>
          <Building2 size={26} style={{ color: 'var(--accent-gold)' }} />
        </div>
        <h2 className="text-xl font-semibold text-primary mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Пространство не выбрано
        </h2>
        <p className="text-muted text-sm max-w-xs">
          {user.isSuperAdmin
            ? 'Создайте пространство в разделе «Пространства», затем выберите его в боковом меню.'
            : 'Вы не добавлены ни в одно пространство. Обратитесь к администратору.'}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-primary" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Проекты
          </h1>
          <p className="text-muted text-sm mt-0.5">{projects.length} проект{projects.length !== 1 ? 'ов' : ''}</p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gold-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            <span>Новый проект</span>
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🗂</div>
          <p className="text-muted">Проектов пока нет</p>
          {canCreate && (
            <button onClick={() => setModalOpen(true)} className="mt-4 text-sm font-medium" style={{ color: '#C8773B' }}>
              Создать первый проект →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {projects.map((project, i) => (
              <motion.div key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
              >
                <ProjectCard
                  project={project}
                  role={role}
                  spaceId={currentSpaceId}
                  onEdit={(p) => { setEditing(p); setModalOpen(true); }}
                  onDelete={onDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <ProjectModal
            project={editing}
            spaceId={currentSpaceId}
            onClose={() => { setModalOpen(false); setEditing(null); }}
            onSaved={onSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
