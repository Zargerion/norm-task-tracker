'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  login: string;
  isSuperAdmin: boolean;
  favoriteColor?: string;
  jobTitle?: string;
  spaceUsers: { spaceId: string; role: string }[];
}

export interface Space {
  id: string;
  name: string;
  description?: string | null;
}

interface AuthStore {
  user: User | null;
  currentSpaceId: string | null;
  spaces: Space[];
  setUser: (user: User | null) => void;
  setSpace: (spaceId: string) => void;
  setSpaces: (spaces: Space[]) => void;
  currentRole: () => string | null;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      currentSpaceId: null,
      spaces: [],
      setUser: (user) => {
        const { currentSpaceId } = get();
        const hasAccess = user?.isSuperAdmin ||
          user?.spaceUsers?.some((s) => s.spaceId === currentSpaceId);
        const spaceId = hasAccess
          ? currentSpaceId
          : (user?.spaceUsers?.[0]?.spaceId ?? null);
        set({ user, currentSpaceId: spaceId });
      },
      setSpace: (spaceId) => set({ currentSpaceId: spaceId }),
      setSpaces: (spaces) => set({ spaces }),
      currentRole: () => {
        const { user, currentSpaceId } = get();
        if (!user) return null;
        if (user.isSuperAdmin) return 'SUPER_ADMIN';
        return user.spaceUsers.find((s) => s.spaceId === currentSpaceId)?.role ?? null;
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ currentSpaceId: state.currentSpaceId }),
    },
  ),
);
