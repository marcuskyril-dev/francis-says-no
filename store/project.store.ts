import { create } from "zustand";

import type { ProjectState } from "@/types";

export const useProjectStoreBase = create<ProjectState>((set) => ({
  selectedProjectId: null,
  setSelectedProjectId: (projectId) => set({ selectedProjectId: projectId }),
  resetSelectedProject: () => set({ selectedProjectId: null })
}));
