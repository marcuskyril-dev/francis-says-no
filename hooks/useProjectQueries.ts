"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";

import { expenseService } from "@/services/expense.service";
import { projectService } from "@/services/project.service";
import type {
  BudgetMember,
  BudgetMemberIdentity,
  BudgetRole,
  DeliveryScheduleItem,
  Expense,
  Project,
  ProjectDashboardData,
  ZoneDetailData
} from "@/types";

export const queryKeys = {
  projects: ["projects"] as const,
  project: (projectId: string) => ["project", projectId] as const,
  budgetMembers: (projectId: string) => ["budget-members", projectId] as const,
  budgetMemberIdentities: (projectId: string) => ["budget-member-identities", projectId] as const,
  currentBudgetRole: (projectId: string) => ["current-budget-role", projectId] as const,
  projectExpenses: (projectId: string) => ["project-expenses", projectId] as const,
  projectDashboard: (projectId: string) => ["project-dashboard", projectId] as const,
  deliverySchedule: (projectId: string) => ["delivery-schedule", projectId] as const,
  zoneDetail: (zoneId: string) => ["zone-detail", zoneId] as const
};

export const useProjectsQuery = (enabled = true): UseQueryResult<Project[], Error> =>
  useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectService.list,
    enabled
  });

export const useProjectQuery = (
  projectId: string | null,
  enabled = true
): UseQueryResult<Project, Error> =>
  useQuery({
    queryKey: queryKeys.project(projectId ?? "none"),
    queryFn: async () => {
      if (!projectId) {
        throw new Error("Project id is required.");
      }
      return projectService.getById(projectId);
    },
    enabled: Boolean(projectId) && enabled
  });

type CreateBudgetInput = {
  name: string;
  totalBudget: number;
};

export const useCreateBudgetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBudgetInput) =>
      projectService.createBudget(input.name, input.totalBudget),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    }
  });
};

export const useProjectExpensesQuery = (
  projectId: string | null,
  enabled = true
): UseQueryResult<Expense[], Error> =>
  useQuery({
    queryKey: queryKeys.projectExpenses(projectId ?? "none"),
    queryFn: async () => {
      if (!projectId) {
        throw new Error("Project id is required.");
      }
      return expenseService.listByProjectId(projectId);
    },
    enabled: Boolean(projectId) && enabled
  });

export const useProjectDashboardQuery = (
  projectId: string | null,
  enabled = true
): UseQueryResult<ProjectDashboardData | null, Error> =>
  useQuery({
    queryKey: queryKeys.projectDashboard(projectId ?? "none"),
    queryFn: async () => {
      if (!projectId) {
        throw new Error("Project id is required.");
      }

      return projectService.getDashboardDataByBudgetId(projectId);
    },
    enabled: Boolean(projectId) && enabled
  });

export const useDeliveryScheduleQuery = (
  projectId: string | null,
  enabled = true
): UseQueryResult<DeliveryScheduleItem[], Error> =>
  useQuery({
    queryKey: queryKeys.deliverySchedule(projectId ?? "none"),
    queryFn: async () => {
      if (!projectId) {
        throw new Error("Project id is required.");
      }

      return projectService.getDeliveryScheduleByBudgetId(projectId);
    },
    enabled: Boolean(projectId) && enabled
  });

export const useBudgetMembersQuery = (
  projectId: string | null,
  enabled = true
): UseQueryResult<BudgetMember[], Error> =>
  useQuery({
    queryKey: queryKeys.budgetMembers(projectId ?? "none"),
    queryFn: async () => {
      if (!projectId) {
        throw new Error("Project id is required.");
      }
      return projectService.getBudgetMembers(projectId);
    },
    enabled: Boolean(projectId) && enabled
  });

export const useBudgetMemberIdentitiesQuery = (
  projectId: string | null,
  enabled = true
): UseQueryResult<BudgetMemberIdentity[], Error> =>
  useQuery({
    queryKey: queryKeys.budgetMemberIdentities(projectId ?? "none"),
    queryFn: async () => {
      if (!projectId) {
        throw new Error("Project id is required.");
      }
      return projectService.getBudgetMemberIdentities(projectId);
    },
    enabled: Boolean(projectId) && enabled
  });

export const useCurrentBudgetRoleQuery = (
  projectId: string | null,
  enabled = true
): UseQueryResult<BudgetRole | null, Error> =>
  useQuery({
    queryKey: queryKeys.currentBudgetRole(projectId ?? "none"),
    queryFn: async () => {
      if (!projectId) {
        throw new Error("Project id is required.");
      }
      return projectService.getCurrentUserBudgetRole(projectId);
    },
    enabled: Boolean(projectId) && enabled
  });

export const useZoneDetailQuery = (
  zoneId: string | null,
  enabled = true
): UseQueryResult<ZoneDetailData | null, Error> =>
  useQuery({
    queryKey: queryKeys.zoneDetail(zoneId ?? "none"),
    queryFn: async () => {
      if (!zoneId) {
        throw new Error("Zone id is required.");
      }

      return projectService.getZoneDetailById(zoneId);
    },
    enabled: Boolean(zoneId) && enabled
  });

export const useCreateZoneMutation = (projectId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (zoneName: string) => {
      if (!projectId) {
        throw new Error("Project id is required.");
      }

      return projectService.createZone(projectId, zoneName);
    },
    onSuccess: async () => {
      if (!projectId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.projectDashboard(projectId)
      });
    }
  });
};

export const useUpdateZoneNameMutation = (zoneId: string | null, projectId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (zoneName: string) => {
      if (!zoneId) {
        throw new Error("Zone id is required.");
      }

      await projectService.updateZoneName(zoneId, zoneName);
    },
    onSuccess: async () => {
      if (!zoneId) {
        return;
      }

      const invalidateQueries = [queryClient.invalidateQueries({ queryKey: queryKeys.zoneDetail(zoneId) })];
      if (projectId) {
        invalidateQueries.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.projectDashboard(projectId)
          })
        );
      }

      await Promise.all(invalidateQueries);
    }
  });
};

type UpsertBudgetMemberInput = {
  userId: string;
  role: BudgetRole;
  invitedBy?: string | null;
};

export const useUpsertBudgetMemberMutation = (projectId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertBudgetMemberInput) => {
      if (!projectId) {
        throw new Error("Project id is required.");
      }

      return projectService.upsertBudgetMember(projectId, input.userId, input.role, input.invitedBy);
    },
    onSuccess: async () => {
      if (!projectId) {
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.budgetMembers(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.currentBudgetRole(projectId) })
      ]);
    }
  });
};

export const useRemoveBudgetMemberMutation = (projectId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!projectId) {
        throw new Error("Project id is required.");
      }

      await projectService.removeBudgetMember(projectId, userId);
    },
    onSuccess: async () => {
      if (!projectId) {
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.budgetMembers(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.currentBudgetRole(projectId) })
      ]);
    }
  });
};

type InviteBudgetMemberInput = {
  email: string;
  role: BudgetRole;
};

export const useInviteBudgetMemberMutation = (projectId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InviteBudgetMemberInput) => {
      if (!projectId) {
        throw new Error("Project id is required.");
      }

      return projectService.inviteBudgetMemberByEmail(projectId, input.email, input.role);
    },
    onSuccess: async () => {
      if (!projectId) {
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.budgetMembers(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.budgetMemberIdentities(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.currentBudgetRole(projectId) })
      ]);
    }
  });
};

type CreateExpenseInput = {
  wishlistItemId: string;
  amount: number;
  description?: string;
  expenseDate?: string;
};

type UpdateExpenseInput = {
  expenseId: string;
  wishlistItemId: string;
  amount: number;
  description?: string;
  expenseDate?: string;
};

export const useCreateExpenseMutation = (zoneId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      return expenseService.create(input);
    },
    onSuccess: async () => {
      if (!zoneId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.zoneDetail(zoneId)
      });
    }
  });
};

export const useUpdateExpenseMutation = (zoneId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateExpenseInput) => {
      return expenseService.update(input);
    },
    onSuccess: async () => {
      if (!zoneId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.zoneDetail(zoneId)
      });
    }
  });
};

export const useDeleteExpenseMutation = (zoneId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      await expenseService.remove(expenseId);
    },
    onSuccess: async () => {
      if (!zoneId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.zoneDetail(zoneId)
      });
    }
  });
};

type SetWishlistItemScheduleDatesInput = {
  wishlistItemId: string;
  deliveryDate?: string;
  installationDate?: string;
  deliveryScheduled?: boolean;
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonMobile?: string;
  companyBrandName?: string;
};

export const useSetWishlistItemScheduleDatesMutation = (zoneId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SetWishlistItemScheduleDatesInput) => {
      await projectService.setWishlistItemScheduleDates(input.wishlistItemId, {
        deliveryDate: input.deliveryDate,
        installationDate: input.installationDate,
        deliveryScheduled: input.deliveryScheduled,
        contactPersonName: input.contactPersonName,
        contactPersonEmail: input.contactPersonEmail,
        contactPersonMobile: input.contactPersonMobile,
        companyBrandName: input.companyBrandName
      });
    },
    onSuccess: async () => {
      if (!zoneId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.zoneDetail(zoneId)
      });
    }
  });
};

type CreateWishlistItemInput = {
  name: string;
  budget: number;
  mustPurchaseBefore?: string;
};

type UpdateWishlistItemInput = {
  wishlistItemId: string;
  name: string;
  budget: number;
  mustPurchaseBefore?: string;
};

export const useCreateWishlistItemMutation = (zoneId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWishlistItemInput) => {
      if (!zoneId) {
        throw new Error("Zone id is required.");
      }

      return projectService.createWishlistItem(zoneId, input.name, input.budget, {
        mustPurchaseBefore: input.mustPurchaseBefore
      });
    },
    onSuccess: async () => {
      if (!zoneId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.zoneDetail(zoneId)
      });
    }
  });
};

export const useUpdateWishlistItemMutation = (zoneId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateWishlistItemInput) => {
      await projectService.updateWishlistItem(input.wishlistItemId, {
        name: input.name,
        budget: input.budget,
        mustPurchaseBefore: input.mustPurchaseBefore
      });
    },
    onSuccess: async () => {
      if (!zoneId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.zoneDetail(zoneId)
      });
    }
  });
};
