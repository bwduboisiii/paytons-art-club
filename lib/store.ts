import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Kid } from './types';

interface KidStore {
  activeKid: Kid | null;
  setActiveKid: (kid: Kid | null) => void;
  clear: () => void;
}

export const useKidStore = create<KidStore>()(
  persist(
    (set) => ({
      activeKid: null,
      setActiveKid: (kid) => set({ activeKid: kid }),
      clear: () => set({ activeKid: null }),
    }),
    {
      name: 'pac-active-kid',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
