import { useProjectStoreBase } from "@/store/project.store";

export const useProjectStore = () => {
  const selectedProjectId = useProjectStoreBase((state) => state.selectedProjectId);
  const setSelectedProjectId = useProjectStoreBase((state) => state.setSelectedProjectId);
  const resetSelectedProject = useProjectStoreBase((state) => state.resetSelectedProject);

  return { selectedProjectId, setSelectedProjectId, resetSelectedProject };
};
