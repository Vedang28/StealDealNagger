import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLayoutStore = create(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: "sdn_layout",
    },
  ),
);

export default useLayoutStore;
