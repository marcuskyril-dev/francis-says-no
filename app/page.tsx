"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AddZoneDialog } from "@/components/dashboard/add-zone-dialog";
import { BudgetProgressBar } from "@/components/dashboard/budget-progress-bar";
import { BudgetMembersRow } from "@/components/dashboard/budget-members-row";
import { CreateBudgetDialog } from "@/components/dashboard/create-budget-dialog";
import { ZoneCard } from "@/components/dashboard/zone-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  useBudgetMemberIdentitiesQuery,
  useCreateBudgetMutation,
  useCreateZoneMutation,
  useCurrentBudgetRoleQuery,
  useProjectDashboardQuery,
  useProjectsQuery
} from "@/hooks/useProjectQueries";
import { useProjectStore } from "@/hooks/useProjectStore";

const formatCurrency = (amount: number, currency: string): string =>
  new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(amount);

const HomePage = () => {
  const { user } = useAuth();
  const { selectedProjectId, setSelectedProjectId } = useProjectStore();
  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    error: projectsError
  } = useProjectsQuery(Boolean(user));
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError
  } = useProjectDashboardQuery(selectedProjectId, Boolean(user));
  const createBudgetMutation = useCreateBudgetMutation();
  const createZoneMutation = useCreateZoneMutation(selectedProjectId);
  const { data: currentBudgetRole } = useCurrentBudgetRoleQuery(selectedProjectId, Boolean(user));
  const { data: budgetMemberIdentities = [] } = useBudgetMemberIdentitiesQuery(
    selectedProjectId,
    Boolean(user)
  );
  const [isAddZoneDialogOpen, setIsAddZoneDialogOpen] = useState(false);
  const [isCreateBudgetDialogOpen, setIsCreateBudgetDialogOpen] = useState(false);
  const [isBudgetDropdownOpen, setIsBudgetDropdownOpen] = useState(false);
  const budgetDropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedProjectName = useMemo(() => {
    const selectedProject = projects.find((project) => project.id === selectedProjectId);
    return selectedProject?.name ?? "No budgets";
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (projects.length === 0) {
      return;
    }

    const hasSelectedProject = projects.some((project) => project.id === selectedProjectId);
    if (!hasSelectedProject) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId, setSelectedProjectId]);

  useEffect(() => {
    if (!isBudgetDropdownOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!budgetDropdownRef.current) {
        return;
      }

      if (!budgetDropdownRef.current.contains(event.target as Node)) {
        setIsBudgetDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isBudgetDropdownOpen]);

  const canEditBudget = currentBudgetRole === "owner" || currentBudgetRole === "admin" || currentBudgetRole === "maintainer";
  const canManageMembers = currentBudgetRole === "owner" || currentBudgetRole === "admin";

  const handleAddZoneSubmit = async (zoneName: string) => {
    if (!canEditBudget) {
      throw new Error("You do not have permission to add zones to this budget.");
    }

    await createZoneMutation.mutateAsync(zoneName);
  };

  const handleCreateBudgetSubmit = async (values: {
    name: string;
    totalBudget: number;
  }): Promise<void> => {
    const createdBudget = await createBudgetMutation.mutateAsync(values);
    setSelectedProjectId(createdBudget.id);
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <header className="mb-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div ref={budgetDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsBudgetDropdownOpen((previousValue) => !previousValue)}
                  disabled={isProjectsLoading || projects.length === 0}
                  className="mt-1 inline-flex min-w-56 items-center gap-3 bg-transparent text-left text-xl md:text-2xl tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  aria-haspopup="listbox"
                  aria-expanded={isBudgetDropdownOpen}
                >
                  <span>{selectedProjectName}</span>
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 bg-black"
                    style={{ clipPath: "polygon(50% 100%, 0 0, 100% 0)" }}
                  />
                </button>

                {isBudgetDropdownOpen ? (
                  <ul
                    role="listbox"
                    className="absolute left-0 z-10 mt-3 min-w-56 bg-background py-2 border-border border w-full"
                  >
                    {projects.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">No budgets</li>
                    ) : (
                      <>
                        {projects.map((project) => (
                          <li key={project.id} role="option" aria-selected={project.id === selectedProjectId}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProjectId(project.id);
                                setIsBudgetDropdownOpen(false);
                              }}
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:hover:bg-zinc-800"
                            >
                              {project.name}
                            </button>
                          </li>
                        ))}
                        {canManageMembers ? (
                          <li role="option" aria-selected={false} className="border-t border-border mt-1 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                createBudgetMutation.reset();
                                setIsCreateBudgetDialogOpen(true);
                                setIsBudgetDropdownOpen(false);
                              }}
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground dark:hover:bg-zinc-800"
                            >
                              + Create a new budget
                            </button>
                          </li>
                        ) : null}
                      </>
                    )}
                  </ul>
                ) : null}
              </div>
            </div>
            {projectsError ? (
              <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{projectsError.message}</p>
            ) : null}
            {dashboardError ? (
              <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{dashboardError.message}</p>
            ) : null}
          </header>

          {isProjectsLoading || isDashboardLoading ? (
            <p className="text-sm text-center text-zinc-600 dark:text-zinc-400">Loading dashboard data...</p>
          ) : null}

          {!isProjectsLoading && !isDashboardLoading && !dashboardData ? (
            <Card className="w-full text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No budget found for this account yet.
              </p>
              <div className="mt-4">
                <Button
                  onClick={() => {
                    createBudgetMutation.reset();
                    setIsCreateBudgetDialogOpen(true);
                  }}
                >
                  Create budget
                </Button>
              </div>
            </Card>
          ) : null}

          <CreateBudgetDialog
            open={isCreateBudgetDialogOpen}
            onOpenChange={(isOpen) => {
              setIsCreateBudgetDialogOpen(isOpen);
              if (!isOpen) {
                createBudgetMutation.reset();
              }
            }}
            onSubmit={handleCreateBudgetSubmit}
            isSubmitting={createBudgetMutation.isPending}
            errorMessage={createBudgetMutation.error?.message ?? null}
          />

          {dashboardData ? (
            <>
              {(() => {
                const allocatedBudget = dashboardData.zones.reduce(
                  (sum, zone) => sum + zone.allocatedBudget,
                  0
                );
                const amountSpent = dashboardData.zones.reduce((sum, zone) => sum + zone.amountSpent, 0);
                const totalAmountSpent =
                  dashboardData.contractExpenseSummary.paidToDate + amountSpent;

                return (
                  <div className="mb-4">
                    <Card className="mb-4 flex flex-col gap-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <p className="text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Budget</p>
                          <h2 className="text-lg font-semibold tracking-tight">{dashboardData.budget.name}</h2>
                          <dl className="text-sm w-full">
                            <div className="flex items-center justify-between gap-3">
                              <dt className="text-zinc-600 dark:text-zinc-400">Total spent</dt>
                              <dd>{formatCurrency(totalAmountSpent, dashboardData.budget.currency)}</dd>
                            </div>
                          </dl>
                        </div>

                        <BudgetMembersRow
                          members={budgetMemberIdentities}
                          projectId={selectedProjectId}
                          canManageMembers={canManageMembers}
                          currentUserId={user?.id ?? null}
                        />
                      </div>
                    </Card>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Card className="flex flex-col gap-4">
                        <h2 className="text-lg font-semibold tracking-tight">Contracts</h2>
                        <div className="flex flex-col gap-2">
                          <dl className="space-y-2 text-sm w-full">
                            <div className="flex items-center justify-between">
                              <dt className="text-zinc-600 dark:text-zinc-400">Contract total</dt>
                              <dd>
                                {formatCurrency(
                                  dashboardData.contractExpenseSummary.totalContractCost,
                                  dashboardData.budget.currency
                                )}
                              </dd>
                            </div>
                            <div className="flex items-center justify-between">
                              <dt className="text-zinc-600 dark:text-zinc-400">Vendor paid to date</dt>
                              <dd>
                                {formatCurrency(
                                  dashboardData.contractExpenseSummary.paidToDate,
                                  dashboardData.budget.currency
                                )}
                              </dd>
                            </div>
                            <div className="flex items-center justify-between">
                              <dt className="text-zinc-600 dark:text-zinc-400">Contract remaining</dt>
                              <dd>
                                {formatCurrency(
                                  dashboardData.contractExpenseSummary.remainingBalance,
                                  dashboardData.budget.currency
                                )}
                              </dd>
                            </div>
                          </dl>

                          <div>
                            <Link href="/contracts" className="text-sm underline underline-offset-4">
                              Manage contract expenses
                            </Link>
                          </div>
                        </div>
                      </Card>

                      <Card className="flex flex-col gap-4">
                        <h2 className="text-lg font-semibold tracking-tight">Appliances and Furniture</h2>
                        <BudgetProgressBar
                          amountSpent={amountSpent}
                          allocatedBudget={allocatedBudget}
                          unbudgetedItems={dashboardData.unbudgetedItems}
                          currency={dashboardData.budget.currency}
                          formatCurrency={formatCurrency}
                        />
                      </Card>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {dashboardData.zones.map((zone) => (
                  <Link key={zone.id} href={`/zones?zoneId=${zone.id}`} className="block">
                    <ZoneCard
                      zone={zone}
                      currency={dashboardData.budget.currency}
                      formatCurrency={formatCurrency}
                    />
                  </Link>
                ))}
                {canEditBudget ? (
                  <AddZoneDialog
                    open={isAddZoneDialogOpen}
                    onOpenChange={(isOpen) => {
                      setIsAddZoneDialogOpen(isOpen);
                      if (!isOpen) {
                        createZoneMutation.reset();
                      }
                    }}
                    onSubmit={handleAddZoneSubmit}
                    isSubmitting={createZoneMutation.isPending}
                    errorMessage={createZoneMutation.error?.message ?? null}
                  />
                ) : null}
              </div>
            </>
          ) : null}
        </section>
      </main>
    </AuthGuard>
  );
};

export default HomePage;
