'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LogoTooltip } from '@/components/ui/LogoTooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { getColor } from '@/lib/colors';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { useTheme } from '@/hooks/useTheme';
import {
  FolderOpen, Users, Kanban, BookOpen, Globe2,
  LogOut, ChevronDown, Menu, X, Building2, UserCog,
  Sun, Moon,
} from 'lucide-react';

interface Props {
  user: any;
  children: React.ReactNode;
}

function getPageGlow(pathname: string): string {
  if (pathname.startsWith('/projects'))
    return `radial-gradient(ellipse at 88% 6%, rgba(212,160,64,0.14) 0%, transparent 52%),
            radial-gradient(ellipse at 8% 88%, rgba(200,119,59,0.08) 0%, transparent 42%)`;
  if (pathname.startsWith('/trackers'))
    return '';
  if (pathname.startsWith('/users'))
    return `radial-gradient(ellipse at 12% 8%, rgba(78,127,196,0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 82% 88%, rgba(0,191,255,0.07) 0%, transparent 42%)`;
  if (pathname.startsWith('/materials'))
    return `radial-gradient(ellipse at 84% 88%, rgba(126,200,227,0.13) 0%, transparent 50%),
            radial-gradient(ellipse at 14% 12%, rgba(115,201,71,0.07) 0%, transparent 44%)`;
  if (pathname.startsWith('/spaces'))
    return `radial-gradient(ellipse at 50% 4%, rgba(155,89,182,0.14) 0%, transparent 50%),
            radial-gradient(ellipse at 86% 90%, rgba(194,24,91,0.08) 0%, transparent 42%)`;
  return '';
}

const NAV_ITEMS = [
  { href: '/projects', icon: FolderOpen, label: 'Проекты' },
  { href: '/trackers', icon: Kanban, label: 'Трекеры' },
  { href: '/users', icon: Users, label: 'Пользователи' },
  { href: '/materials', icon: BookOpen, label: 'Материалы' },
];

export function AppShell({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { setUser, currentRole, currentSpaceId, setSpace, spaces, setSpaces } = useAuthStore();
  const { dark, toggle: toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [spaceMenuOpen, setSpaceMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [localUser, setLocalUser] = useState(user);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const spaceMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setUser(user); setLocalUser(user); }, [user, setUser]);

  useEffect(() => {
    async function loadSpaces() {
      if (user.isSuperAdmin) {
        const all = await api.get('/spaces').catch(() => []);
        setSpaces(all);
      } else {
        const userSpaces = user.spaceUsers.map((su: any) => ({
          id: su.spaceId,
          name: su.space?.name ?? su.spaceId,
          description: su.space?.description ?? null,
        }));
        setSpaces(userSpaces);
      }
    }
    loadSpaces();
  }, [user]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (spaceMenuRef.current && !spaceMenuRef.current.contains(e.target as Node)) {
        setSpaceMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function logout() {
    await api.post('/auth/logout', {});
    router.push('/login');
    router.refresh();
  }

  function selectSpace(id: string) {
    setSpace(id);
    setSpaceMenuOpen(false);
    router.refresh();
  }

  const favColor = getColor(localUser.favoriteColor);
  const navItems = [...NAV_ITEMS, { href: '/spaces', icon: Globe2, label: 'Пространства' }];

  const currentSpace = spaces.find((s) => s.id === currentSpaceId);

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col bg-sidebar border-r border-card shadow-card transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="h-14 flex items-center px-4 border-b border-card">
          <LogoTooltip size="sm" />
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={18} className="text-muted" />
          </button>
        </div>

        {/* Space switcher */}
        <div className="px-3 pt-3" ref={spaceMenuRef}>
          <button
            onClick={() => setSpaceMenuOpen(!spaceMenuOpen)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-card bg-panel hover:bg-black/5 transition-colors text-left"
          >
            <Building2 size={14} className="text-muted flex-shrink-0" />
            <span className="flex-1 text-sm font-medium text-primary truncate">
              {currentSpace?.name ?? 'Выберите пространство'}
            </span>
            <ChevronDown size={13} className={`text-muted transition-transform flex-shrink-0 ${spaceMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {spaceMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="mt-1 rounded-xl border border-card bg-panel shadow-hover overflow-hidden"
              >
                {spaces.length === 0 ? (
                  <p className="px-3 py-2.5 text-sm text-muted">
                    {user.isSuperAdmin ? 'Нет пространств — создайте первое' : 'Вы не добавлены ни в одно пространство'}
                  </p>
                ) : (
                  spaces.map((space) => (
                    <button
                      key={space.id}
                      onClick={() => selectSpace(space.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors text-left hover:bg-black/5 ${space.id === currentSpaceId ? 'text-primary font-medium' : 'text-secondary'}`}
                    >
                      <span className="flex-1 truncate">{space.name}</span>
                      {space.id === currentSpaceId && (
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent-gold)' }} />
                      )}
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`sidebar-link ${active ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}>
                <item.icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <div className="px-3 pb-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 transition-colors text-left group"
            title={dark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
          >
            <span className="text-muted group-hover:text-secondary transition-colors">
              {dark ? <Moon size={15} /> : <Sun size={15} />}
            </span>
            <span className="flex-1 text-sm text-secondary">
              {dark ? 'Тёмная тема' : 'Светлая тема'}
            </span>
            {/* Тумблер */}
            <div
              className="relative flex-shrink-0 w-9 h-[22px] rounded-full transition-colors"
              style={{
                background: dark
                  ? 'rgba(212,160,64,0.55)'
                  : 'rgba(180,164,140,0.45)',
                boxShadow: dark
                  ? '0 0 10px rgba(212,160,64,0.45), inset 0 1px 2px rgba(0,0,0,0.3)'
                  : 'inset 0 1px 2px rgba(0,0,0,0.15)',
              }}
            >
              <div
                className="absolute top-[3px] w-4 h-4 rounded-full shadow-sm transition-transform"
                style={{
                  transform: dark ? 'translateX(19px)' : 'translateX(3px)',
                  background: dark ? '#E8B84B' : '#fff',
                  boxShadow: dark
                    ? '0 0 6px rgba(232,184,75,0.8)'
                    : '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          </button>
        </div>

        {/* User block */}
        <div className="p-3 border-t border-card" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-black/5 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
              style={{ backgroundColor: favColor?.hex ?? '#C8A96E' }}>
              {localUser.avatarUrl
                ? <Image src={localUser.avatarUrl} alt="avatar" width={32} height={32} className="object-cover w-full h-full" />
                : <>{localUser.firstName[0]}{localUser.lastName[0]}</>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-primary truncate">{localUser.firstName} {localUser.lastName}</div>
              <div className="text-xs text-muted truncate">{currentRole() ?? localUser.login}</div>
            </div>
            <ChevronDown size={14} className={`text-muted transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mt-1 rounded-xl border border-card bg-panel shadow-hover overflow-hidden"
              >
                <button onClick={() => { setProfileOpen(true); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-secondary hover:bg-black/5 transition-colors">
                  <UserCog size={15} />
                  <span>Редактировать профиль</span>
                </button>
                <div className="mx-2 border-t border-card" />
                <button onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-secondary hover:bg-black/5 transition-colors">
                  <LogOut size={15} />
                  <span>Выйти</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden h-14 flex items-center px-4 border-b border-card bg-panel">
          <button onClick={() => setSidebarOpen(true)} className="mr-3">
            <Menu size={20} className="text-secondary" />
          </button>
          <LogoTooltip size="sm" />
        </header>

        <main
          className="flex-1 overflow-y-auto"
          style={dark ? { backgroundImage: getPageGlow(pathname) } : undefined}
        >
          {children}
        </main>
      </div>

      {profileOpen && (
        <ProfileModal
          user={localUser}
          onClose={() => setProfileOpen(false)}
          onUpdated={(updated) => { setLocalUser((prev: any) => ({ ...prev, ...updated })); setUser({ ...localUser, ...updated }); }}
        />
      )}
    </div>
  );
}
