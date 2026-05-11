'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getColor } from '@/lib/colors';
import { api } from '@/lib/api';
import { UserProfileModal } from './UserProfileModal';

interface Props {
  spaceId: string;
  initialMembers: any[];
  currentUser: any;
  role: string;
}

const ROLE_LABELS: Record<string, string> = { ADMIN: 'Администратор', MANAGER: 'Менеджер', EMPLOYEE: 'Сотрудник' };
const ROLE_PYRAMID: Record<string, number> = { ADMIN: 0, MANAGER: 1, EMPLOYEE: 2 };

export function UsersClient({ spaceId, initialMembers, currentUser, role }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [profileMember, setProfileMember] = useState<any>(null);
  const canManage = ['SUPER_ADMIN', 'ADMIN'].includes(role);

  const groups = {
    ADMIN: members.filter((m) => m.role === 'ADMIN'),
    MANAGER: members.filter((m) => m.role === 'MANAGER'),
    EMPLOYEE: members.filter((m) => m.role === 'EMPLOYEE'),
  };

  async function changeRole(userId: string, newRole: string) {
    await api.patch(`/spaces/${spaceId}/users/${userId}`, { role: newRole });
    setMembers((prev) => prev.map((m) => m.userId === userId ? { ...m, role: newRole } : m));
  }

  async function removeMember(userId: string) {
    if (!confirm('Удалить участника из пространства?')) return;
    await api.delete(`/spaces/${spaceId}/users/${userId}`);
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-primary" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Пользователи
        </h1>
        <p className="text-muted text-sm mt-0.5">{members.length} участник{members.length !== 1 ? 'ов' : ''}</p>
      </div>

      {/* Pyramid hierarchy */}
      <div className="space-y-8">
        {(['ADMIN', 'MANAGER', 'EMPLOYEE'] as const).map((groupRole, level) => {
          const group = groups[groupRole];
          if (!group.length && !canManage) return null;
          const widths = ['max-w-lg', 'max-w-2xl', 'max-w-4xl'];
          const bgAlphas = ['0.25', '0.15', '0.08'];

          return (
            <div key={groupRole} className={`mx-auto ${widths[level]}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1" style={{ background: 'var(--border-card)' }} />
                <span className="text-xs font-semibold text-secondary px-3 py-1 rounded-full"
                  style={{ background: `rgba(200,169,110,${bgAlphas[level]})` }}>
                  {ROLE_LABELS[groupRole]} ({group.length})
                </span>
                <div className="h-px flex-1" style={{ background: 'var(--border-card)' }} />
              </div>

              {group.length === 0 ? (
                <div className="text-center py-4 text-muted text-sm">Нет {ROLE_LABELS[groupRole].toLowerCase()}ов</div>
              ) : (
                <div className={`flex flex-wrap justify-center gap-3`}>
                  {group.map((m: any) => (
                    <UserCard
                      key={m.id}
                      member={m}
                      canManage={canManage}
                      isSelf={m.userId === currentUser.id}
                      onRoleChange={changeRole}
                      onRemove={removeMember}
                      onOpenProfile={() => setProfileMember(m)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {profileMember && (
          <UserProfileModal
            member={profileMember}
            spaceId={spaceId}
            onClose={() => setProfileMember(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function UserCard({ member, canManage, isSelf, onRoleChange, onRemove, onOpenProfile }: any) {
  const [menuOpen, setMenuOpen] = useState(false);
  const color = getColor(member.user?.favoriteColor);
  const u = member.user;

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      className="genshin-card p-4 w-52 cursor-pointer relative"
      onClick={onOpenProfile}
    >
      {/* Management menu button */}
      {canManage && !isSelf && (
        <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-6 h-6 flex items-center justify-center rounded-md text-muted hover:text-primary hover:bg-black/5 transition-colors text-sm leading-none"
          >
            ···
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                className="absolute right-0 top-7 z-10 w-44 bg-panel border border-card rounded-xl shadow-hover p-2 space-y-1.5"
              >
                <select
                  value={member.role}
                  onChange={(e) => { onRoleChange(member.userId, e.target.value); setMenuOpen(false); }}
                  className="w-full px-2 py-1 rounded-lg border border-card bg-base text-xs focus:outline-none"
                >
                  <option value="ADMIN">Администратор</option>
                  <option value="MANAGER">Менеджер</option>
                  <option value="EMPLOYEE">Сотрудник</option>
                </select>
                <button
                  onClick={() => { setMenuOpen(false); onRemove(member.userId); }}
                  className="w-full py-1 rounded-lg text-xs text-red-500 hover:bg-red-50 border border-red-100 transition-colors"
                >
                  Удалить
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-medium mb-2 ring-2 ring-white shadow-md"
          style={{ backgroundColor: color?.hex ?? '#C8A96E' }}>
          {u?.firstName?.[0]}{u?.lastName?.[0]}
        </div>

        <div className="font-medium text-sm text-primary">{u?.firstName} {u?.lastName}</div>
        {u?.jobTitle && <div className="text-xs text-muted mt-0.5 truncate w-full">{u.jobTitle}</div>}
        {u?.description && <div className="text-xs text-muted mt-1 line-clamp-2 text-left w-full">{u.description}</div>}

        <div className="mt-2 text-xs px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: color?.hex ?? '#C8A96E' }}>
          {member.role === 'ADMIN' ? '👑' : member.role === 'MANAGER' ? '⚡' : '👤'} {member.role}
        </div>

        <div className="mt-2 text-xs text-muted opacity-60">Нажми для профиля</div>
      </div>
    </motion.div>
  );
}
